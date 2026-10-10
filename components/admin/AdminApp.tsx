"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import type { Project } from "@/lib/projects";
import type { Folder } from "@/lib/folders";
import type { Industry, Service } from "@/lib/content";
import { enabledLocales } from "@/lib/locale";
import { loadLocaleDataAction, saveProjectAction } from "@/app/admin/actions";
import { deleteChatsForPageAction } from "@/app/admin/chat-actions";
import { ProjectSidebar } from "./ProjectSidebar";
import { ProjectEditor } from "./ProjectEditor";
import { SeoPanel } from "./SeoPanel";
import { AdvancedPanel } from "./AdvancedPanel";
import { EntityChatPanel, type ChatTool } from "./EntityChatPanel";
import { blankForm, toForm, type ProjectFormState } from "./form-state";
import styles from "./AdminApp.module.css";

type DockTab = "seo" | "advanced" | "ai";

const DOCK_TABS: { id: DockTab; label: string }[] = [
  { id: "seo", label: "SEO" },
  { id: "advanced", label: "Advanced" },
  { id: "ai", label: "AI" },
];

export function AdminApp({
  initialLocale,
  initialProjects,
  initialFolders,
  initialIndustries,
  initialServices,
}: {
  initialLocale: string;
  initialProjects: Project[];
  initialFolders: Folder[];
  initialIndustries: Industry[];
  initialServices: Service[];
}) {
  const [locale, setLocale] = useState(initialLocale);
  const [projects, setProjects] = useState(initialProjects);
  const [folders, setFolders] = useState(initialFolders);
  const [industries, setIndustries] = useState(initialIndustries);
  const [services, setServices] = useState(initialServices);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // The editor draft lives here so the SEO, Advanced and AI panels all read and
  // write the same in-progress project. Nothing here is persisted until Save.
  const [form, setForm] = useState<ProjectFormState>(blankForm);

  // One chat panel per editing session: it survives the first save of a new project.
  const [chatKey, setChatKey] = useState(() => crypto.randomUUID());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dockOpen, setDockOpen] = useState(true);
  const [dockTab, setDockTab] = useState<DockTab>("seo");
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedProject = projects.find((project) => project.id === selectedId) ?? null;

  const patchForm = useCallback((patch: Partial<ProjectFormState>) => {
    setForm((current) => ({ ...current, ...patch }));
  }, []);

  const selectProject = useCallback(
    (id: string | null, from: Project[] = projects) => {
      setSelectedId(id);
      setForm(toForm(from.find((project) => project.id === id) ?? null));
      setNotice(null);
      setChatKey(crypto.randomUUID());
    },
    [projects],
  );

  const switchLocale = (nextLocale: string, selectAfter?: string) => {
    startTransition(async () => {
      const result = await loadLocaleDataAction(nextLocale);
      if (!result.ok) {
        setNotice(result.error);
        return;
      }
      setLocale(nextLocale);
      setProjects(result.data.projects);
      setFolders(result.data.folders);
      setIndustries(result.data.industries);
      setServices(result.data.services);
      selectProject(selectAfter ?? null, result.data.projects);
    });
  };

  const handleSaved = (project: Project) => {
    setProjects((current) => {
      const exists = current.some((item) => item.id === project.id);
      return exists
        ? current.map((item) => (item.id === project.id ? project : item))
        : [project, ...current];
    });
    setSelectedId(project.id);
    setForm(toForm(project));
    setNotice(null);
  };

  const handleCreatedMany = (created: Project[]) => {
    setProjects((current) => [...created, ...current]);
  };

  // The assistant reads the draft at send/apply time, not when the panel mounted.
  const formRef = useRef(form);
  formRef.current = form;
  const industriesRef = useRef(industries);
  industriesRef.current = industries;
  const servicesRef = useRef(services);
  servicesRef.current = services;
  const localeRef = useRef(locale);
  localeRef.current = locale;

  const chatTools = useMemo<Record<string, ChatTool>>(() => {
    const describe = (fields: Record<string, unknown>) =>
      Object.entries(fields)
        .filter(([, value]) => value !== undefined && value !== "")
        .map(([key, value]) => {
          const text = String(value);
          return `${key}: ${text.length > 80 ? `${text.slice(0, 80)}…` : text}`;
        });
    return {
      proposeProject: {
        title: "Added to the project",
        mode: "auto",
        note: (input) => (input as { note?: string }).note,
        summarize: (input) => describe((input as { fields?: Record<string, unknown> }).fields ?? {}),
        apply: (input) => {
          const fields = ((input as { fields?: Partial<ProjectFormState> }).fields ?? {}) as Partial<ProjectFormState>;
          const before: Record<string, unknown> = {};
          for (const key of Object.keys(fields)) {
            before[key] = formRef.current[key as keyof ProjectFormState];
          }
          setForm((current) => ({ ...current, ...fields }));
          return {
            message: "Added to the editor. Review it, then click Save.",
            undo: () => setForm((current) => ({ ...current, ...(before as Partial<ProjectFormState>) })),
          };
        },
      },
      proposeBulkProjects: {
        title: "Projects proposed",
        mode: "confirm",
        note: (input) => (input as { note?: string }).note,
        summarize: (input) =>
          ((input as { projects?: Partial<ProjectFormState>[] }).projects ?? []).map(
            (project) => `${project.title ?? "Untitled"} — ${project.category ?? "?"} · ${project.service ?? "?"}`,
          ),
        confirmLabel: (input) =>
          `Create ${((input as { projects?: unknown[] }).projects ?? []).length} drafts`,
        apply: async (input) => {
          const proposals = ((input as { projects?: Partial<ProjectFormState>[] }).projects ?? []);
          const created: Project[] = [];
          const failures: string[] = [];
          for (const proposal of proposals) {
            const result = await saveProjectAction({
              ...blankForm,
              ...proposal,
              id: null,
              locale: localeRef.current,
              // Bulk output always lands as a draft, so nothing goes live unreviewed.
              status: "draft",
            });
            if (result.ok) created.push(result.data);
            else failures.push(`${proposal.title ?? "untitled"}: ${result.error}`);
          }
          if (created.length) handleCreatedMany(created);
          return `Created ${created.length} draft project(s)${failures.length ? `. Failed: ${failures.join("; ")}` : ""}.`;
        },
      },
    };
    // handleCreatedMany only uses a state setter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleted = (id: string) => {
    void deleteChatsForPageAction("project", id);
    setProjects((current) => current.filter((item) => item.id !== id));
    selectProject(null);
  };

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <button
          type="button"
          className={styles.paneToggle}
          onClick={() => setSidebarOpen((open) => !open)}
          aria-pressed={sidebarOpen}
          title={sidebarOpen ? "Hide project list" : "Show project list"}
        >
          {sidebarOpen ? "◧" : "▢"}
        </button>
        <div className={styles.topbarControls}>
          <label className={styles.localeSwitcher}>
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
            className={styles.paneToggle}
            onClick={() => setDockOpen((open) => !open)}
            aria-pressed={dockOpen}
            title={dockOpen ? "Hide side panels" : "Show side panels"}
          >
            {dockOpen ? "◨" : "▢"}
          </button>
        </div>
      </header>

      {notice && <div className={styles.notice}>{notice}</div>}

      <div
        className={styles.body}
        data-sidebar={sidebarOpen ? "open" : "closed"}
        data-dock={dockOpen ? "open" : "closed"}
      >
        {sidebarOpen && (
          <ProjectSidebar
            locale={locale}
            projects={projects}
            folders={folders}
            currentId={selectedId}
            onSelect={(id) => selectProject(id)}
            onNew={() => selectProject(null)}
            onFoldersChange={setFolders}
            onError={setNotice}
          />
        )}

        <ProjectEditor
          locale={locale}
          project={selectedProject}
          form={form}
          onChange={patchForm}
          folders={folders}
          industries={industries}
          services={services}
          otherLocales={enabledLocales.filter((candidate) => candidate.code !== locale)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
          onDuplicated={(project) => switchLocale(project.locale, project.id)}
          // A move takes the project out of this locale, so follow it across
          // rather than leaving the editor pointed at a row that is gone.
          onMoved={(project) => switchLocale(project.locale, project.id)}
        />

        {dockOpen && (
          <aside className={styles.dock}>
            <div className={styles.dockTabs} role="tablist">
              {DOCK_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={dockTab === tab.id}
                  className={styles.dockTab}
                  onClick={() => setDockTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className={styles.dockBody}>
              {dockTab === "seo" && (
                <SeoPanel locale={locale} project={selectedProject} form={form} onChange={patchForm} />
              )}
              {dockTab === "advanced" && <AdvancedPanel form={form} onChange={patchForm} />}
              {dockTab === "ai" && (
                <EntityChatPanel
                  // Stable for the editing session so the first save keeps the open chat.
                  key={`${locale}:${chatKey}`}
                  scope="project"
                  entityId={selectedId}
                  api="/admin/api/chat"
                  tools={chatTools}
                  keywords
                  placeholder="Write the case study for this project…"
                  intro="Ask for a case study, SEO fields, or a batch of projects. Share keyword CSVs with the paperclip. Proposals for this project are added to the editor; nothing is saved until you click Save."
                  context={() => {
                    const f = formRef.current;
                    return {
                      locale: localeRef.current,
                      current: {
                        title: f.title,
                        slug: f.slug,
                        category: f.category,
                        service: f.service,
                        summary: f.summary,
                        status: f.status,
                        metaTitle: f.metaTitle,
                        metaDescription: f.metaDescription,
                        focusKeyword: f.focusKeyword,
                        contentHtml: f.content,
                      },
                    };
                  }}
                />
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
