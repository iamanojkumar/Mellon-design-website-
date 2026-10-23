import Link from "next/link";
import styles from "./Cta.module.css";

type CtaContext = "home" | "service" | "industry" | "about" | "contact" | "landing";
type CtaVariant = "primary" | "secondary";

type CtaProps = {
  label: string;
  href: string;
  variant?: CtaVariant;
  context?: CtaContext;
  className?: string;
  id?: string;
  /** Accessible name when the visible label alone is ambiguous (several identical links on a page). */
  ariaLabel?: string;
  /** Keep the button its natural width on phones (e.g. inside a header bar); others go full width. */
  compact?: boolean;
};

export function Cta({
  label,
  href,
  variant = "primary",
  context = "home",
  className,
  id,
  ariaLabel,
  compact = false,
}: CtaProps) {
  const classes = [styles.cta, styles[variant], compact && styles.compact, className]
    .filter(Boolean)
    .join(" ");
  return (
    <Link href={href} id={id} aria-label={ariaLabel} className={classes} data-cta-context={context}>
      <span>{label}</span>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M3.5 8H12.5M12.5 8L8.5 4M12.5 8L8.5 12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}
