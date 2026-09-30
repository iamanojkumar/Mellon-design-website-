import Image from "next/image";
import { AnimatedLogo } from "@/components/brand/AnimatedLogo";
import { FadeIn } from "@/components/motion/HeroSequence";
import { RevealGroup } from "@/components/motion/RevealGroup";
import { SwiftUpText } from "@/components/motion/SwiftUpText";
import Link from "next/link";
import type { SiteContent } from "@/lib/content";
import styles from "./LandingChrome.module.css";

type LandingFooterProps = {
  locale: string;
  footer: SiteContent["footer"];
  org: SiteContent["org"];
};

const SOCIAL_LINKS: {
  key: keyof SiteContent["org"]["social"];
  label: string;
  icon: string;
}[] = [
  { key: "instagram", label: "Instagram", icon: "/brand/social/instagram.svg" },
  { key: "linkedin", label: "LinkedIn", icon: "/brand/social/linkedin.svg" },
  { key: "x", label: "X", icon: "/brand/social/x.svg" },
  { key: "facebook", label: "Facebook", icon: "/brand/social/facebook.svg" },
  { key: "youtube", label: "YouTube", icon: "/brand/social/youtube.svg" },
];

/**
 * Footer for landing pages and legal pages: logo and social links, the brand
 * tagline, then the legal row. The logo is deliberately not a link (these pages
 * don't lead visitors into the site). Legal links and the consent trigger stay
 * because a page that collects leads or runs tags still needs them.
 */
export function LandingFooter({ locale, footer, org }: LandingFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerTop}>
        <div className={styles.footerBrand}>
          <AnimatedLogo iconSize={60} wordSize={16} playOnView vertical className={styles.footerLogo} />
          <RevealGroup className={styles.social}>
            {SOCIAL_LINKS.map((item) => (
              <a
                key={item.key}
                href={org.social[item.key]}
                target="_blank"
                rel="noreferrer"
                aria-label={item.label}
                className={styles.socialLink}
              >
                <Image src={item.icon} alt="" width={20} height={20} aria-hidden="true" />
              </a>
            ))}
          </RevealGroup>
        </div>
        <p className={styles.tagline}>
          <SwiftUpText text={footer.tagline} whenVisible delay={0.2} />
        </p>
      </div>

      <div className={styles.footerBottom}>
        <FadeIn as="span" whenVisible>
          <span>
            &copy; {year} {org.legalName}. {footer.legal}
          </span>
        </FadeIn>
        {footer.legalLinks.map((link, index) => (
          <FadeIn key={link.href} as="span" whenVisible delay={0.1 + index * 0.08}>
            <Link href={`/${locale}${link.href}`}>{link.label}</Link>
          </FadeIn>
        ))}
        <FadeIn as="span" whenVisible delay={0.1 + footer.legalLinks.length * 0.08}>
          <button type="button" data-open-consent className={styles.consentButton}>
            {footer.cookiePreferences}
          </button>
        </FadeIn>
      </div>
    </footer>
  );
}
