"use client";

import Link from "next/link";
import type { ComponentProps, PointerEvent } from "react";

const MAX_TILT = 8; // degrees, hovered card
const NEIGHBOUR_TILT = 0.55; // neighbours tilt this fraction of MAX_TILT at most
const HOVER_SCALE = 0.02; // extra scale for the hovered card
const NEIGHBOUR_SCALE = 0.008;
const EASE = 0.1; // per-frame lerp factor: lower = smoother / laggier
const NEAR_RANGE = 260; // px: how far from the pointer a neighbour still reacts

type Pose = { rx: number; ry: number; s: number };
type Group = { poses: Map<HTMLElement, { cur: Pose; tgt: Pose }>; raf: number | null };

// One eased animation loop per grid, so every card in it can move together.
const groups = new WeakMap<HTMLElement, Group>();

function getGroup(grid: HTMLElement): Group {
  let g = groups.get(grid);
  if (!g) {
    g = { poses: new Map(), raf: null };
    groups.set(grid, g);
  }
  return g;
}

function tick(group: Group) {
  let moving = false;
  for (const [el, { cur, tgt }] of group.poses) {
    if (!el.isConnected) {
      group.poses.delete(el);
      continue;
    }
    cur.rx += (tgt.rx - cur.rx) * EASE;
    cur.ry += (tgt.ry - cur.ry) * EASE;
    cur.s += (tgt.s - cur.s) * EASE;
    el.style.setProperty("--rx", `${cur.rx.toFixed(3)}deg`);
    el.style.setProperty("--ry", `${cur.ry.toFixed(3)}deg`);
    el.style.setProperty("--s", cur.s.toFixed(4));
    if (
      Math.abs(tgt.rx - cur.rx) > 0.01 ||
      Math.abs(tgt.ry - cur.ry) > 0.01 ||
      Math.abs(tgt.s - cur.s) > 0.0005
    ) {
      moving = true;
    }
  }
  group.raf = moving ? requestAnimationFrame(() => tick(group)) : null;
}

function setTarget(group: Group, el: HTMLElement, tgt: Pose) {
  let entry = group.poses.get(el);
  if (!entry) {
    entry = { cur: { rx: 0, ry: 0, s: 1 }, tgt };
    group.poses.set(el, entry);
  }
  entry.tgt = tgt;
}

function kick(group: Group) {
  if (group.raf === null) group.raf = requestAnimationFrame(() => tick(group));
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * A Link that publishes pointer-driven CSS variables so a card and its
 * neighbours can react to the cursor: pointer position (--mx/--my), hue from the
 * angle round the hovered card's centre (--hue), proximity (--near) and an eased
 * 3D tilt (--rx/--ry/--s). Neighbours tilt towards the pointer too, less the
 * further away they are.
 */
export function CursorGlowLink(props: ComponentProps<typeof Link>) {
  function onPointerMove(e: PointerEvent<HTMLAnchorElement>) {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const hdx = e.clientX - (rect.left + rect.width / 2);
    const hdy = e.clientY - (rect.top + rect.height / 2);

    // Angle of the cursor around the hovered card's centre drives the hue, so
    // colours shift as the pointer travels round the border.
    const hue = Math.round((Math.atan2(hdy, hdx) * 180) / Math.PI + 180);
    el.style.setProperty("--hue", `${hue}`);

    const grid = el.parentElement;
    if (grid) {
      const g = grid.getBoundingClientRect();
      // Soft glow spilling across the grid, in grid coordinates.
      grid.style.setProperty("--gx", `${e.clientX - g.left}px`);
      grid.style.setProperty("--gy", `${e.clientY - g.top}px`);
      grid.style.setProperty("--hue", `${hue}`);
      grid.style.setProperty("--glow", "1");

      const group = getGroup(grid);
      for (const child of Array.from(grid.children) as HTMLElement[]) {
        const r = child.getBoundingClientRect();
        const isSelf = child === el;
        const gapX = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
        const gapY = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
        const near = isSelf ? 1 : Math.max(0, 1 - Math.hypot(gapX, gapY) / NEAR_RANGE);

        child.style.setProperty("--mx", `${e.clientX - r.left}px`);
        child.style.setProperty("--my", `${e.clientY - r.top}px`);
        child.style.setProperty("--hue", `${hue}`);
        child.style.setProperty("--near", near.toFixed(2));

        // Tilt: the edge nearest the pointer dips away from the viewer.
        const nx = clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 2), -1, 1);
        const ny = clamp((e.clientY - (r.top + r.height / 2)) / (r.height / 2), -1, 1);
        const strength = isSelf ? 1 : NEIGHBOUR_TILT * near;
        setTarget(group, child, {
          rx: -ny * MAX_TILT * strength,
          ry: nx * MAX_TILT * strength,
          s: 1 + (isSelf ? HOVER_SCALE : NEIGHBOUR_SCALE * near),
        });
      }
      kick(group);
    }

    props.onPointerMove?.(e);
  }

  function onPointerLeave(e: PointerEvent<HTMLAnchorElement>) {
    const grid = e.currentTarget.parentElement;
    if (grid) {
      grid.style.setProperty("--glow", "0");
      const group = getGroup(grid);
      for (const child of Array.from(grid.children) as HTMLElement[]) {
        child.style.setProperty("--near", "0");
        setTarget(group, child, { rx: 0, ry: 0, s: 1 });
      }
      kick(group);
    }
    props.onPointerLeave?.(e);
  }

  return <Link {...props} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave} />;
}
