"use client";

import { useCallback, useState, useTransition } from "react";
import type { Project } from "@/lib/projects";
import type { Folder } from "@/lib/folders";
import type { Industry, Service } from "@/lib/content";
import { enabledLocales } from "@/lib/locale";
import { loadLocaleDataAction, logoutAction } from "@/app/admin/actions";
import { ProjectSidebar } from "./ProjectSidebar";
import { ProjectEditor } from "./ProjectEditor";
import { SeoPanel } from "./SeoPanel";
import { AdvancedPanel } from "./AdvancedPanel";
import { AiChatPanel } from "./AiChatPanel";
import { ThemeToggle } from "./ThemeToggle";
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

  const handleDeleted = (id: string) => {
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
        <div className={styles.brand}>Mellon Admin</div>
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
          <ThemeToggle />
          <form action={logoutAction}>
            <button type="submit" className="a-btn">
              Log out
            </button>
          </form>
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
                <AiChatPanel
                  locale={locale}
                  form={form}
                  industries={industries}
                  services={services}
                  onApplyFields={patchForm}
                  onCreatedMany={handleCreatedMany}
                />
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
