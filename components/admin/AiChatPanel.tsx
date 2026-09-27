"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isToolUIPart, getToolName } from "ai";
import type { Project } from "@/lib/projects";
import type { Industry, Service } from "@/lib/content";
import { saveProjectAction } from "@/app/admin/actions";
import { blankForm, type ProjectFormState } from "./form-state";
import styles from "./AiChatPanel.module.css";

/** The subset of the form the assistant is allowed to propose. */
type ProposedFields = Partial<ProjectFormState>;

type ProposeProjectInput = { note?: string; fields?: ProposedFields };
type ProposeBulkInput = { note?: string; projects?: ProposedFields[] };

function describe(fields: ProposedFields): string[] {
  return Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => {
      const text = typeof value === "string" ? value : String(value);
      return `${key}: ${text.length > 80 ? `${text.slice(0, 80)}…` : text}`;
    });
}

export function AiChatPanel({
  locale,
  form,
  industries,
  services,
  onApplyFields,
  onCreatedMany,
}: {
  locale: string;
  form: ProjectFormState;
  industries: Industry[];
  services: Service[];
  onApplyFields: (patch: ProposedFields) => void;
  onCreatedMany: (projects: Project[]) => void;
}) {
  const [input, setInput] = useState("");
  const [busyToolCallId, setBusyToolCallId] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<Record<string, string>>({});

  const { messages, sendMessage, status, error, addToolOutput } = useChat({
    transport: new DefaultChatTransport({
      api: "/admin/api/chat",
      // The route needs the locale to pick the writing language and the valid
      // category/service slugs; body is merged into every request.
      body: { locale },
    }),
  });

  const note = (toolCallId: string, text: string) =>
    setOutcomes((current) => ({ ...current, [toolCallId]: text }));

  const applySingle = (toolCallId: string, fields: ProposedFields) => {
    onApplyFields(fields);
    note(toolCallId, "Applied to the editor — review it, then click Save.");
    addToolOutput({
      tool: "proposeProject",
      toolCallId,
      output: "Applied to the editor. Not saved yet.",
    });
  };

  const createMany = async (toolCallId: string, proposals: ProposedFields[]) => {
    setBusyToolCallId(toolCallId);
    const created: Project[] = [];
    const failures: string[] = [];

    for (const proposal of proposals) {
      const result = await saveProjectAction({
        ...blankForm,
        ...proposal,
        id: null,
        locale,
        // Bulk output always lands as a draft — nothing goes live unreviewed.
        status: "draft",
      });
      if (result.ok) created.push(result.data);
      else failures.push(`${proposal.title ?? "untitled"}: ${result.error}`);
    }

    setBusyToolCallId(null);
    if (created.length) onCreatedMany(created);
    note(
      toolCallId,
      `Created ${created.length} draft project(s)${failures.length ? `; ${failures.length} failed` : ""}.`,
    );
    addToolOutput({
      tool: "proposeBulkProjects",
      toolCallId,
      output: `Created ${created.length} drafts. ${failures.length ? `Failed: ${failures.join("; ")}` : ""}`,
    });
  };

  const decline = (tool: "proposeProject" | "proposeBulkProjects", toolCallId: string) => {
    note(toolCallId, "Dismissed.");
    addToolOutput({ tool, toolCallId, output: "The editor dismissed this proposal." });
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || status === "streaming" || status === "submitted") return;
    // Give the model the state of the open project so "improve this" works.
    const context = [
      `[Open project — title: ${form.title || "(empty)"}; category: ${form.category || "(none)"};`,
      `service: ${form.service || "(none)"}; summary: ${form.summary || "(empty)"};`,
      `content length: ${form.content.length} chars]`,
    ].join(" ");
    sendMessage({ text: `${context}\n\n${text}` });
    setInput("");
  };

  return (
    <div className={styles.panel}>
      <div className={styles.log}>
        {messages.length === 0 && (
          <p className={styles.intro}>
            Ask for a case study, SEO fields, or a batch of projects. Nothing is written until you
            apply a proposal. {industries.length} categories and {services.length} services
            available in this locale.
          </p>
        )}

        {messages.map((message) => (
          <div key={message.id} className={styles.message} data-role={message.role}>
            {message.parts.map((part, index) => {
              if (part.type === "text") {
                return (
                  <p key={index} className={styles.text}>
                    {part.text}
                  </p>
                );
              }

              if (!isToolUIPart(part)) return null;

              const toolName = getToolName(part);
              const toolCallId = part.toolCallId;
              const settled = outcomes[toolCallId];

              if (part.state === "input-streaming") {
                return (
                  <p key={index} className={styles.pending}>
                    Drafting…
                  </p>
                );
              }

              if (toolName === "proposeProject") {
                const { note: summary, fields = {} } = (part.input ?? {}) as ProposeProjectInput;
                return (
                  <div key={index} className={styles.card}>
                    <div className={styles.cardTitle}>Proposed fields</div>
                    {summary && <p className={styles.cardNote}>{summary}</p>}
                    <ul className={styles.fieldList}>
                      {describe(fields).map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                    {settled ? (
                      <p className={styles.settled}>{settled}</p>
                    ) : (
                      <div className={styles.cardActions}>
                        <button
                          type="button"
                          className="a-btn a-btn-primary"
                          onClick={() => applySingle(toolCallId, fields)}
                        >
                          Apply to editor
                        </button>
                        <button
                          type="button"
                          className="a-btn"
                          onClick={() => decline("proposeProject", toolCallId)}
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              if (toolName === "proposeBulkProjects") {
                const { note: summary, projects = [] } = (part.input ?? {}) as ProposeBulkInput;
                return (
                  <div key={index} className={styles.card}>
                    <div className={styles.cardTitle}>{projects.length} projects proposed</div>
                    {summary && <p className={styles.cardNote}>{summary}</p>}
                    <ol className={styles.fieldList}>
                      {projects.map((proposal, i) => (
                        <li key={i}>
                          {proposal.title ?? "Untitled"}
                          <span className={styles.muted}>
                            {" "}
                            — {proposal.category ?? "?"} · {proposal.service ?? "?"}
                          </span>
                        </li>
                      ))}
                    </ol>
                    {settled ? (
                      <p className={styles.settled}>{settled}</p>
                    ) : (
                      <div className={styles.cardActions}>
                        <button
                          type="button"
                          className="a-btn a-btn-primary"
                          disabled={busyToolCallId === toolCallId}
                          onClick={() => createMany(toolCallId, projects)}
                        >
                          {busyToolCallId === toolCallId
                            ? "Creating…"
                            : `Create ${projects.length} drafts`}
                        </button>
                        <button
                          type="button"
                          className="a-btn"
                          onClick={() => decline("proposeBulkProjects", toolCallId)}
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              return null;
            })}
          </div>
        ))}

        {(status === "submitted" || status === "streaming") && (
          <p className={styles.pending}>Thinking…</p>
        )}
        {error && <p className="a-error">{error.message}</p>}
      </div>

      <form className={styles.composer} onSubmit={submit}>
        <textarea
          className="a-input"
          rows={2}
          placeholder="Write the case study for this project…"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) submit(event);
          }}
        />
        <button
          type="submit"
          className="a-btn a-btn-primary"
          disabled={!input.trim() || status === "streaming" || status === "submitted"}
        >
          Send
        </button>
      </form>
    </div>
  );
}
