"use client";

import { useEffect, useRef } from "react";
import { getSettings, subscribeSettings } from "@/lib/motion-settings";
import styles from "./ImageLiquify.module.css";

/**
 * "Liquify" for every image on the page: dragging the cursor across an image stirs it like
 * liquid under a finger. The image's pixels are pushed along the cursor's path with a bit of
 * swirl, keep flowing, and slowly settle back.
 *
 * How: a small GPU displacement field (half-float ping-pong textures) is updated each frame:
 *   advect (the field carries itself) -> viscosity (smooth) -> relax (decay) -> splat (cursor).
 * A click-through overlay canvas then redraws each on-screen <img> through that field. It only
 * paints where the field is non-zero, so undisturbed images show the original <img> untouched.
 * Skipped for reduced-motion / touch / no WebGL2 float render targets.
 *
 * Opt out: put `data-no-fx` on an <img> (or any ancestor) and it is never touched. Used for logos.
 */

// ---- field pass: fullscreen, y-up field coordinates ----
const FIELD_VERT = `#version 300 es
in vec2 a_pos;
out vec2 v_f;
void main() {
  v_f = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FIELD_FRAG = `#version 300 es
precision highp float;
in vec2 v_f;
out vec4 o;
uniform sampler2D u_prev;
uniform vec2 u_texel;
uniform float u_relax;
uniform float u_visc;
uniform float u_advect;
uniform float u_aspect;
uniform float u_radius;
uniform float u_push;
uniform float u_swirl;
uniform vec2 u_p0;
uniform vec2 u_p1;

