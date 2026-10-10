/**
 * Hero background tint, shared by projects and blog posts. No server imports:
 * the admin's client components read the presets at runtime.
 *
 * Empty/null means transparent, the default. A value is only ever `#rrggbb`,
 * checked here on write and on render, because it ends up inside a <style>
 * tag and must never carry anything but a colour.
 */

export const HERO_PASTELS = [
  { name: "Blush", value: "#fde2e4" },
  { name: "Peach", value: "#ffe5d0" },
  { name: "Butter", value: "#fff4c2" },
  { name: "Mint", value: "#d8f3dc" },
  { name: "Sky", value: "#d6ecfa" },
  { name: "Lavender", value: "#e6defa" },
  { name: "Stone", value: "#ece8e1" },
] as const;

const HEX = /^#[0-9a-f]{6}$/i;

export function normalizeHeroBg(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && HEX.test(trimmed) ? trimmed.toLowerCase() : null;
}
