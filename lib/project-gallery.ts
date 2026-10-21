/**
 * Image-led projects: the gallery shape, and which services list their work as
 * a masonry wall instead of case-study cards. Free of server-only imports so
 * the admin editor and the client listing can use it too.
 *
 * Two separate switches, on purpose:
 *  - the *service* decides how a listing shows the work (GALLERY_SERVICES:
 *    image and title only, in masonry);
 *  - the project's `richText` flag decides its detail page. Off means images
 *    only, which is how graphic design and motion work is published; branding
 *    keeps the written case study while still listing as masonry.
 */

export type GalleryImage = {
  src: string;
  alt: string;
  width: number | null;
  height: number | null;
};

/** Services whose projects list as image + title in a masonry wall. */
export const GALLERY_SERVICES: readonly string[] = [
  "branding",
  "graphic-design",
  "motion-interaction-design",
];

export function isGalleryService(slug: string | null | undefined): boolean {
  return !!slug && GALLERY_SERVICES.includes(slug);
}

function positive(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.round(value) : null;
}

/** Tolerant read of the jsonb column: anything malformed is dropped, never thrown. */
export function parseGallery(raw: unknown): GalleryImage[] {
  if (!Array.isArray(raw)) return [];
  const images: GalleryImage[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const entry = item as Record<string, unknown>;
    const src = typeof entry.src === "string" ? entry.src.trim() : "";
    if (!src) continue;
    images.push({
      src,
      alt: typeof entry.alt === "string" ? entry.alt.trim() : "",
      width: positive(entry.width),
      height: positive(entry.height),
    });
  }
  return images;
}

/**
 * Every image of a project in display order: the hero (cover) first, then the
 * gallery. A gallery entry repeating the hero is skipped.
 */
export function projectImages(project: {
  heroImage: string | null;
  heroImageAlt: string | null;
  heroImageWidth: number | null;
  heroImageHeight: number | null;
  gallery: GalleryImage[];
}): GalleryImage[] {
  const images: GalleryImage[] = [];
  if (project.heroImage) {
    images.push({
      src: project.heroImage,
      alt: project.heroImageAlt ?? "",
      width: project.heroImageWidth,
      height: project.heroImageHeight,
    });
  }
  for (const image of project.gallery) {
    if (image.src !== project.heroImage) images.push(image);
  }
  return images;
}
