"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import type { Post } from "@/lib/posts";
import { PROJECT_STATUSES, STATUS_LABELS } from "@/lib/project-fields";
import { enabledLocales } from "@/lib/locale";
import { savePostAction, deletePostAction, loadPostsAction } from "@/app/admin/blog-actions";
import { createMediaUploadAction, convertMediaToAvifAction } from "@/app/admin/actions";
import { deleteChatsForPageAction } from "@/app/admin/chat-actions";
import { RichContentEditor } from "./RichContentEditor";
import { HeroBgPicker } from "./HeroBgPicker";
import { EntityChatPanel, type ChatTool } from "./EntityChatPanel";
import appStyles from "./AdminApp.module.css";
import sideStyles from "./ProjectSidebar.module.css";
import editorStyles from "./ProjectEditor.module.css";

type FormState = {
  slug: string;
  title: string;
  summary: string;
  heroImage: string;
  heroImageAlt: string;
  heroImageWidth: number | null;
  heroImageHeight: number | null;
  heroBg: string;
  category: string;
  content: string;
  featured: boolean;
  status: Post["status"];
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  noindex: boolean;
};

const blankForm: FormState = {
  slug: "",
  title: "",
  summary: "",
  heroImage: "",
  heroImageAlt: "",
  heroImageWidth: null,
  heroImageHeight: null,
  heroBg: "",
  category: "",
  content: "",
  featured: false,
  status: "draft",
  metaTitle: "",
  metaDescription: "",
  focusKeyword: "",
  canonicalUrl: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  noindex: false,
};

function toForm(post: Post | null): FormState {
  if (!post) return blankForm;
  return {
    slug: post.slug,
    title: post.title,
    summary: post.summary ?? "",
    heroImage: post.heroImage ?? "",
    heroImageAlt: post.heroImageAlt ?? "",
    heroImageWidth: post.heroImageWidth,
    heroImageHeight: post.heroImageHeight,
    heroBg: post.heroBg ?? "",
    category: post.category ?? "",
    content: post.content,
    featured: post.featured,
    status: post.status,
    metaTitle: post.metaTitle ?? "",
    metaDescription: post.metaDescription ?? "",
    focusKeyword: post.focusKeyword ?? "",
    canonicalUrl: post.canonicalUrl ?? "",
    ogTitle: post.ogTitle ?? "",
    ogDescription: post.ogDescription ?? "",
    ogImage: post.ogImage ?? "",
    noindex: post.noindex,
  };
}

/** Same three-hop upload as the project editor: sign, PUT direct, AVIF-convert. */
async function uploadFile(file: File): Promise<string> {
  const signed = await createMediaUploadAction({
    filename: file.name,
    size: file.size,
    type: file.type,
  });
  if (!signed.ok) throw new Error(signed.error);

  const { uploadUrl, publicUrl, contentType, convertible } = signed.data;
  let response: Response;
  try {
    response = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType, "x-upsert": "false" },
      body: file,
    });
  } catch {
    throw new Error("Upload failed — check your connection and try again.");
  }
  if (!response.ok) throw new Error(`Upload failed (${response.status}). Please try again.`);

  if (!convertible) return publicUrl;
  const compressed = await convertMediaToAvifAction(publicUrl);
  return compressed.ok ? compressed.data.publicUrl : publicUrl;
}

