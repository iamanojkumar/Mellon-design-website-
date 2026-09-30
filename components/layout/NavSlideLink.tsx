import Link from "next/link";
import styles from "./NavSlideLink.module.css";

/**
 * Nav link whose label slides up and out on hover (or focus) while an identical
 * copy slides in from below, letter by letter. Pure CSS — no client JS. The link
 * keeps its real label as its accessible name; both animated copies are
 * aria-hidden. The visible copy sets the width, so neighbours never shift.
 */
export function NavSlideLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: string;
}) {
  const letters = [...children];
  const face = (hidden: boolean) => (
    <span className={styles.face} aria-hidden={hidden || undefined}>
      {letters.map((char, i) => (
        <span key={i} className={styles.char} style={{ "--i": i } as React.CSSProperties}>
          {char === " " ? " " : char}
        </span>
      ))}
    </span>
  );

  return (
    <Link href={href} className={`${className} ${styles.link}`} aria-label={children}>
      <span className={styles.slide} aria-hidden="true">
        {face(false)}
        {face(true)}
      </span>
    </Link>
  );
}
