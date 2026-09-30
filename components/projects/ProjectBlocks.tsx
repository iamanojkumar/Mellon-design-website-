import type { ProjectBlock } from "@/lib/project-blocks";
import { ParallaxImage } from "@/components/motion/ParallaxImage";
import { RevealGroup } from "@/components/motion/RevealGroup";
import styles from "./ProjectBlocks.module.css";

/**
 * Public rendering for the structured blocks the admin writes alongside a case
 * study's rich-text body. Presentation only — the structured data these blocks
 * contribute is emitted separately by buildProjectJsonLd (lib/project-seo.ts),
 * so nothing here needs to know about schema.org.
 *
 * Unknown types are skipped rather than thrown on: a block shape added in the
 * admin should never take a published page down.
 */
export function ProjectBlocks({ blocks }: { blocks: ProjectBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;
        switch (block.type) {
          case "stats":
            return (
              <section key={key} className={styles.block}>
                {block.heading && <h2 className={styles.heading}>{block.heading}</h2>}
                <dl className={styles.stats}>
                  {block.items.map((item, i) => (
                    <div key={i} className={styles.stat}>
                      <dt className={styles.statValue}>{item.value}</dt>
                      <dd className={styles.statLabel}>{item.label}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            );

          case "testimonial":
            return (
              <figure key={key} className={`${styles.block} ${styles.testimonial}`}>
                <blockquote className={styles.quote}>{block.quote}</blockquote>
                <figcaption className={styles.attribution}>
                  {[block.author, block.role, block.company].filter(Boolean).join(" · ")}
                </figcaption>
              </figure>
            );

          case "faq":
            return (
              <section key={key} className={styles.block}>
                {block.heading && <h2 className={styles.heading}>{block.heading}</h2>}
                <RevealGroup className={styles.faq}>
                  {block.items.map((item, i) => (
                    // <details> keeps this usable with no JavaScript, and the
                    // answers stay in the DOM for crawlers either way.
                    <details key={i} className={styles.faqItem}>
                      <summary className={styles.faqQuestion}>{item.question}</summary>
                      <p className={styles.faqAnswer}>{item.answer}</p>
                    </details>
                  ))}
                </RevealGroup>
              </section>
            );

          case "gallery":
            return (
              <section key={key} className={styles.block}>
                {block.heading && <h2 className={styles.heading}>{block.heading}</h2>}
                <div className={styles.gallery}>
                  {block.images.map((image, i) => (
                    // The frame clips the drifting image; ParallaxImage moves it.
                    <div key={i} className={styles.galleryFrame}>
                      <ParallaxImage
                        src={image.src}
                        alt={image.alt}
                        revealOnView
                        className={styles.galleryImage}
                      />
                    </div>
                  ))}
                </div>
              </section>
            );

          case "video":
            return (
              <section key={key} className={styles.block}>
                {block.title && <h2 className={styles.heading}>{block.title}</h2>}
                <div className={styles.video}>
                  <iframe
                    src={block.url}
                    title={block.title || "Video"}
                    loading="lazy"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
                {block.description && <p className={styles.videoCaption}>{block.description}</p>}
              </section>
            );

          default:
            return null;
        }
      })}
    </>
  );
}
