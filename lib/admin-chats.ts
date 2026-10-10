import "server-only";

/**
 * Saved admin assistant chats (supabase/migrations/20261005000000_admin_chats.sql
 * and 20261006000000_..._chat_entities.sql). Same PostgREST-with-service-role
 * pattern as lib/projects.ts. `messages` is the AI SDK's UIMessage[], stored
 * untouched; this layer never interprets it.
 *
 * A chat belongs to one page: `scope` says which kind (blog post, project,
 * landing page) and `entity_id` which one. `entity_id` is null for a chat
 * started before the page's first save; `attachChats` links it afterwards.
 */

export type ChatScope = "blog" | "project" | "landing";

export type ChatSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

export type Chat = ChatSummary & {
  scope: ChatScope;
  entityId: string | null;
  messages: unknown[];
};

type ChatRow = {
  id: string;
  scope: ChatScope;
  entity_id: string | null;
  title: string;
  messages: unknown[] | null;
  created_at: string;
  updated_at: string;
};

function restConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set");
  }
  return { url, key };
}

async function request(path: string, init: RequestInit & { prefer?: string } = {}) {
  const { url, key } = restConfig();
  const { prefer, ...rest } = init;
  const response = await fetch(`${url}/rest/v1/admin_chats${path}`, {
    ...rest,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Supabase chats failed: ${response.status} ${await response.text()}`);
  }
  return response;
}

const toSummary = (row: ChatRow): ChatSummary => ({
  id: row.id,
  title: row.title,
  updatedAt: row.updated_at,
});

const toChat = (row: ChatRow): Chat => ({
  ...toSummary(row),
  scope: row.scope,
  entityId: row.entity_id,
  messages: row.messages ?? [],
});

const uuid = (value: string) => encodeURIComponent(value);

/** One page's chats, newest activity first. Messages are left out; load one chat to read them. */
export async function listChats(scope: ChatScope, entityId: string): Promise<ChatSummary[]> {
  const response = await request(
    `?scope=eq.${scope}&entity_id=eq.${uuid(entityId)}&select=id,title,updated_at,scope,entity_id&order=updated_at.desc`,
  );
  return ((await response.json()) as ChatRow[]).map(toSummary);
}

export async function getChat(id: string): Promise<Chat | undefined> {
  const response = await request(`?id=eq.${uuid(id)}`);
  const rows = (await response.json()) as ChatRow[];
  return rows[0] ? toChat(rows[0]) : undefined;
}

export async function createChat(
  scope: ChatScope,
  entityId: string | null,
  title = "New chat",
): Promise<Chat> {
  const response = await request("", {
    method: "POST",
    prefer: "return=representation",
    body: JSON.stringify({ scope, entity_id: entityId, title }),
  });
  return toChat(((await response.json()) as ChatRow[])[0]);
}

/** Links chats started before the page's first save to the page they belong to. */
export async function attachChats(ids: string[], entityId: string): Promise<void> {
  if (ids.length === 0) return;
  const list = ids.map(uuid).join(",");
  await request(`?id=in.(${list})&entity_id=is.null`, {
    method: "PATCH",
    body: JSON.stringify({ entity_id: entityId }),
  });
}

export async function renameChat(id: string, title: string): Promise<ChatSummary> {
  const response = await request(`?id=eq.${uuid(id)}`, {
    method: "PATCH",
    prefer: "return=representation",
    body: JSON.stringify({ title, updated_at: new Date().toISOString() }),
  });
  return toSummary(((await response.json()) as ChatRow[])[0]);
}

export async function saveChatMessages(id: string, messages: unknown[]): Promise<ChatSummary> {
  const response = await request(`?id=eq.${uuid(id)}`, {
    method: "PATCH",
    prefer: "return=representation",
    body: JSON.stringify({ messages, updated_at: new Date().toISOString() }),
  });
  return toSummary(((await response.json()) as ChatRow[])[0]);
}

export async function deleteChat(id: string): Promise<void> {
  await request(`?id=eq.${uuid(id)}`, { method: "DELETE" });
}

/** Removes every chat of a page, for when the page itself is deleted. */
export async function deleteChatsFor(scope: ChatScope, entityId: string): Promise<void> {
  await request(`?scope=eq.${scope}&entity_id=eq.${uuid(entityId)}`, { method: "DELETE" });
}
