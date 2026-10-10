"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isToolUIPart, getToolName, type UIMessage } from "ai";
import type { ChatScope, ChatSummary } from "@/lib/admin-chats";
import {
  summariseKeywordCsv,
  wrapKeywordFiles,
  splitKeywordBlocks,
  type KeywordFile,
} from "@/lib/keyword-csv";
import {
  listChatsAction,
  loadChatAction,
  createChatAction,
  attachChatsAction,
  renameChatAction,
  saveChatMessagesAction,
  deleteChatAction,
} from "@/app/admin/chat-actions";
import chat from "./AiChatPanel.module.css";
import styles from "./EntityChatPanel.module.css";

export type ToolOutcome = string | { message: string; undo?: () => void };

/**
 * How one assistant tool is shown and applied. `auto` tools write straight into
 * the editor draft the moment the assistant proposes them (with an Undo while the
 * session lasts); `confirm` tools, such as creating database rows, wait for a click.
 * Either way nothing is saved until the editor presses Save.
 */
export type ChatTool = {
  title: string;
  mode: "auto" | "confirm";
  confirmLabel?: (input: unknown) => string;
  note?: (input: unknown) => string | undefined;
  summarize: (input: unknown) => string[];
  apply: (input: unknown) => Promise<ToolOutcome> | ToolOutcome;
};

const DEFAULT_TITLE = "New chat";

/**
 * Saved AI chats for one page (a landing page, blog post or project). Each page
 * keeps its own history in Supabase: create, open, rename and delete chats, and
 * talk to the assistant inside the open one. The assistant receives the page's
 * current state (`context`, read fresh on every send) plus the whole conversation,
 * and can take keyword CSVs as attachments.
 *
 * A page that has not been saved yet has no id to file chats under: chats made
 * meanwhile are remembered here and attached when `entityId` appears. The parent
 * must give this component a stable `key` for the life of one editing session
 * (not the entity id), so that first save does not remount it.
 */
