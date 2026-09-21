"use client";

import { useEffect, useRef } from "react";
import { getSettings, subscribeSettings } from "@/lib/motion-settings";
import styles from "./CursorFx.module.css";

/**
 * Page-wide cursor trail: a fixed, click-through WebGL overlay.
 * Pointer motion is stamped into a low-res height field that fades over time.
 * The shader finds the field's edges and paints them as thin, sharp, iridescent
 * (thin-film) ridges, transparent everywhere else, so it sits over every section.
 * Decorative only: skipped for touch / reduced-motion / no-WebGL.
 */

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = vec2(a_pos.x * 0.5 + 0.5, 0.5 - a_pos.y * 0.5);
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FRAG = `
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_trail;
uniform vec2 u_texel;
uniform float u_intensity;
uniform float u_spread;
uniform float u_edge;
uniform float u_sat;
uniform vec2 u_blurVec; // motion-blur streak, in uv units (direction * speed)

float h0(vec2 uv) {
  return smoothstep(0.04, 0.7, texture2D(u_trail, uv).r);
}

// Height smeared along the pointer's direction of travel (5-tap box streak).
float h(vec2 uv) {
  float sum = 0.0;
  for (int i = -2; i <= 2; i++) {
    sum += h0(uv + u_blurVec * (float(i) * 0.5));
  }
  return sum * 0.2;
}

void main() {
  float c = h(v_uv);
  float gx = h(v_uv + vec2(u_texel.x, 0.0)) - h(v_uv - vec2(u_texel.x, 0.0));
  float gy = h(v_uv + vec2(0.0, u_texel.y)) - h(v_uv - vec2(0.0, u_texel.y));
  vec2 g = vec2(gx, gy);
  float mag = length(g);

  // Thin-film colour: phase moves with height and with the edge direction.
  float phase = c * u_spread + dot(g, vec2(1.7, 1.1)) * 3.0;
  vec3 film = 0.5 + 0.5 * cos(6.28318 * (phase + vec3(0.0, 0.33, 0.67)));

  // Muted, pastel film: blend toward a soft grey, then thin the ridge with a power.
  film = mix(vec3(0.82), film, u_sat);
  float ridge = pow(clamp(mag * u_edge, 0.0, 1.0), 1.7);
  float a = ridge * u_intensity;
  // Faint frosted body so the ridge reads as a glass surface, not just a line.
  a = max(a, c * 0.05 * u_intensity);
  gl_FragColor = vec4(film * a, a);
}`;

