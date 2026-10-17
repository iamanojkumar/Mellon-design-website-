import Link from "next/link";
import type { ChatCopy } from "./ChatWidget";
import styles from "./ChatWidget.module.css";

/**
 * The reassurance line under the chat ("we handle sensitive information with
 * care…"), with {privacy} and {ai} turned into links. The AI link only exists
 * once the AI policy page is published for the locale; until then the shorter
 * copy without it is used. Shared by the floating widget and the contact page.
 */
export function AssistantNote({
  locale,
  copy,
  aiPolicyHref,
  className,
}: {
  locale: string;
  copy: Pick<ChatCopy, "note" | "noteNoAi" | "privacyLink" | "aiLink">;
  aiPolicyHref: string | null;
  /** Replaces the compact widget styling (the contact page sets its own, larger one). */
  className?: string;
}) {
  return (
    <p className={className ?? styles.note}>
      {(aiPolicyHref ? copy.note : copy.noteNoAi).split(/(\{privacy\}|\{ai\})/).map((part, i) => {
        if (part === "{privacy}") {
          return (
            <Link key={i} href={`/${locale}/privacy`} target="_blank">
              {copy.privacyLink}
            </Link>
          );
        }
        if (part === "{ai}" && aiPolicyHref) {
          return (
            <Link key={i} href={aiPolicyHref} target="_blank">
              {copy.aiLink}
            </Link>
          );
        }
        return part;
      })}
    </p>
  );
}
