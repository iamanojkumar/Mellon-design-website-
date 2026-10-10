"use server";

import { redirect } from "next/navigation";
import {
  listChats,
  getChat,
  createChat,
  attachChats,
  renameChat,
  saveChatMessages,
  deleteChat,
  deleteChatsFor,
  type Chat,
  type ChatScope,
  type ChatSummary,
} from "@/lib/admin-chats";
import { isAdminAuthed } from "@/lib/admin-auth";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function requireAuthed() {
  if (!(await isAdminAuthed())) redirect("/admin/login");
}

/** Wraps a chat operation so a Supabase failure becomes a message, not a 500. */
async function run<T>(label: string, fn: () => Promise<T>): Promise<ActionResult<T>> {
  await requireAuthed();
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    console.error(`[admin] chat ${label} failed`, error);
    return { ok: false, error: `Could not ${label}.` };
  }
}

/** The chats of one page. */
export async function listChatsAction(
  scope: ChatScope,
  entityId: string,
): Promise<ActionResult<ChatSummary[]>> {
  return run("load chats", () => listChats(scope, entityId));
}

export async function loadChatAction(id: string): Promise<ActionResult<Chat>> {
  const result = await run("open the chat", () => getChat(id));
  if (!result.ok) return result;
  return result.data ? { ok: true, data: result.data } : { ok: false, error: "Chat not found." };
}

/** `entityId` is null while the page has not been saved yet. */
export async function createChatAction(
  scope: ChatScope,
  entityId: string | null,
): Promise<ActionResult<Chat>> {
  return run("create the chat", () => createChat(scope, entityId));
}

export async function attachChatsAction(
  ids: string[],
  entityId: string,
): Promise<ActionResult<null>> {
  return run("link the chats to the page", async () => {
    await attachChats(ids, entityId);
    return null;
  });
}

export async function renameChatAction(
  id: string,
  title: string,
): Promise<ActionResult<ChatSummary>> {
  const clean = title.trim().replace(/\s+/g, " ").slice(0, 80);
  if (!clean) return { ok: false, error: "Give the chat a name." };
  return run("rename the chat", () => renameChat(id, clean));
}

export async function saveChatMessagesAction(
  id: string,
  messages: unknown[],
): Promise<ActionResult<ChatSummary>> {
  return run("save the chat", () => saveChatMessages(id, messages));
}

export async function deleteChatAction(id: string): Promise<ActionResult<null>> {
  return run("delete the chat", async () => {
    await deleteChat(id);
    return null;
  });
}

/** Called when a page is deleted, so its chats do not linger as orphans. */
export async function deleteChatsForPageAction(
  scope: ChatScope,
  entityId: string,
): Promise<ActionResult<null>> {
  return run("delete the page's chats", async () => {
    await deleteChatsFor(scope, entityId);
    return null;
  });
}
