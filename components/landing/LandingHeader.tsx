import { AnimatedLogo } from "@/components/brand/AnimatedLogo";
import { Cta } from "@/components/cta/Cta";
import { FadeIn } from "@/components/motion/HeroSequence";
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
      <AnimatedLogo />
      {cta ? (
        <FadeIn as="span" whenVisible delay={0.4}>
          <Cta
            label={cta.label}
            href={cta.href}
            variant="primary"
            context="landing"
            className={styles.headerCta}
          />
        </FadeIn>
      ) : null}
    </header>
  );
}
