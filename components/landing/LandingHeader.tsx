import Image from "next/image";
import { Cta } from "@/components/cta/Cta";
import styles from "./LandingChrome.module.css";

type LandingHeaderProps = {
  /**
   * Optional action button. Landing pages pass an in-page anchor (`#quote`) so
   * it scrolls to the page's form; legal pages omit it.
   */
  cta?: { label: string; href: string };
};

/**
 * Header for landing pages: logo (deliberately not a link) and, optionally, one
 * scroll-to-form button. No navigation — landing pages are entered from search,
 * not from the site, and shouldn't lead visitors away.
 */
export function LandingHeader({ cta }: LandingHeaderProps) {
  return (
    <header className={styles.header}>
      <Image
        src="/brand/logo_color_light_transparentbg.png"
        alt="Mellon"
        width={252}
        height={80}
        className={styles.logo}
        data-no-fx
        priority
      />
      {cta ? (
        <Cta
          label={cta.label}
          href={cta.href}
          variant="primary"
          context="landing"
          className={styles.headerCta}
        />
      ) : null}
    </header>
  );
}