export function BlogApp({
  initialLocale,
  initialPosts,
}: {
  initialLocale: string;
  initialPosts: Post[];
}) {
  const [locale, setLocale] = useState(initialLocale);
  const [posts, setPosts] = useState(initialPosts);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dockOpen, setDockOpen] = useState(true);
  // One chat panel per editing session: it survives the first save of a new post.
  const [chatKey, setChatKey] = useState(() => crypto.randomUUID());
  const [isPending, startTransition] = useTransition();
  const heroFileInputRef = useRef<HTMLInputElement>(null);

  // Categories already in use in this locale, offered as suggestions.
  const categories = [...new Set(posts.map((post) => post.category).filter(Boolean))] as string[];

  const selected = posts.find((post) => post.id === selectedId) ?? null;
  const patch = (next: Partial<FormState>) => setForm((current) => ({ ...current, ...next }));

  // The assistant reads these at send/apply time, not when the panel mounted.
  const formRef = useRef(form);
  formRef.current = form;
  const categoriesRef = useRef(categories);
  categoriesRef.current = categories;

  const chatTools = useMemo<Record<string, ChatTool>>(
    () => ({
      proposePost: {
        title: "Added to the post",
        mode: "auto",
        note: (input) => (input as { note?: string }).note,
        summarize: (input) =>
          Object.entries((input as { fields?: Record<string, unknown> }).fields ?? {})
            .filter(([, value]) => value !== undefined && value !== "")
            .map(([key, value]) => {
              const text = String(value);
              return `${key}: ${text.length > 80 ? `${text.slice(0, 80)}…` : text}`;
            }),
        apply: (input) => {
          const fields = ((input as { fields?: Record<string, string> }).fields ?? {}) as Partial<FormState>;
          const before: Record<string, unknown> = {};
          for (const key of Object.keys(fields)) {
            before[key] = formRef.current[key as keyof FormState];
          }
          setForm((current) => ({ ...current, ...fields }));
          return {
            message: "Added to the editor. Review it, then click Save.",
            undo: () => setForm((current) => ({ ...current, ...(before as Partial<FormState>) })),
          };
        },
      },
    }),
    [],
  );

  const select = (post: Post | null) => {
    setSelectedId(post?.id ?? null);
    setForm(toForm(post));
    setError(null);
    setNotice(null);
    setConfirmingDelete(false);
    setChatKey(crypto.randomUUID());
  };

  const switchLocale = (next: string) => {
    startTransition(async () => {
      const result = await loadPostsAction(next);
      if (!result.ok) {
        setNotice(result.error);
        return;
      }
      setLocale(next);
      setPosts(result.data);
      select(null);
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const result = await savePostAction({ id: selected?.id ?? null, locale, ...form });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const saved = result.data;
    setPosts((current) =>
      current.some((post) => post.id === saved.id)
        ? current.map((post) => (post.id === saved.id ? saved : post))
        : [saved, ...current],
    );
    setSelectedId(saved.id);
    setForm(toForm(saved));
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setDeleting(true);
    const result = await deletePostAction(selected.id, locale);
    setDeleting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await deleteChatsForPageAction("blog", selected.id);
    setPosts((current) => current.filter((post) => post.id !== selected.id));
    select(null);
  };

  const handleHeroFile = async (file: File) => {
    setUploadingHero(true);
    try {
      patch({ heroImage: await uploadFile(file) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploadingHero(false);
    }
  };

  const copyUrl = async (post: Post) => {
    const url = `${window.location.origin}/${locale}/blog/${post.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(post.id);
      setTimeout(() => setCopiedId((current) => (current === post.id ? null : current)), 1500);
    } catch {
      window.prompt("Copy this URL", url);
    }
  };

  return (
    <div className={appStyles.shell}>
      <header className={appStyles.topbar}>
        <span className={appStyles.brand}>Blog</span>
        <div className={appStyles.topbarControls}>
          <label className={appStyles.localeSwitcher}>
            <span>Locale</span>
            <select
              value={locale}
              onChange={(event) => switchLocale(event.target.value)}
              disabled={isPending}
            >
              {enabledLocales.map((config) => (
                <option key={config.code} value={config.code}>
                  {config.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className={appStyles.paneToggle}
            onClick={() => setDockOpen((open) => !open)}
            aria-pressed={dockOpen}
            title={dockOpen ? "Hide AI chat" : "Show AI chat"}
          >
            {dockOpen ? "◨" : "▢"}
          </button>
        </div>
      </header>

      {notice && <div className={appStyles.notice}>{notice}</div>}

      <div className={appStyles.body} data-dock={dockOpen ? "open" : "closed"}>
        <aside className={sideStyles.sidebar}>
          <div className={sideStyles.head}>
            <span className="a-label">Posts — {posts.length}</span>
          </div>
          <div className={sideStyles.list} style={{ paddingLeft: 0, flex: 1 }}>
            {posts.length === 0 && <p className={sideStyles.empty}>No posts yet.</p>}
            {posts.map((post) => (
              <div key={post.id} className={sideStyles.row}>
                <button
                  type="button"
                  className={`${sideStyles.item} ${post.id === selectedId ? sideStyles.active : ""}`}
                  onClick={() => select(post)}
                >
                  <span className={sideStyles.itemHead}>
                    <span className={sideStyles.dot} data-status={post.status} aria-hidden="true" />
                    <span className={sideStyles.itemTitle}>
                      {post.featured && (
                        <span className={sideStyles.star} title="Featured">
                          ★
                        </span>
                      )}
                      {post.title || "Untitled"}
                    </span>
                  </span>
                  <span className={sideStyles.itemMeta}>
                    <span className={sideStyles.status} data-status={post.status}>
                      {STATUS_LABELS[post.status]}
                    </span>
                    {post.category && <span className={sideStyles.taxonomy}>{post.category}</span>}
                  </span>
                </button>
                <button
                  type="button"
                  className={sideStyles.copyButton}
                  onClick={() => copyUrl(post)}
                  title={copiedId === post.id ? "Copied" : "Copy page URL"}
                  aria-label={`Copy URL of ${post.title || "post"}`}
                >
                  {copiedId === post.id ? (
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
            + New post
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
                  onClick={() => patch({ status })}
                >
                  {STATUS_LABELS[status]}
                </button>
              ))}
            </div>
            <label className={editorStyles.checkbox}>
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(event) => patch({ featured: event.target.checked })}
              />
              <span>Featured</span>
            </label>
            <div className={editorStyles.actions}>
              <button
                type="button"
                className="a-btn a-btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save"}
              </button>
              {selected && (
                <button
                  type="button"
                  className="a-btn a-btn-danger"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "Deleting…" : confirmingDelete ? "Confirm delete" : "Delete"}
                </button>
              )}
            </div>
          </div>

          {error && (
            <p className="a-error" role="alert">
              {error}
            </p>
          )}

          <div className="a-row">
            <div className="a-field">
              <label htmlFor="bp-title">Title</label>
              <input
                id="bp-title"
                type="text"
                value={form.title}
                onChange={(event) => patch({ title: event.target.value })}
              />
            </div>
            <div className="a-field">
              <label htmlFor="bp-slug">Slug</label>
              <input
                id="bp-slug"
                type="text"
                placeholder="auto from title"
                value={form.slug}
                onChange={(event) => patch({ slug: event.target.value })}
              />
            </div>
          </div>
          {selected && selected.slug !== form.slug && (
            <p className="a-hint">
              Saving renames the URL. <code>{selected.slug}</code> will keep working as a redirect.
            </p>
          )}

          <div className="a-field">
            <label htmlFor="bp-category">Category</label>
            <input
              id="bp-category"
              type="text"
              list="bp-categories"
              placeholder="Pick one or type a new one"
              value={form.category}
              onChange={(event) => patch({ category: event.target.value })}
            />
            <datalist id="bp-categories">
              {categories.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          <div className="a-field">
            <label htmlFor="bp-summary">Summary</label>
            <textarea
              id="bp-summary"
              rows={2}
              value={form.summary}
              onChange={(event) => patch({ summary: event.target.value })}
            />
          </div>

          <div className="a-field">
            <span className="a-label">Hero image</span>
            <div className={editorStyles.heroRow}>
              {form.heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className={editorStyles.heroPreview}
                  src={form.heroImage}
                  alt=""
                  onLoad={(event) =>
                    patch({
                      heroImageWidth: event.currentTarget.naturalWidth || null,
                      heroImageHeight: event.currentTarget.naturalHeight || null,
                    })
                  }
                  onError={() => patch({ heroImageWidth: null, heroImageHeight: null })}
                />
              ) : (
                <div className={editorStyles.heroPlaceholder}>No image</div>
              )}
              <input
                className="a-input"
                type="text"
                placeholder="Paste an image URL…"
                value={form.heroImage}
                onChange={(event) => patch({ heroImage: event.target.value })}
              />
              <button
                type="button"
                className="a-btn"
                onClick={() => heroFileInputRef.current?.click()}
                disabled={uploadingHero}
              >
                {uploadingHero ? "Uploading…" : "Upload"}
              </button>
              <input
                ref={heroFileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) handleHeroFile(file);
                }}
              />
            </div>
          </div>

          {form.heroImage && (
            <div className="a-field">
              <label htmlFor="bp-hero-alt">Hero alt text</label>
              <input
                id="bp-hero-alt"
                type="text"
                placeholder="Describe the image for screen readers and image search"
                value={form.heroImageAlt}
                onChange={(event) => patch({ heroImageAlt: event.target.value })}
              />
            </div>
          )}

          <HeroBgPicker value={form.heroBg} onChange={(heroBg) => patch({ heroBg })} />

          <div className="a-field">
            <span className="a-label">Content</span>
            <RichContentEditor
              // Remount per post: the editor seeds from `value` once.
              key={selectedId ?? "new"}
              value={form.content}
              onChange={(content) => patch({ content })}
              onUploadFile={uploadFile}
            />
          </div>

          <details className="a-field">
            <summary className="a-label">SEO</summary>
            <div className="a-field">
              <label htmlFor="bp-meta-title">Meta title</label>
              <input
                id="bp-meta-title"
                type="text"
                placeholder="defaults to the title"
                value={form.metaTitle}
                onChange={(event) => patch({ metaTitle: event.target.value })}
              />
            </div>
            <div className="a-field">
              <label htmlFor="bp-meta-desc">Meta description</label>
              <textarea
                id="bp-meta-desc"
                rows={2}
                placeholder="defaults to the summary"
                value={form.metaDescription}
                onChange={(event) => patch({ metaDescription: event.target.value })}
              />
            </div>
            <div className="a-field">
              <label htmlFor="bp-focus">Focus keyword</label>
              <input
                id="bp-focus"
                type="text"
                value={form.focusKeyword}
                onChange={(event) => patch({ focusKeyword: event.target.value })}
              />
            </div>
            <div className="a-field">
              <label htmlFor="bp-canonical">Canonical URL</label>
              <input
                id="bp-canonical"
                type="text"
                placeholder={`auto: /${locale}/blog/${form.slug || "slug"}`}
                value={form.canonicalUrl}
                onChange={(event) => patch({ canonicalUrl: event.target.value })}
              />
            </div>
            <div className="a-row">
              <div className="a-field">
                <label htmlFor="bp-og-title">Social title</label>
                <input
                  id="bp-og-title"
                  type="text"
                  value={form.ogTitle}
                  onChange={(event) => patch({ ogTitle: event.target.value })}
                />
              </div>
              <div className="a-field">
                <label htmlFor="bp-og-image">Social image URL</label>
                <input
                  id="bp-og-image"
                  type="text"
                  placeholder="defaults to the hero image"
                  value={form.ogImage}
                  onChange={(event) => patch({ ogImage: event.target.value })}
                />
              </div>
            </div>
            <div className="a-field">
              <label htmlFor="bp-og-desc">Social description</label>
              <textarea
                id="bp-og-desc"
                rows={2}
                value={form.ogDescription}
                onChange={(event) => patch({ ogDescription: event.target.value })}
              />
            </div>
            <label className={editorStyles.checkbox}>
              <input
                type="checkbox"
                checked={form.noindex}
                onChange={(event) => patch({ noindex: event.target.checked })}
              />
              <span>Keep out of search results (noindex)</span>
            </label>
          </details>
        </div>

        {dockOpen && (
          <aside className={appStyles.dock}>
            <div className={appStyles.dockTabs}>
              <span className={appStyles.dockTab} aria-selected="true">
                AI chat
              </span>
            </div>
            <div className={appStyles.dockBody}>
              <EntityChatPanel
                // Stable for the editing session so the first save keeps the open chat.
                key={`${locale}:${chatKey}`}
                scope="blog"
                entityId={selectedId}
                api="/admin/api/blog-chat"
                tools={chatTools}
                keywords
                placeholder="Write the intro for this post…"
                intro="Ask for a draft, a tighter intro, or the SEO fields. Share keyword CSVs with the paperclip. Proposals are added to the editor; nothing is saved until you click Save."
                context={() => {
                  const f = formRef.current;
                  return {
                    locale,
                    categories: categoriesRef.current,
                    current: {
                      title: f.title,
                      slug: f.slug,
                      summary: f.summary,
                      category: f.category,
                      status: f.status,
                      metaTitle: f.metaTitle,
                      metaDescription: f.metaDescription,
                      focusKeyword: f.focusKeyword,
                      contentHtml: f.content,
                    },
                  };
                }}
              />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
