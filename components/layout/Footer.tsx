import Image from "next/image";
import { AnimatedLogo } from "@/components/brand/AnimatedLogo";
import { FadeIn } from "@/components/motion/HeroSequence";
import { RevealGroup } from "@/components/motion/RevealGroup";
import { SwiftUpText } from "@/components/motion/SwiftUpText";
import Link from "next/link";
import type { SiteContent } from "@/lib/content";
import styles from "./Footer.module.css";

type FooterProps = {
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

export function Footer({ locale, footer, org }: FooterProps) {
  const localePrefix = `/${locale}`;
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <div className={styles.brandCol}>
          <Link href={localePrefix} aria-label={footer.homeAria}>
            <AnimatedLogo iconSize={60} wordSize={16} playOnView vertical />
          </Link>
          <p className={styles.tagline}>
            <SwiftUpText text={footer.tagline} whenVisible delay={0.2} />
          </p>
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

        {footer.columns.map((column) => (
          <div key={column.heading} className={styles.col}>
            <h3 className={styles.colHeading}>
              <SwiftUpText text={column.heading} whenVisible />
            </h3>
            <RevealGroup as="ul">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={`${localePrefix}${link.href}`}>{link.label}</Link>
                </li>
              ))}
            </RevealGroup>
          </div>
        ))}

        <div className={styles.col}>
          <h3 className={styles.colHeading}>
            <SwiftUpText text={footer.contactHeading} whenVisible />
          </h3>
          <FadeIn whenVisible delay={0.2}>
            <a href={`mailto:${org.email}`} className={styles.emailLink}>
              {org.email}
            </a>
          </FadeIn>
        </div>
      </div>

      <div className={styles.bottom}>
        <FadeIn as="span" whenVisible>
          <span>
            &copy; {year} {org.legalName}. {footer.legal}
          </span>
        </FadeIn>
        {footer.legalLinks.map((link, index) => (
          <FadeIn key={link.href} as="span" whenVisible delay={0.1 + index * 0.08}>
            <Link href={`${localePrefix}${link.href}`}>{link.label}</Link>
          </FadeIn>
        ))}
        {/* The consent banner (GTM tag, source in temp/consent-banner.html) binds
            any data-open-consent element to reopen its preferences panel. Without
            this, withdrawing consent would mean clearing site data by hand. */}
        <FadeIn as="span" whenVisible delay={0.1 + footer.legalLinks.length * 0.08}>
          <button type="button" data-open-consent className={styles.consentButton}>
            {footer.cookiePreferences}
          </button>
        </FadeIn>
      </div>
    </footer>
  );
}