export function CursorFx() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const blurRef = useRef<SVGFEGaussianBlurElement>(null);
  const offsetRef = useRef<SVGFEOffsetElement>(null);
  const dispRef = useRef<SVGFEDisplacementMapElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const backdrop = backdropRef.current;
    const blurEl = blurRef.current;
    const offsetEl = offsetRef.current;
    const dispEl = dispRef.current;
    if (!canvas || !backdrop || !blurEl || !offsetEl || !dispEl) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches
    ) {
      return;
    }

    const gl = canvas.getContext("webgl", { antialias: false });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const uTexel = gl.getUniformLocation(program, "u_texel");
    const uIntensity = gl.getUniformLocation(program, "u_intensity");
    const uSpread = gl.getUniformLocation(program, "u_spread");
    const uEdge = gl.getUniformLocation(program, "u_edge");
    const uSat = gl.getUniformLocation(program, "u_sat");
    const uBlurVec = gl.getUniformLocation(program, "u_blurVec");

    // Height field the pointer paints into (white = raised, black = flat).
    const field = document.createElement("canvas");
    const fctx = field.getContext("2d", { alpha: false })!;

    // Half-res alpha mask of the trail; the backdrop layer is only visible through it.
    const mask = document.createElement("canvas");
    const mctx = mask.getContext("2d", { willReadFrequently: true })!;
    // Anisotropic SVG backdrop filters are Chromium-only; others fall back to a plain blur.
    const svgBackdrop = CSS.supports("backdrop-filter", "url(#cursor-fx-filter)");
    const setBackdropFilter = (v: string) => {
      backdrop.style.setProperty("backdrop-filter", v);
      backdrop.style.setProperty("-webkit-backdrop-filter", v);
    };
    if (svgBackdrop) setBackdropFilter("url(#cursor-fx-filter)");
    let frame = 0;
    // Scratch copy of the field, used to spread/dissolve it once the cursor stops.
    const tmp = document.createElement("canvas");
    const tmpCtx = tmp.getContext("2d", { alpha: false })!;

    let cfg = getSettings();
    let raf = 0;
    let running = false;
    let lastMove = 0;
    // No move events for this long = the stroke has stopped (dissolve runs, next move restarts).
    const IDLE_MS = 90;
    // Only a real pause counts as a new stroke (snap + ease-in). Slight or slow movement
    // sends sparse events; treating each gap as a restart re-grew the brush over and over.
    const RESTART_MS = 300;
    // Speeds below this (field px/frame, ~1.5 screen px) are hand tremor, not movement.
    const DEADZONE = 0.5;
    // 0..1 ramp after a restart: eases brush size and opacity in instead of popping.
    let wake = 1;
    let lastTickT = 0;
    // Pointer target and the spring-driven liquid head that chases it.
    let tx = 0;
    let ty = 0;
    let hx = 0;
    let hy = 0;
    let hvx = 0;
    let hvy = 0;
    let hasHead = false;
    // Satellite blobs merged with the head into one lumpy, liquid shape.
    const MAX_BLOBS = 12;
    const bx = new Float32Array(MAX_BLOBS);
    const by = new Float32Array(MAX_BLOBS);
    const bvx = new Float32Array(MAX_BLOBS);
    const bvy = new Float32Array(MAX_BLOBS);
    const bpx = new Float32Array(MAX_BLOBS);
    const bpy = new Float32Array(MAX_BLOBS);
    // Eased 0..1 speed so the brush size changes smoothly instead of jittering.
    let speedAvg = 0;
    let prevTx = 0;
    let prevTy = 0;
    // Smoothed pointer velocity in field pixels/event; drives the motion blur.
    let vx = 0;
    let vy = 0;

    const draw = () => {
      // Streak length grows with speed, capped so it never smears into mush.
      let bx = vx * cfg.cursorFxBlur;
      let by = vy * cfg.cursorFxBlur;
      const len = Math.hypot(bx, by);
      const maxLen = 14;
      if (len > maxLen) {
        bx = (bx / len) * maxLen;
        by = (by / len) * maxLen;
      }
      gl.uniform2f(uBlurVec, bx / field.width, by / field.height);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, field);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const updateBackdrop = () => {
      if (!cfg.cursorFxEnabled || !cfg.cursorFxBackdrop) {
        backdrop.style.visibility = "hidden";
        return;
      }
      backdrop.style.visibility = "visible";
      const speed = Math.hypot(vx, vy);
      const s = Math.min(speed / 6, 1);
      const nx = speed > 1e-3 ? Math.abs(vx) / speed : 0.5;
      const ny = speed > 1e-3 ? Math.abs(vy) / speed : 0.5;
      // More blur along the axis of travel, a little across it.
      const sx = cfg.cursorFxBackdropBlur * s * (0.3 + 0.7 * nx);
      const sy = cfg.cursorFxBackdropBlur * s * (0.3 + 0.7 * ny);
      if (svgBackdrop) {
        blurEl.setAttribute("stdDeviation", `${sx.toFixed(2)} ${sy.toFixed(2)}`);
        const push = s * cfg.cursorFxBackdropWarp * 0.6;
        offsetEl.setAttribute("dx", (speed > 1e-3 ? (vx / speed) * push : 0).toFixed(2));
        offsetEl.setAttribute("dy", (speed > 1e-3 ? (vy / speed) * push : 0).toFixed(2));
        dispEl.setAttribute("scale", (s * cfg.cursorFxBackdropWarp).toFixed(2));
      } else {
        setBackdropFilter(`blur(${Math.max(sx, sy).toFixed(2)}px)`);
      }
      // Refresh the mask every other frame: it is the expensive part.
      if (frame++ % 2 === 0) {
        mctx.drawImage(field, 0, 0, mask.width, mask.height);
        const img = mctx.getImageData(0, 0, mask.width, mask.height);
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
          const t = Math.min(Math.max((d[i] - 10) / 150, 0), 1);
          d[i] = d[i + 1] = d[i + 2] = 0;
          d[i + 3] = t * t * (3 - 2 * t) * 255;
        }
        mctx.putImageData(img, 0, 0);
        const url = `url(${mask.toDataURL()})`;
        backdrop.style.setProperty("mask-image", url);
        backdrop.style.setProperty("-webkit-mask-image", url);
      }
    };

    const applyCfg = () => {
      cfg = getSettings();
      canvas.style.mixBlendMode = cfg.cursorFxBlend;
      gl.uniform1f(uIntensity, cfg.cursorFxIntensity);
      gl.uniform1f(uSpread, cfg.cursorFxSpread);
      gl.uniform1f(uEdge, cfg.cursorFxEdge);
      gl.uniform1f(uSat, cfg.cursorFxSaturation);
      canvas.style.visibility = cfg.cursorFxEnabled ? "" : "hidden";
      if (!cfg.cursorFxEnabled || !cfg.cursorFxBackdrop) backdrop.style.visibility = "hidden";
      draw();
    };
    const unsubscribe = subscribeSettings(applyCfg);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      field.width = Math.min(560, Math.round(window.innerWidth / 3));
      field.height = Math.max(1, Math.round((field.width * window.innerHeight) / window.innerWidth));
      fctx.fillStyle = "#000";
      fctx.fillRect(0, 0, field.width, field.height);
      gl.uniform2f(uTexel, 1 / field.width, 1 / field.height);
      tmp.width = field.width;
      tmp.height = field.height;
      mask.width = Math.max(1, Math.round(field.width / 2));
      mask.height = Math.max(1, Math.round(field.height / 2));
      applyCfg();
    };

    const stamp = (x: number, y: number, radius: number, alpha: number) => {
      const g = fctx.createRadialGradient(x, y, 0, x, y, radius);
      g.addColorStop(0, `rgba(255,255,255,${alpha})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      fctx.fillStyle = g;
      fctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    };

    // Stamp along a segment so fast moves stay one continuous shape.
    const stampPath = (x0: number, y0: number, x1: number, y1: number, r: number, a: number) => {
      const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / (r * 0.4)));
      for (let n = 1; n <= steps; n++) {
        stamp(x0 + ((x1 - x0) * n) / steps, y0 + ((y1 - y0) * n) / steps, r, a);
      }
    };

    const tick = (now: number) => {
      fctx.globalCompositeOperation = "source-over";
      // Pointer idle (no move events for ~90ms): stop depositing and dissolve fast.
      const idle = now - lastMove > IDLE_MS;
      if (idle) {
        // Dissolve: re-draw the field slightly enlarged around the head, at reduced
        // alpha, so the blob spreads outward and softens while it fades.
        tmpCtx.drawImage(field, 0, 0);
        const grow = 1 + cfg.cursorFxDissolveSpread;
        fctx.fillStyle = "#000";
        fctx.fillRect(0, 0, field.width, field.height);
        fctx.globalAlpha = 1 - cfg.cursorFxIdleFade;
        fctx.drawImage(tmp, hx - hx * grow, hy - hy * grow, field.width * grow, field.height * grow);
        fctx.globalAlpha = 1;
        // Step every pixel down by 1 so 8-bit rounding can never stall a faint ghost.
        fctx.globalCompositeOperation = "difference";
        fctx.fillStyle = "rgb(1,1,1)";
        fctx.fillRect(0, 0, field.width, field.height);
        fctx.globalCompositeOperation = "source-over";
      } else {
        fctx.fillStyle = `rgba(0,0,0,${cfg.cursorFxFade})`;
        fctx.fillRect(0, 0, field.width, field.height);
      }

      // Restart fade-in: wake climbs 0 -> 1 over the recoil time after a new stroke
      // begins. It scales opacity only; the brush size is never touched.
      const dt = lastTickT ? Math.min(now - lastTickT, 50) : 16;
      lastTickT = now;
      wake = cfg.cursorFxRecoil > 0 ? Math.min(1, wake + dt / cfg.cursorFxRecoil) : 1;
      const ease = wake * wake * (3 - 2 * wake);

      // ~110ms running average of pointer speed. Raw per-frame deltas are jittery (a frame
      // can see 0 or 2 pointer events), so this only feeds the deposit gate below.
      const inst = Math.hypot(tx - prevTx, ty - prevTy) * (16.67 / Math.max(dt, 1));
      prevTx = tx;
      prevTy = ty;
      speedAvg += (inst - speedAvg) * (1 - Math.exp(-dt / 110));
      // Deposit gate: barely-moving pointers stamp (almost) nothing, so a twitch can't
      // leave a full-size blob behind.
      const g = Math.min(1, Math.max(0, (speedAvg - DEADZONE) / 1.0));
      const gate = g * g * (3 - 2 * g);

      if (hasHead) {
        // Spring toward the pointer: lag > 0 gives trailing, slightly overshooting motion.
        const k = 0.03 + (1 - cfg.cursorFxLag) * 0.5;
        const px = hx;
        const py = hy;
        hvx = (hvx + (tx - hx) * k) * 0.78;
        hvy = (hvy + (ty - hy) * k) * 0.78;
        hx += hvx;
        hy += hvy;

        // Brush size and blob count are fixed: nothing here grows or shrinks on its own.
        const baseR = field.width * cfg.cursorFxRadius;
        const t = now / 1000;
        const org = cfg.cursorFxOrganic;
        const baseCount = Math.min(MAX_BLOBS, Math.max(1, Math.round(cfg.cursorFxBlobs)));
        const count = baseCount;
        const speed = Math.hypot(hvx, hvy);
        const dirx = speed > 0.05 ? hvx / speed : 0;
        const diry = speed > 0.05 ? hvy / speed : 0;

        // Satellites: each roams around the head on its own slow orbit and drags behind
        // the direction of travel like a droplet tail. Their size never changes.
        for (let i = 0; i < MAX_BLOBS; i++) {
          const f = baseCount > 1 ? Math.min(1, i / (baseCount - 1)) : 0;
          const phase = i * 2.399;
          const ang = phase + t * (0.7 + 0.35 * f);
          const reach = baseR * org * (0.75 + 0.35 * Math.sin(t * (0.8 + 0.4 * f) + phase * 1.7));
          const drag = org * (0.5 + f) * Math.min(speed, 8) * 1.4;
          const targetX = hx + Math.cos(ang) * reach - dirx * drag;
          const targetY = hy + Math.sin(ang) * reach * 0.85 - diry * drag;
          const kb = 0.05 + 0.2 * (1 - f * 0.6);
          bpx[i] = bx[i];
          bpy[i] = by[i];
          bvx[i] = (bvx[i] + (targetX - bx[i]) * kb) * 0.8;
          bvy[i] = (bvy[i] + (targetY - by[i]) * kb) * 0.8;
          bx[i] += bvx[i];
          by[i] += bvy[i];
        }

        const dist = Math.hypot(hx - px, hy - py);
        if (!idle && dist > 0.02) {
          fctx.globalCompositeOperation = "lighter";
          // Core: the head itself.
          stampPath(px, py, hx, hy, baseR, 0.4 * ease * gate);
          // Satellites: their union with the core makes the outline lumpy, not a circle.
          const alpha = (0.5 / Math.sqrt(1 + count * 0.5)) * ease * gate;
          for (let i = 0; i < count; i++) {
            const f = baseCount > 1 ? Math.min(1, i / (baseCount - 1)) : 0;
            const phase = i * 2.399;
            const r = baseR * (0.5 + 0.5 * (1 - f * 0.5));
            stampPath(bpx[i], bpy[i], bx[i], by[i], r, alpha);
          }
          vx = vx * 0.6 + hvx * 0.4;
          vy = vy * 0.6 + hvy * 0.4;
        }
      }
      vx *= 0.9;
      vy *= 0.9;
      draw();
      updateBackdrop();

      // Run until the head has settled and the trail has fully faded.
      const settled = Math.hypot(tx - hx, ty - hy) < 0.05 && Math.hypot(hvx, hvy) < 0.02;
      const fadeMs = Math.min(8000, 100 / cfg.cursorFxIdleFade);
      if (!settled || now - lastMove < fadeMs) {
        raf = requestAnimationFrame(tick);
      } else {
        running = false;
        backdrop.style.visibility = "hidden";
      }
    };

    const onMove = (e: PointerEvent) => {
      if (!cfg.cursorFxEnabled) return;
      const nowT = performance.now();
      tx = (e.clientX / window.innerWidth) * field.width;
      ty = (e.clientY / window.innerHeight) * field.height;
      if (!hasHead || nowT - lastMove > RESTART_MS) {
        // New stroke (first contact, or after a stop). The old trail is only dissolving
        // at this point, so snapping the head and blobs to the pointer is invisible and
        // avoids the head flying across the page to catch up (the restart stutter).
        hx = tx;
        hy = ty;
        hvx = 0;
        hvy = 0;
        bx.fill(tx);
        by.fill(ty);
        bpx.fill(tx);
        bpy.fill(ty);
        bvx.fill(0);
        bvy.fill(0);
        prevTx = tx;
        prevTy = ty;
        speedAvg = 0;
        vx = 0;
        vy = 0;
        wake = 0;
        hasHead = true;
      }
      lastMove = nowT;
      if (!running) {
        running = true;
        lastTickT = 0;
        raf = requestAnimationFrame(tick);
      }
    };
    const onLeave = () => {
      hasHead = false;
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      unsubscribe();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return (
    <>
      <svg className={styles.svgDefs} aria-hidden="true" focusable="false">
        <filter
          id="cursor-fx-filter"
          x="0"
          y="0"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur ref={blurRef} in="SourceGraphic" stdDeviation="0 0" result="b" />
          <feOffset ref={offsetRef} in="b" dx="0" dy="0" result="o" />
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.009" numOctaves="2" seed="3" result="n" />
          <feDisplacementMap
            ref={dispRef}
            in="o"
            in2="n"
            scale="0"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>
      <div ref={backdropRef} className={styles.backdrop} aria-hidden="true" />
      <canvas ref={canvasRef} className={styles.fx} aria-hidden="true" />
    </>
  );
}
