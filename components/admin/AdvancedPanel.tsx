"use client";

import type { ProjectFormState } from "./form-state";
import styles from "./AdvancedPanel.module.css";

export function AdvancedPanel({
  form,
  onChange,
}: {
  form: ProjectFormState;
  onChange: (patch: Partial<ProjectFormState>) => void;
}) {
  return (
    <div className={styles.panel}>
      <p className={styles.warning}>
        These are injected as raw HTML on this project&apos;s public page. Anything you paste here
        runs — only paste code you trust.
      </p>

      <div className="a-field">
        <label htmlFor="adv-head">Custom head tags</label>
        <textarea
          id="adv-head"
          className="a-mono"
          rows={10}
          placeholder={'<meta name="…" content="…">\n<script>…</script>'}
          value={form.customHead}
          onChange={(event) => onChange({ customHead: event.target.value })}
        />
        <span className="a-hint">Rendered inside &lt;head&gt;.</span>
      </div>

      <div className="a-field">
        <label htmlFor="adv-body">Custom body tags</label>
        <textarea
          id="adv-body"
          className="a-mono"
          rows={10}
          placeholder="<!-- tracking pixel, widget embed, … -->"
          value={form.customBody}
          onChange={(event) => onChange({ customBody: event.target.value })}
        />
        <span className="a-hint">Rendered at the end of &lt;body&gt;.</span>
      </div>
    </div>
  );
}