void main() {
  vec2 d0 = texture(u_prev, v_f).rg;
  // Semi-Lagrangian advection: the displacement field is carried along by itself.
  vec2 d = texture(u_prev, v_f - d0 * u_advect).rg;
  // Viscosity: blend toward the neighbourhood average.
  vec2 avg = 0.25 * (
    texture(u_prev, v_f + vec2(u_texel.x, 0.0)).rg +
    texture(u_prev, v_f - vec2(u_texel.x, 0.0)).rg +
    texture(u_prev, v_f + vec2(0.0, u_texel.y)).rg +
    texture(u_prev, v_f - vec2(0.0, u_texel.y)).rg);
  d = mix(d, avg, u_visc) * u_relax;

  // Cursor splat along the segment p0 -> p1 (aspect-corrected so the brush is round).
  vec2 A = vec2(u_p0.x * u_aspect, u_p0.y);
  vec2 B = vec2(u_p1.x * u_aspect, u_p1.y);
  vec2 P = vec2(v_f.x * u_aspect, v_f.y);
  vec2 ab = B - A;
  float len2 = dot(ab, ab);
  if (len2 > 1e-10) {
    float t = clamp(dot(P - A, ab) / len2, 0.0, 1.0);
    float dist = length(P - (A + ab * t));
    float g = exp(-(dist * dist) / (u_radius * u_radius));
    vec2 vel = u_p1 - u_p0;
    // Which side of the path this pixel is on decides the swirl direction.
    float side = sign(ab.x * (P.y - A.y) - ab.y * (P.x - A.x));
    vec2 perp = vec2(-vel.y, vel.x);
    d += g * u_push * (vel + side * perp * u_swirl);
  }

  d = clamp(d, vec2(-0.3), vec2(0.3));
  if (dot(d, d) < 1e-10) d = vec2(0.0);
  o = vec4(d, 0.0, 1.0);
}`;

// ---- draw pass: one quad per image, sampled through the field ----
const DRAW_VERT = `#version 300 es
in vec2 a_q;
uniform vec4 u_rect;
uniform vec2 u_vp;
out vec2 v_px;
void main() {
  vec2 p = u_rect.xy + a_q * u_rect.zw;
  v_px = p;
  gl_Position = vec4(p.x / u_vp.x * 2.0 - 1.0, 1.0 - p.y / u_vp.y * 2.0, 0.0, 1.0);
}`;

const DRAW_FRAG = `#version 300 es
precision highp float;
in vec2 v_px;
out vec4 o;
uniform sampler2D u_field;
uniform sampler2D u_image;
uniform vec2 u_vp;
uniform vec4 u_rect;
uniform vec2 u_scale;
uniform vec2 u_off;
void main() {
  vec2 f = vec2(v_px.x / u_vp.x, 1.0 - v_px.y / u_vp.y);
  vec2 d = texture(u_field, f).rg;
  vec2 disp = vec2(d.x * u_vp.x, -d.y * u_vp.y); // px, y down
  vec2 local = clamp((v_px - disp - u_rect.xy) / u_rect.zw, 0.0, 1.0);
  vec3 c = texture(u_image, u_off + local * u_scale).rgb;
  // Transparent where undisturbed, so the original <img> shows through.
  float a = smoothstep(0.4, 3.0, length(disp));
  o = vec4(c * a, a);
}`;

type ImageEntry = { tex: WebGLTexture; src: string };

function parsePosition(value: string): [number, number] {
  const parts = value.split(/\s+/);
  const one = (tok: string | undefined) => {
    if (!tok) return 0.5;
    if (tok.endsWith("%")) return parseFloat(tok) / 100;
    if (tok === "left" || tok === "top") return 0;
    if (tok === "right" || tok === "bottom") return 1;
    return 0.5;
  };
  return [one(parts[0]), one(parts[1])];
}

export function ImageLiquify() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches
    ) {
      return;
    }

    const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) return;
    if (!gl.getExtension("EXT_color_buffer_float") && !gl.getExtension("EXT_color_buffer_half_float")) return;

    const build = (vs: string, fs: string) => {
      const mk = (type: number, src: string) => {
        const s = gl.createShader(type)!;
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
      };
      const p = gl.createProgram()!;
      gl.attachShader(p, mk(gl.VERTEX_SHADER, vs));
      gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(p);
      return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
    };
    const fieldProg = build(FIELD_VERT, FIELD_FRAG);
    const drawProg = build(DRAW_VERT, DRAW_FRAG);
    if (!fieldProg || !drawProg) return;

    // Geometry: a fullscreen quad for the field pass, a unit quad for image draws.
    const fieldVao = gl.createVertexArray();
    gl.bindVertexArray(fieldVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const fLoc = gl.getAttribLocation(fieldProg, "a_pos");
    gl.enableVertexAttribArray(fLoc);
    gl.vertexAttribPointer(fLoc, 2, gl.FLOAT, false, 0, 0);

    const drawVao = gl.createVertexArray();
    gl.bindVertexArray(drawVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
    const qLoc = gl.getAttribLocation(drawProg, "a_q");
    gl.enableVertexAttribArray(qLoc);
    gl.vertexAttribPointer(qLoc, 2, gl.FLOAT, false, 0, 0);

    const U = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);
    const f = {
      prev: U(fieldProg, "u_prev"),
      texel: U(fieldProg, "u_texel"),
      relax: U(fieldProg, "u_relax"),
      visc: U(fieldProg, "u_visc"),
      advect: U(fieldProg, "u_advect"),
      aspect: U(fieldProg, "u_aspect"),
      radius: U(fieldProg, "u_radius"),
      push: U(fieldProg, "u_push"),
      swirl: U(fieldProg, "u_swirl"),
      p0: U(fieldProg, "u_p0"),
      p1: U(fieldProg, "u_p1"),
    };
    const d = {
      field: U(drawProg, "u_field"),
      image: U(drawProg, "u_image"),
      vp: U(drawProg, "u_vp"),
      rect: U(drawProg, "u_rect"),
      scale: U(drawProg, "u_scale"),
      off: U(drawProg, "u_off"),
    };

    // ---- ping-pong displacement field (RGBA16F) ----
    let fw = 1;
    let fh = 1;
    const tex: WebGLTexture[] = [gl.createTexture()!, gl.createTexture()!];
    const fbo: WebGLFramebuffer[] = [gl.createFramebuffer()!, gl.createFramebuffer()!];
    let cur = 0; // index of the texture holding the latest field

    const allocField = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      fw = Math.max(64, Math.round(vw / 4));
      fh = Math.max(64, Math.round((fw * vh) / vw));
      for (let i = 0; i < 2; i++) {
        gl.bindTexture(gl.TEXTURE_2D, tex[i]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, fw, fh, 0, gl.RGBA, gl.HALF_FLOAT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[i]);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex[i], 0);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      allocField();
    };

    // ---- image textures (one per <img>, created lazily) ----
    const images = new WeakMap<HTMLImageElement, ImageEntry>();
    const created: WebGLTexture[] = [];
    const textureFor = (img: HTMLImageElement): WebGLTexture | null => {
      const src = img.currentSrc || img.src;
      const hit = images.get(img);
      if (hit && hit.src === src) return hit.tex;
      if (!img.complete || !img.naturalWidth) return null;
      const t = hit?.tex ?? gl.createTexture()!;
      if (!hit) created.push(t);
      gl.bindTexture(gl.TEXTURE_2D, t);
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      } catch {
        return null; // tainted / undecodable: leave this image alone
      }
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      images.set(img, { tex: t, src });
      return t;
    };

    // Maps the image's on-screen rect to texture coordinates, honouring object-fit.
    const fitFor = (img: HTMLImageElement, rw: number, rh: number): [number, number, number, number] | null => {
      const cs = getComputedStyle(img);
      const fit = cs.objectFit;
      if (fit === "fill" || fit === "") return [1, 1, 0, 0];
      if (fit !== "cover") return null; // contain/none/scale-down: leave alone
      const ia = img.naturalWidth / img.naturalHeight;
      const ra = rw / rh;
      const sx = ra > ia ? 1 : ra / ia;
      const sy = ra > ia ? ia / ra : 1;
      const [px, py] = parsePosition(cs.objectPosition);
      return [sx, sy, (1 - sx) * px, (1 - sy) * py];
    };

    // ---- simulation state ----
    let cfg = getSettings();
    let raf = 0;
    let running = false;
    let lastMove = 0;
    let hasPrev = false;
    // Pointer positions in field coordinates (0..1, y up).
    let curX = 0;
    let curY = 0;
    let prevX = 0;
    let prevY = 0;
    let moved = false;

    const stepField = () => {
      const next = 1 - cur;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[next]);
      gl.viewport(0, 0, fw, fh);
      gl.disable(gl.BLEND);
      gl.useProgram(fieldProg);
      gl.bindVertexArray(fieldVao);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex[cur]);
      gl.uniform1i(f.prev, 0);
      gl.uniform2f(f.texel, 1 / fw, 1 / fh);
      gl.uniform1f(f.relax, cfg.liquifyRelax);
      gl.uniform1f(f.visc, cfg.liquifyViscosity);
      gl.uniform1f(f.advect, cfg.liquifyFlow);
      gl.uniform1f(f.aspect, window.innerWidth / window.innerHeight);
      gl.uniform1f(f.radius, cfg.liquifyRadius);
      // Steady-state drag is ~6 frames of cursor travel; scaled by (1 - relax) so the
      // settle-speed slider changes how long it lingers, not how hard it is pushed.
      gl.uniform1f(f.push, cfg.liquifyStrength * 6 * (1 - cfg.liquifyRelax));
      gl.uniform1f(f.swirl, cfg.liquifySwirl);
      if (moved) {
        gl.uniform2f(f.p0, prevX, prevY);
        gl.uniform2f(f.p1, curX, curY);
        prevX = curX;
        prevY = curY;
        moved = false;
      } else {
        gl.uniform2f(f.p0, 0, 0);
        gl.uniform2f(f.p1, 0, 0);
      }
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      cur = next;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };

    const drawImages = () => {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(drawProg);
      gl.bindVertexArray(drawVao);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex[cur]);
      gl.uniform1i(d.field, 0);
      gl.uniform1i(d.image, 1);
      gl.uniform2f(d.vp, window.innerWidth, window.innerHeight);

      for (const img of document.querySelectorAll("img")) {
        const r = img.getBoundingClientRect();
        // Photos/artwork only: icons and logos under ~40px are left alone.
        if (r.width < 40 || r.height < 40) continue;
        if (r.bottom < 0 || r.top > window.innerHeight || r.right < 0 || r.left > window.innerWidth) continue;
        if (img.closest("[data-no-fx]")) continue; // opted out (logos)
        const cs = getComputedStyle(img);
        if (cs.visibility === "hidden" || parseFloat(cs.opacity) < 0.05) continue;
        const fit = fitFor(img, r.width, r.height);
        if (!fit) continue;
        const t = textureFor(img);
        if (!t) continue;
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.uniform4f(d.rect, r.left, r.top, r.width, r.height);
        gl.uniform2f(d.scale, fit[0], fit[1]);
        gl.uniform2f(d.off, fit[2], fit[3]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      gl.activeTexture(gl.TEXTURE0);
    };

    const tick = (now: number) => {
      stepField();
      drawImages();
      // Keep going until the field has had time to settle to (near) zero.
      const settleMs = Math.min(6000, (Math.log(0.001) / Math.log(Math.max(cfg.liquifyRelax, 0.5))) * 16.7);
      if (now - lastMove < settleMs) {
        raf = requestAnimationFrame(tick);
      } else {
        running = false;
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
    };

    const onMove = (e: PointerEvent) => {
      if (!cfg.liquifyEnabled) return;
      curX = e.clientX / window.innerWidth;
      curY = 1 - e.clientY / window.innerHeight;
      if (!hasPrev) {
        prevX = curX;
        prevY = curY;
        hasPrev = true;
      }
      moved = true;
      lastMove = performance.now();
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };
    const onLeave = () => {
      hasPrev = false;
    };

    const applyCfg = () => {
      cfg = getSettings();
      canvas.style.visibility = cfg.liquifyEnabled ? "" : "hidden";
    };
    const unsubscribe = subscribeSettings(applyCfg);
    applyCfg();
    resize();

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    // Dev-only hook so the simulation can be stepped deterministically in tests.
    if (process.env.NODE_ENV === "development") {
      (window as unknown as { __liquify?: unknown }).__liquify = {
        move: (x: number, y: number) => onMove({ clientX: x, clientY: y } as PointerEvent),
        step: (t: number) => tick(t),
      };
    }

    return () => {
      cancelAnimationFrame(raf);
      unsubscribe();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      created.forEach((t) => gl.deleteTexture(t));
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.liquify} aria-hidden="true" />;
}
