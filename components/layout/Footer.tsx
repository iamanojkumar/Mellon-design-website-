import Image from "next/image";
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
          <Link href={localePrefix} aria-label="Mellon home">
            <Image
              src="/brand/logo_var2_transparent.png"
              alt="Mellon"
              width={112}
              height={112}
              className={styles.logo}
            />
          </Link>
          <p className={styles.tagline}>{footer.tagline}</p>
          <div className={styles.social}>
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
          </div>
        </div>

        {footer.columns.map((column) => (
          <div key={column.heading} className={styles.col}>
            <h3 className={styles.colHeading}>{column.heading}</h3>
            <ul>
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={`${localePrefix}${link.href}`}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className={styles.col}>
          <h3 className={styles.colHeading}>Contact</h3>
          <a href={`mailto:${org.email}`} className={styles.emailLink}>
            {org.email}
          </a>
        </div>
      </div>

      <div className={styles.bottom}>
        <span>
          &copy; {year} {org.legalName}. {footer.legal}
        </span>
      </div>
    </footer>
  );
}
