"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { PROJECT_STATUSES, STATUS_LABELS } from "@/lib/project-fields";
import { enabledLocales, getLocaleConfig } from "@/lib/locale";
import type { LandingRow, LandingStatus } from "@/lib/landing-db";
import {
  applyLandingPatch,
  blankLandingCopy,
  checkLandingRules,
  landingPatchSchema,
  slugifyLanding,
  wordCount,
  bodyText,
  type LandingCopy,
  type OtherPage,
} from "@/lib/landing-content";
import {
  saveLandingAction,
  deleteLandingAction,
  loadOtherPagesAction,
} from "@/app/admin/landing-actions";
import { deleteChatsForPageAction } from "@/app/admin/chat-actions";
import { EntityChatPanel, type ChatTool } from "./EntityChatPanel";
import appStyles from "./AdminApp.module.css";
import sideStyles from "./ProjectSidebar.module.css";
import editorStyles from "./ProjectEditor.module.css";
import styles from "./LandingApp.module.css";

type Service = { slug: string; name: string };

type FormState = {
  slug: string;
  locale: string;
  locales: string[];
  status: LandingStatus;
  indexable: boolean;
  service: string;
  demandNote: string;
  copy: LandingCopy;
};

const blankForm = (locale: string): FormState => ({
  slug: "",
  locale,
  locales: [locale],
  status: "draft",
  indexable: true,
  service: "",
  demandNote: "",
  copy: blankLandingCopy(),
});

function toForm(row: LandingRow | null, fallbackLocale: string): FormState {
  if (!row) return blankForm(fallbackLocale);
  return {
    slug: row.slug,
    locale: row.locale,
    locales: row.locales,
    status: row.status,
    indexable: row.indexable,
    service: row.service ?? "",
    demandNote: row.demandNote ?? "",
    copy: row.copy,
  };
}

/** Same-language, enabled locales a page's copy can also be served in. */
const sameLanguage = (locale: string) =>
  enabledLocales.filter((item) => item.language === getLocaleConfig(locale)?.language);