export function EntityChatPanel({
  scope,
  entityId,
  api,
  context,
  tools,
  placeholder,
  intro,
  keywords = false,
}: {
  scope: ChatScope;
  entityId: string | null;
  api: string;
  context: () => Record<string, unknown>;
  tools: Record<string, ChatTool>;
  placeholder: string;
  intro: string;
  keywords?: boolean;
}) {
  const [chats, setChats] = useState<ChatSummary[] | null>(entityId ? null : []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [initial, setInitial] = useState<UIMessage[] | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Chats created before the page had an id.
  const sessionIds = useRef<string[]>([]);

  const active = chats?.find((item) => item.id === activeId) ?? null;

  const open = async (id: string) => {
    setActiveId(id);
    setInitial(null);
    setRenaming(false);
    setConfirmingDelete(false);
    setError(null);
    const result = await loadChatAction(id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setInitial(result.data.messages as UIMessage[]);
  };

  // Load this page's chats once its id is known. If chats were started before the
  // page's first save, attach them to it instead: they are already on screen.
  useEffect(() => {
    if (!entityId) return;
    let cancelled = false;
    (async () => {
      if (sessionIds.current.length) {
        const ids = sessionIds.current;
        sessionIds.current = [];
        await attachChatsAction(ids, entityId);
        return;
      }
      const result = await listChatsAction(scope, entityId);
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
        setChats([]);
        return;
      }
      setChats(result.data);
      if (result.data[0]) open(result.data[0].id);
    })();
    return () => {
      cancelled = true;
    };
    // `open` only touches state setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId, scope]);

  const handleCreate = async () => {
    setBusy(true);
    setError(null);
    const result = await createChatAction(scope, entityId);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const { id, title, updatedAt } = result.data;
    if (!entityId) sessionIds.current.push(id);
    setChats((current) => [{ id, title, updatedAt }, ...(current ?? [])]);
    setActiveId(id);
    setInitial([]);
    setRenaming(false);
    setConfirmingDelete(false);
  };

  const handleRename = async () => {
    if (!active) return;
    setBusy(true);
    const result = await renameChatAction(active.id, renameValue);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setChats((current) => current?.map((item) => (item.id === active.id ? result.data : item)) ?? []);
    setRenaming(false);
    setError(null);
  };

  const handleDelete = async () => {
    if (!active) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setBusy(true);
    const result = await deleteChatAction(active.id);
    setBusy(false);
    setConfirmingDelete(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    sessionIds.current = sessionIds.current.filter((id) => id !== active.id);
    const remaining = (chats ?? []).filter((item) => item.id !== active.id);
    setChats(remaining);
    if (remaining[0]) open(remaining[0].id);
    else {
      setActiveId(null);
      setInitial(null);
    }
  };

  /** The open thread saved: keep the list's order and title current. */
  const handleTouched = (summary: ChatSummary) =>
    setChats((current) => {
      if (!current) return current;
      return [summary, ...current.filter((item) => item.id !== summary.id)];
    });

  return (
    <div className={chat.panel}>
      <div className={styles.header}>
        {renaming && active ? (
          <>
            <input
              className="a-input"
              autoFocus
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleRename();
                if (event.key === "Escape") setRenaming(false);
              }}
              aria-label="Chat name"
            />
            <button type="button" className="a-btn" onClick={handleRename} disabled={busy}>
              Save
            </button>
            <button type="button" className="a-btn" onClick={() => setRenaming(false)}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <select
              className="a-input"
              value={activeId ?? ""}
              onChange={(event) => event.target.value && open(event.target.value)}
              disabled={!chats?.length}
              aria-label="Chats"
            >
              {!chats?.length && <option value="">No chats yet</option>}
              {chats?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={styles.iconButton}
              title="New chat"
              aria-label="New chat"
              onClick={handleCreate}
              disabled={busy}
            >
              +
            </button>
            <button
              type="button"
              className={styles.iconButton}
              title="Rename chat"
              aria-label="Rename chat"
              disabled={!active || busy}
              onClick={() => {
                setRenameValue(active?.title ?? "");
                setRenaming(true);
              }}
            >
              ✎
            </button>
            <button
              type="button"
              className={styles.iconButton}
              title={confirmingDelete ? "Click again to delete this chat" : "Delete chat"}
              aria-label="Delete chat"
              data-danger={confirmingDelete || undefined}
              disabled={!active || busy}
              onClick={handleDelete}
              onBlur={() => setConfirmingDelete(false)}
            >
              {confirmingDelete ? "Sure?" : "✕"}
            </button>
          </>
        )}
      </div>

      {error && <p className="a-error">{error}</p>}

      {chats === null ? (
        <p className={chat.intro} style={{ padding: 10 }}>
          Loading chats…
        </p>
      ) : !active ? (
        <div className={styles.empty}>
          <p className={chat.intro}>
            {intro} Each page keeps its own chats, so you can come back to them.
          </p>
          <button type="button" className="a-btn a-btn-primary" onClick={handleCreate} disabled={busy}>
            New chat
          </button>
        </div>
      ) : initial === null ? (
        <p className={chat.intro} style={{ padding: 10 }}>
          Opening…
        </p>
      ) : (
        <ChatThread
          key={active.id}
          chatId={active.id}
          title={active.title}
          initialMessages={initial}
          api={api}
          context={context}
          tools={tools}
          placeholder={placeholder}
          intro={intro}
          keywords={keywords}
          onTouched={handleTouched}
        />
      )}
    </div>
  );
}

function ChatThread({
  chatId,
  title,
  initialMessages,
  api,
  context,
  tools,
  placeholder,
  intro,
  keywords,
  onTouched,
}: {
  chatId: string;
  title: string;
  initialMessages: UIMessage[];
  api: string;
  context: () => Record<string, unknown>;
  tools: Record<string, ChatTool>;
  placeholder: string;
  intro: string;
  keywords: boolean;
  onTouched: (summary: ChatSummary) => void;
}) {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<KeywordFile[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [undone, setUndone] = useState<Set<string>>(new Set());
  const fileInput = useRef<HTMLInputElement>(null);
  const savedJson = useRef(JSON.stringify(initialMessages));
  const titled = useRef(title !== DEFAULT_TITLE);
  const undoFns = useRef(new Map<string, () => void>());

  // Read the page's state fresh on every request, not when the thread opened.
  const contextRef = useRef(context);
  contextRef.current = context;
  const toolsRef = useRef(tools);
  toolsRef.current = tools;

  const transport = useMemo(
    () => new DefaultChatTransport({ api, body: () => contextRef.current() }),
    [api],
  );

  const { messages, sendMessage, status, error, addToolOutput } = useChat({
    id: chatId,
    messages: initialMessages,
    transport,
  });

  const busy = status === "submitted" || status === "streaming";

  // Proposals already waiting when the chat was opened are never auto-applied:
  // they stay as buttons, so reopening an old chat cannot rewrite the page.
  const handled = useRef(
    new Set(
      initialMessages.flatMap((message) =>
        message.parts.filter(isToolUIPart).map((part) => part.toolCallId),
      ),
    ),
  );

  // Auto tools: write the proposal into the editor draft as soon as it is complete.
  useEffect(() => {
    for (const message of messages) {
      for (const part of message.parts) {
        if (!isToolUIPart(part) || part.state !== "input-available") continue;
        const name = getToolName(part);
        const tool = toolsRef.current[name];
        if (!tool || tool.mode !== "auto" || handled.current.has(part.toolCallId)) continue;
        handled.current.add(part.toolCallId);
        const id = part.toolCallId;
        Promise.resolve()
          .then(() => tool.apply(part.input))
          .then((outcome) => {
            const message = typeof outcome === "string" ? outcome : outcome.message;
            if (typeof outcome !== "string" && outcome.undo) undoFns.current.set(id, outcome.undo);
            addToolOutput({ tool: name, toolCallId: id, output: message });
          })
          .catch((err: unknown) =>
            addToolOutput({
              tool: name,
              toolCallId: id,
              output: `Could not apply: ${err instanceof Error ? err.message : "unknown error"}`,
            }),
          );
      }
    }
  }, [messages, addToolOutput]);

  // Persist once a turn has settled (not on every streamed token).
  useEffect(() => {
    if (status !== "ready" || messages.length === 0) return;
    const json = JSON.stringify(messages);
    if (json === savedJson.current) return;
    savedJson.current = json;
    (async () => {
      const result = await saveChatMessagesAction(chatId, messages);
      if (!result.ok) {
        setSaveError(result.error);
        return;
      }
      setSaveError(null);
      onTouched(result.data);
    })();
  }, [messages, status, chatId, onTouched]);

  const addFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    setFileError(null);
    const added: KeywordFile[] = [];
    for (const file of Array.from(list)) {
      try {
        const summary = summariseKeywordCsv(file.name, await file.text());
        if (summary.shownRows === 0) setFileError(`${file.name}: no rows found.`);
        else added.push(summary);
      } catch {
        setFileError(`${file.name}: could not be read.`);
      }
    }
    setFiles((current) => [...current, ...added.filter((a) => !current.some((c) => c.name === a.name))]);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const typed = input.trim();
    if ((!typed && files.length === 0) || busy) return;
    const body = typed || "Use these keywords to plan and write the page.";
    sendMessage({ text: files.length ? `${body}\n\n${wrapKeywordFiles(files)}` : body });
    setInput("");
    setFiles([]);
    // Name an untitled chat after its first message.
    if (!titled.current) {
      titled.current = true;
      const name = body.replace(/\s+/g, " ").slice(0, 48);
      renameChatAction(chatId, name).then((result) => result.ok && onTouched(result.data));
    }
  };

  const settle = (name: string, toolCallId: string, output: string) =>
    addToolOutput({ tool: name, toolCallId, output });

  return (
    <>
      <div className={chat.log}>
        {messages.length === 0 && <p className={chat.intro}>{intro}</p>}

        {messages.map((message) => (
          <div key={message.id} className={chat.message} data-role={message.role}>
            {message.parts.map((part, index) => {
              if (part.type === "text") {
                if (message.role !== "user") {
                  return (
                    <p key={index} className={chat.text}>
                      {part.text}
                    </p>
                  );
                }
                const { text, files: attached } = splitKeywordBlocks(part.text);
                return (
                  <div key={index} className={styles.userText}>
                    {attached.map((file) => (
                      <span key={file.name} className={styles.chip} title="Keyword file shared">
                        📎 {file.name} · {file.shown}/{file.total} rows
                      </span>
                    ))}
                    {text && <p className={chat.text}>{text}</p>}
                  </div>
                );
              }
              if (!isToolUIPart(part)) return null;

              const name = getToolName(part);
              const tool = tools[name];
              if (!tool) return null;

              if (part.state === "input-streaming") {
                return (
                  <p key={index} className={chat.pending}>
                    Drafting…
                  </p>
                );
              }

              const note = tool.note?.(part.input);
              const outcome = part.state === "output-available" ? String(part.output) : null;
              const canUndo = undoFns.current.has(part.toolCallId) && !undone.has(part.toolCallId);
              return (
                <div key={index} className={chat.card}>
                  <div className={chat.cardTitle}>{tool.title}</div>
                  {note && <p className={chat.cardNote}>{note}</p>}
                  <ul className={chat.fieldList}>
                    {tool.summarize(part.input).map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                  {outcome ? (
                    <div className={styles.outcome}>
                      <p className={chat.settled}>{outcome}</p>
                      {canUndo && (
                        <button
                          type="button"
                          className="a-btn"
                          onClick={() => {
                            undoFns.current.get(part.toolCallId)?.();
                            setUndone((current) => new Set(current).add(part.toolCallId));
                          }}
                        >
                          Undo
                        </button>
                      )}
                      {undone.has(part.toolCallId) && <p className={chat.settled}>Undone.</p>}
                    </div>
                  ) : tool.mode === "auto" ? (
                    <p className={chat.pending}>Adding to the page…</p>
                  ) : (
                    <div className={chat.cardActions}>
                      <button
                        type="button"
                        className="a-btn a-btn-primary"
                        disabled={confirming === part.toolCallId}
                        onClick={async () => {
                          setConfirming(part.toolCallId);
                          try {
                            const result = await tool.apply(part.input);
                            settle(name, part.toolCallId, typeof result === "string" ? result : result.message);
                          } catch (err) {
                            settle(
                              name,
                              part.toolCallId,
                              `Could not apply: ${err instanceof Error ? err.message : "unknown error"}`,
                            );
                          } finally {
                            setConfirming(null);
                          }
                        }}
                      >
                        {confirming === part.toolCallId
                          ? "Working…"
                          : (tool.confirmLabel?.(part.input) ?? "Apply")}
                      </button>
                      <button
                        type="button"
                        className="a-btn"
                        onClick={() => settle(name, part.toolCallId, "Dismissed.")}
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {busy && <p className={chat.pending}>Thinking…</p>}
        {error && <p className="a-error">{error.message}</p>}
        {saveError && <p className="a-error">{saveError} This chat is not saved yet.</p>}
      </div>

      <form className={`${chat.composer} ${styles.composer}`} onSubmit={submit}>
        {keywords && (
          <div className={styles.attachRow}>
            <button
              type="button"
              className="a-btn"
              onClick={() => fileInput.current?.click()}
              title="Share one or more keyword CSV files with the assistant"
            >
              📎 Keyword CSV
            </button>
            <input
              ref={fileInput}
              type="file"
              accept=".csv,.tsv,text/csv,text/plain"
              multiple
              hidden
              onChange={(event) => {
                addFiles(event.target.files);
                event.target.value = "";
              }}
            />
            {files.map((file) => (
              <span key={file.name} className={styles.chip}>
                {file.name} · {file.shownRows}/{file.totalRows}
                <button
                  type="button"
                  className={styles.chipRemove}
                  aria-label={`Remove ${file.name}`}
                  onClick={() => setFiles((current) => current.filter((f) => f.name !== file.name))}
                >
                  ×
                </button>
              </span>
            ))}
            {fileError && <span className="a-error">{fileError}</span>}
          </div>
        )}
        <div className={styles.composerRow}>
          <textarea
            className="a-input"
            rows={2}
            placeholder={placeholder}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) submit(event);
            }}
          />
          <button
            type="submit"
            className="a-btn a-btn-primary"
            disabled={(!input.trim() && files.length === 0) || busy}
          >
            Send
          </button>
        </div>
      </form>
    </>
  );
}