export function LandingApp({
  initialRows,
  servicesByLocale,
  defaultLocale,
}: {
  initialRows: LandingRow[];
  servicesByLocale: Record<string, Service[]>;
  defaultLocale: string;
}) {
  const [rows, setRows] = useState(initialRows);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => blankForm(defaultLocale));
  const [others, setOthers] = useState<OtherPage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [override, setOverride] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dockOpen, setDockOpen] = useState(true);
  const [dockTab, setDockTab] = useState<"chat" | "checks">("chat");
  // One chat panel per editing session: it survives the first save of a new page.
  const [chatKey, setChatKey] = useState(() => crypto.randomUUID());
  const [, startTransition] = useTransition();

  const selected = rows.find((row) => row.id === selectedId) ?? null;
  const services = servicesByLocale[form.locale] ?? [];

  const patchForm = (next: Partial<FormState>) => setForm((current) => ({ ...current, ...next }));
  const patchCopy = (next: Partial<LandingCopy>) =>
    setForm((current) => ({ ...current, copy: { ...current.copy, ...next } }));

  // The assistant reads the draft at send/apply time, not when the panel mounted.
  const formRef = useRef(form);
  formRef.current = form;
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  // Other pages' copy, for the uniqueness and near-duplicate checks.
  useEffect(() => {
    let cancelled = false;
    loadOtherPagesAction(selectedId).then((result) => {
      if (!cancelled && result.ok) setOthers(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedId, rows.length]);

  const effectiveSlug = form.slug || slugifyLanding(form.copy.headline);
  const checks = useMemo(
    () =>
      checkLandingRules({
        copy: form.copy,
        slug: effectiveSlug,
        indexable: form.indexable,
        demandNote: form.demandNote,
        others,
      }),
    [form.copy, effectiveSlug, form.indexable, form.demandNote, others],
  );
  const failures = checks.filter((check) => check.status === "fail");
  const words = wordCount(bodyText(form.copy));

  const select = (row: LandingRow | null) => {
    setSelectedId(row?.id ?? null);
    setForm(toForm(row, defaultLocale));
    setError(null);
    setOverride(false);
    setConfirmingDelete(false);
    setChatKey(crypto.randomUUID());
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const result = await saveLandingAction({
      id: selected?.id ?? null,
      ...form,
      slug: effectiveSlug,
      overrideRules: override,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const saved = result.data;
    setRows((current) =>
      current.some((row) => row.id === saved.id)
        ? current.map((row) => (row.id === saved.id ? saved : row))
        : [saved, ...current],
    );
    setSelectedId(saved.id);
    setForm(toForm(saved, defaultLocale));
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    const result = await deleteLandingAction(selected.id);
    setConfirmingDelete(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await deleteChatsForPageAction("landing", selected.id);
    setRows((current) => current.filter((row) => row.id !== selected.id));
    select(null);
  };

  const copyUrl = async (row: LandingRow) => {
    const url = `${window.location.origin}/${row.locale}/${row.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(row.id);
      setTimeout(() => setCopiedId((current) => (current === row.id ? null : current)), 1500);
    } catch {
      window.prompt("Copy this URL", url);
    }
  };

  const changeLocale = (locale: string) => {
    const allowed = sameLanguage(locale).map((item) => item.code);
    startTransition(() =>
      setForm((current) => ({
        ...current,
        locale,
        locales: [...new Set([locale, ...current.locales.filter((code) => allowed.includes(code))])],
        service: "",
      })),
    );
  };

  const toggleLocale = (code: string) =>
    setForm((current) => ({
      ...current,
      locales: current.locales.includes(code)
        ? current.locales.filter((item) => item !== code)
        : [...current.locales, code],
    }));

  // --- AI chat -------------------------------------------------------------

  const chatTools = useMemo<Record<string, ChatTool>>(
    () => ({
      proposeLanding: {
        title: "Added to the page",
        mode: "auto",
        note: (input) => (input as { note?: string }).note,
        summarize: (input) => {
          const { slug, service, demandNote, copy } = input as {
            slug?: string;
            service?: string;
            demandNote?: string;
            copy?: Record<string, unknown>;
          };
          return [
            ...(slug ? [`slug: ${slug}`] : []),
            ...(service ? [`service: ${service}`] : []),
            ...(demandNote ? [`demand note: ${demandNote.slice(0, 80)}${demandNote.length > 80 ? "…" : ""}`] : []),
            ...Object.keys(copy ?? {}).map((key) => `copy.${key}`),
          ];
        },
        apply: (input) => {
          const { slug, service, demandNote, copy } = input as {
            slug?: string;
            service?: string;
            demandNote?: string;
            copy?: unknown;
          };
          const patch = landingPatchSchema.safeParse(copy ?? {});
          if (!patch.success) throw new Error("The proposed content did not match the page's fields.");

          const before = formRef.current;
          setForm((current) => ({
            ...current,
            // A live page's URL must not change under the editor's feet.
            slug: slug && current.status !== "published" ? slugifyLanding(slug) : current.slug,
            service: service && (servicesByLocale[current.locale] ?? []).some((s) => s.slug === service) ? service : current.service,
            demandNote: demandNote ?? current.demandNote,
            copy: applyLandingPatch(current.copy, patch.data as Partial<LandingCopy>),
          }));
          return {
            message: "Added to the page. Review the checks, then click Save.",
            undo: () => setForm(before),
          };
        },
      },
    }),
    [servicesByLocale],
  );

  const chatContext = () => {
    const f = formRef.current;
    return {
      locale: f.locale,
      current: {
        id: selectedIdRef.current,
        slug: f.slug,
        service: f.service,
        indexable: f.indexable,
        demandNote: f.demandNote,
        locales: f.locales,
        copy: f.copy,
      },
    };
  };

  return (
    <div className={appStyles.shell}>
      <header className={appStyles.topbar}>
        <span className={appStyles.brand}>Landing pages created here</span>
        <div className={appStyles.topbarControls}>
          <Link className="a-btn" href="/admin/landing-pages">
            Pages defined in code →
          </Link>
          <button
            type="button"
            className={appStyles.paneToggle}
            onClick={() => setDockOpen((open) => !open)}
            aria-pressed={dockOpen}
            title={dockOpen ? "Hide AI chat and checks" : "Show AI chat and checks"}
          >
            {dockOpen ? "◨" : "▢"}
          </button>
        </div>
      </header>

      <div className={appStyles.body} data-dock={dockOpen ? "open" : "closed"}>
        <aside className={sideStyles.sidebar}>
          <div className={sideStyles.head}>
            <span className="a-label">Pages — {rows.length}</span>
          </div>
          <div className={sideStyles.list} style={{ paddingLeft: 0, flex: 1 }}>
            {rows.length === 0 && <p className={sideStyles.empty}>No pages yet.</p>}
            {rows.map((row) => (
              <div key={row.id} className={sideStyles.row}>
                <button
                  type="button"
                  className={`${sideStyles.item} ${row.id === selectedId ? sideStyles.active : ""}`}
                  onClick={() => select(row)}
                >
                  <span className={sideStyles.itemHead}>
                    <span className={sideStyles.dot} data-status={row.status} aria-hidden="true" />
                    <span className={sideStyles.itemTitle}>{row.copy.headline || row.slug}</span>
                  </span>
                  <span className={sideStyles.itemMeta}>
                    <span className={sideStyles.status} data-status={row.status}>
                      {STATUS_LABELS[row.status]}
                    </span>
                    <span className={sideStyles.taxonomy}>
                      {row.locale} · /{row.slug}
                      {row.indexable ? "" : " · noindex"}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  className={sideStyles.copyButton}
                  onClick={() => copyUrl(row)}
                  title={copiedId === row.id ? "Copied" : "Copy page URL"}
                  aria-label={`Copy URL of ${row.slug}`}
                >
                  {copiedId === row.id ? (
                    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 8.5l3.2 3.2L13 4.8" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden="true">
                      <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
                      <path d="M10.5 5.5V3.5a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2" />
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className={`a-btn a-btn-primary ${sideStyles.newButton}`}
            onClick={() => select(null)}
          >
            + New landing page
          </button>
        </aside>

        <div className={editorStyles.editor}>
          <div className={editorStyles.statusBar}>
            <div className={editorStyles.statusGroup} role="group" aria-label="Status">
              {PROJECT_STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={editorStyles.statusOption}
                  aria-pressed={form.status === status}
                  onClick={() => patchForm({ status })}
                >
                  {STATUS_LABELS[status]}
                </button>
              ))}
            </div>
            <label className={editorStyles.checkbox}>
              <input
                type="checkbox"
                checked={form.indexable}
                onChange={(event) => patchForm({ indexable: event.target.checked })}
              />
              <span>Indexable</span>
            </label>
            <div className={editorStyles.actions}>
              <button type="button" className="a-btn a-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
              {selected && selected.status === "published" && (
                <a
                  className="a-btn"
                  href={`/${selected.locale}/${selected.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open ↗
                </a>
              )}
              {selected && (
                <button type="button" className="a-btn a-btn-danger" onClick={handleDelete}>
                  {confirmingDelete ? "Confirm delete" : "Delete"}
                </button>
              )}
            </div>
          </div>

          {error && (
            <p className="a-error" role="alert">
              {error}
            </p>
          )}
          {form.status === "published" && failures.length > 0 && (
            <label className={editorStyles.checkbox}>
              <input type="checkbox" checked={override} onChange={(event) => setOverride(event.target.checked)} />
              <span>
                Publish even though {failures.length} check{failures.length > 1 ? "s" : ""} fail
                {failures.length > 1 ? "" : "s"} (see Checks)
              </span>
            </label>
          )}

          <Section title="Page">
            <div className="a-row">
              <Field label="Slug (URL)">
                <input
                  type="text"
                  value={form.slug}
                  placeholder={slugifyLanding(form.copy.headline) || "auto from the headline"}
                  onChange={(event) => patchForm({ slug: event.target.value })}
                  disabled={!!selected && selected.status === "published"}
                />
              </Field>
              <Field label="Copy written for">
                <select value={form.locale} onChange={(event) => changeLocale(event.target.value)}>
                  {enabledLocales.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            {selected?.status === "published" && (
              <p className="a-hint">The URL of a published page is locked. Unpublish it to change the slug.</p>
            )}
            <div className="a-field">
              <span className="a-label">Also served in (same language only)</span>
              <div className={styles.checks}>
                {sameLanguage(form.locale).map((item) => (
                  <label key={item.code} className={editorStyles.checkbox}>
                    <input
                      type="checkbox"
                      checked={form.locales.includes(item.code)}
                      disabled={item.code === form.locale}
                      onChange={() => toggleLocale(item.code)}
                    />
                    <span>{item.code}</span>
                  </label>
                ))}
              </div>
              <p className="a-hint">
                The page 404s in every other locale. Add a locale only if it is a deliberate
                same-language fallback for this copy.
              </p>
            </div>
            <div className="a-row">
              <Field label="Service (ranks related work first)">
                <select value={form.service} onChange={(event) => patchForm({ service: event.target.value })}>
                  <option value="">— None —</option>
                  {services.map((service) => (
                    <option key={service.slug} value={service.slug}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Link to the service page (optional)">
                <input
                  type="text"
                  placeholder="/services/branding"
                  value={form.copy.related?.href ?? ""}
                  onChange={(event) =>
                    patchCopy({
                      related: event.target.value
                        ? { text: form.copy.related?.text ?? "", label: form.copy.related?.label ?? "", href: event.target.value }
                        : undefined,
                    })
                  }
                />
              </Field>
            </div>
            {form.copy.related && (
              <div className="a-row">
                <Field label="Link intro text">
                  <input
                    type="text"
                    value={form.copy.related.text}
                    onChange={(event) => patchCopy({ related: { ...form.copy.related!, text: event.target.value } })}
                  />
                </Field>
                <Field label="Link label">
                  <input
                    type="text"
                    value={form.copy.related.label}
                    onChange={(event) => patchCopy({ related: { ...form.copy.related!, label: event.target.value } })}
                  />
                </Field>
              </div>
            )}
            <Field label="Demand note (phrase, market, volumes, verdict)">
              <textarea
                rows={3}
                value={form.demandNote}
                placeholder="Primary phrase, market, monthly searches from your file, and a verdict: Demand confirmed / Low / Unknown."
                onChange={(event) => patchForm({ demandNote: event.target.value })}
              />
            </Field>
          </Section>

          <Section title="Search results and structured data">
            <Field label={`Meta title — ${form.copy.metaTitle.length} characters`}>
              <input type="text" value={form.copy.metaTitle} onChange={(event) => patchCopy({ metaTitle: event.target.value })} />
            </Field>
            <Field label={`Meta description — ${form.copy.metaDescription.length} characters`}>
              <textarea rows={2} value={form.copy.metaDescription} onChange={(event) => patchCopy({ metaDescription: event.target.value })} />
            </Field>
            <div className="a-row">
              <Field label="Service name">
                <input type="text" value={form.copy.serviceName} onChange={(event) => patchCopy({ serviceName: event.target.value })} />
              </Field>
              <Field label="Service type">
                <input type="text" value={form.copy.serviceType} onChange={(event) => patchCopy({ serviceType: event.target.value })} />
              </Field>
              <Field label="Country served">
                <input type="text" value={form.copy.areaServed} onChange={(event) => patchCopy({ areaServed: event.target.value })} />
              </Field>
            </div>
          </Section>

          <Section title={`Hero — ${words} words of body copy on the page`}>
            <Field label="Headline (the H1)">
              <input type="text" value={form.copy.headline} onChange={(event) => patchCopy({ headline: event.target.value })} />
            </Field>
            <Field label="Summary (first paragraph)">
              <textarea rows={3} value={form.copy.summary} onChange={(event) => patchCopy({ summary: event.target.value })} />
            </Field>
          </Section>

          <Section title="How it works (approach)">
            <div className="a-row">
              <Field label="Heading">
                <input type="text" value={form.copy.approach.heading} onChange={(event) => patchCopy({ approach: { ...form.copy.approach, heading: event.target.value } })} />
              </Field>
            </div>
            <Field label="Intro">
              <textarea rows={2} value={form.copy.approach.intro} onChange={(event) => patchCopy({ approach: { ...form.copy.approach, intro: event.target.value } })} />
            </Field>
            <TitledList
              label="Steps"
              items={form.copy.approach.steps}
              onChange={(steps) => patchCopy({ approach: { ...form.copy.approach, steps } })}
            />
          </Section>

          <Section title="What is included">
            <Field label="Heading">
              <input type="text" value={form.copy.included.heading} onChange={(event) => patchCopy({ included: { ...form.copy.included, heading: event.target.value } })} />
            </Field>
            <Field label="Intro">
              <textarea rows={2} value={form.copy.included.intro} onChange={(event) => patchCopy({ included: { ...form.copy.included, intro: event.target.value } })} />
            </Field>
            <TitledList
              label="Deliverables"
              items={form.copy.included.items}
              onChange={(items) => patchCopy({ included: { ...form.copy.included, items } })}
            />
          </Section>

          <Section title="Why work with us (fit)">
            <Field label="Heading">
              <input type="text" value={form.copy.partner.heading} onChange={(event) => patchCopy({ partner: { ...form.copy.partner, heading: event.target.value } })} />
            </Field>
            <TitledList
              label="Points"
              items={form.copy.partner.items}
              onChange={(items) => patchCopy({ partner: { ...form.copy.partner, items } })}
            />
          </Section>

          <Section title="Case studies (only with real work)">
            {form.copy.caseStudies ? (
              <>
                <div className="a-row">
                  <Field label="Heading">
                    <input type="text" value={form.copy.caseStudies.heading} onChange={(event) => patchCopy({ caseStudies: { ...form.copy.caseStudies!, heading: event.target.value } })} />
                  </Field>
                  <Field label="Button label">
                    <input type="text" value={form.copy.caseStudies.cta} onChange={(event) => patchCopy({ caseStudies: { ...form.copy.caseStudies!, cta: event.target.value } })} />
                  </Field>
                </div>
                <NameList
                  items={form.copy.caseStudies.items.map((item) => item.name)}
                  onChange={(names) => patchCopy({ caseStudies: { ...form.copy.caseStudies!, items: names.map((name) => ({ name })) } })}
                />
                <button type="button" className="a-btn" onClick={() => patchCopy({ caseStudies: undefined })}>
                  Remove this section
                </button>
              </>
            ) : (
              <button
                type="button"
                className="a-btn"
                onClick={() => patchCopy({ caseStudies: { heading: "", cta: "", items: [] } })}
              >
                Add a case studies section
              </button>
            )}
          </Section>

          <Section title="Questions (FAQ)">
            <Field label="Heading">
              <input type="text" value={form.copy.faq.heading} onChange={(event) => patchCopy({ faq: { ...form.copy.faq, heading: event.target.value } })} />
            </Field>
            <div className={styles.list}>
              {form.copy.faq.items.map((item, index) => (
                <div key={index} className={styles.item}>
                  <input
                    type="text"
                    placeholder="Question"
                    value={item.question}
                    onChange={(event) =>
                      patchCopy({
                        faq: {
                          ...form.copy.faq,
                          items: form.copy.faq.items.map((entry, i) => (i === index ? { ...entry, question: event.target.value } : entry)),
                        },
                      })
                    }
                  />
                  <textarea
                    rows={3}
                    placeholder="Answer"
                    value={item.answer}
                    onChange={(event) =>
                      patchCopy({
                        faq: {
                          ...form.copy.faq,
                          items: form.copy.faq.items.map((entry, i) => (i === index ? { ...entry, answer: event.target.value } : entry)),
                        },
                      })
                    }
                  />
                  <ItemControls
                    index={index}
                    count={form.copy.faq.items.length}
                    onMove={(to) => patchCopy({ faq: { ...form.copy.faq, items: move(form.copy.faq.items, index, to) } })}
                    onRemove={() => patchCopy({ faq: { ...form.copy.faq, items: form.copy.faq.items.filter((_, i) => i !== index) } })}
                  />
                </div>
              ))}
              <button
                type="button"
                className="a-btn"
                onClick={() => patchCopy({ faq: { ...form.copy.faq, items: [...form.copy.faq.items, { question: "", answer: "" }] } })}
              >
                + Add a question
              </button>
            </div>
          </Section>

          <Section title="Quote form">
            <Field label="Heading">
              <input type="text" value={form.copy.quote.heading} onChange={(event) => patchCopy({ quote: { ...form.copy.quote, heading: event.target.value } })} />
            </Field>
            <Field label="Text above the form">
              <textarea rows={3} value={form.copy.quote.text} onChange={(event) => patchCopy({ quote: { ...form.copy.quote, text: event.target.value } })} />
            </Field>
          </Section>
        </div>

        {dockOpen && (
          <aside className={appStyles.dock}>
            <div className={appStyles.dockTabs} role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={dockTab === "chat"}
                className={appStyles.dockTab}
                onClick={() => setDockTab("chat")}
              >
                AI chat
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={dockTab === "checks"}
                className={appStyles.dockTab}
                onClick={() => setDockTab("checks")}
              >
                Checks{failures.length ? ` · ${failures.length}` : ""}
              </button>
            </div>
            <div className={appStyles.dockBody}>
              {/* Both stay mounted so switching tabs never drops a chat in progress. */}
              <div className={styles.dockPane} hidden={dockTab !== "chat"}>
                <EntityChatPanel
                  key={chatKey}
                  scope="landing"
                  entityId={selectedId}
                  api="/admin/api/landing-chat"
                  tools={chatTools}
                  keywords
                  context={chatContext}
                  placeholder="Build the page for this keyword…"
                  intro="Share your keyword CSVs with the paperclip and ask for a page. The assistant knows the brand voice, the landing page rules, your services and the pages that already exist, and writes straight into the editor. Nothing is saved until you click Save."
                />
              </div>
              <div className={styles.dockPane} hidden={dockTab !== "checks"}>
                <ul className={styles.checkList}>
                  {checks.map((check) => (
                    <li key={check.id} className={styles.check} data-status={check.status}>
                      <span className={styles.checkMark} aria-hidden="true">
                        {check.status === "pass" ? "✓" : check.status === "warn" ? "!" : "✕"}
                      </span>
                      <span>
                        <strong>{check.label}</strong>
                        <br />
                        <span className="a-hint">{check.detail}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

// --- small building blocks ----------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="a-field">
      <span className="a-label">{label}</span>
      {children}
    </label>
  );
}

function move<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function ItemControls({
  index,
  count,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  onMove: (to: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className={styles.controls}>
      <button type="button" className="a-btn" disabled={index === 0} onClick={() => onMove(index - 1)} aria-label="Move up">
        ↑
      </button>
      <button type="button" className="a-btn" disabled={index === count - 1} onClick={() => onMove(index + 1)} aria-label="Move down">
        ↓
      </button>
      <button type="button" className="a-btn a-btn-danger" onClick={onRemove} aria-label="Remove">
        ✕
      </button>
    </div>
  );
}

function TitledList({
  label,
  items,
  onChange,
}: {
  label: string;
  items: { title: string; text: string }[];
  onChange: (items: { title: string; text: string }[]) => void;
}) {
  return (
    <div className={styles.list}>
      <span className="a-label">{label}</span>
      {items.map((item, index) => (
        <div key={index} className={styles.item}>
          <input
            type="text"
            placeholder="Title"
            value={item.title}
            onChange={(event) => onChange(items.map((entry, i) => (i === index ? { ...entry, title: event.target.value } : entry)))}
          />
          <textarea
            rows={3}
            placeholder="Text"
            value={item.text}
            onChange={(event) => onChange(items.map((entry, i) => (i === index ? { ...entry, text: event.target.value } : entry)))}
          />
          <ItemControls
            index={index}
            count={items.length}
            onMove={(to) => onChange(move(items, index, to))}
            onRemove={() => onChange(items.filter((_, i) => i !== index))}
          />
        </div>
      ))}
      <button type="button" className="a-btn" onClick={() => onChange([...items, { title: "", text: "" }])}>
        + Add
      </button>
    </div>
  );
}

function NameList({ items, onChange }: { items: string[]; onChange: (items: string[]) => void }) {
  return (
    <div className={styles.list}>
      <span className="a-label">Projects shown</span>
      {items.map((name, index) => (
        <div key={index} className={styles.item}>
          <input
            type="text"
            placeholder="Project name"
            value={name}
            onChange={(event) => onChange(items.map((entry, i) => (i === index ? event.target.value : entry)))}
          />
          <ItemControls
            index={index}
            count={items.length}
            onMove={(to) => onChange(move(items, index, to))}
            onRemove={() => onChange(items.filter((_, i) => i !== index))}
          />
        </div>
      ))}
      <button type="button" className="a-btn" onClick={() => onChange([...items, ""])}>
        + Add a project
      </button>
    </div>
  );
}
