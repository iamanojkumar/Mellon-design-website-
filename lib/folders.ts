import "server-only";

/**
 * Folders that group projects inside one locale. Same server-only PostgREST
 * access as lib/projects.ts — service-role key, never reachable from a browser.
 *
 * Folders are per-locale like the projects they hold. Deleting one unfiles its
 * projects (the FK is `on delete set null`) rather than deleting them.
 */

export type Folder = {
  id: string;
  locale: string;
  name: string;
  createdAt: string;
};

type FolderRow = {
  id: string;
  locale: string;
  name: string;
  created_at: string;
};

const fromRow = (row: FolderRow): Folder => ({
  id: row.id,
  locale: row.locale,
  name: row.name,
  createdAt: row.created_at,
});

function restConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set");
  }
  return { url, key };
}

function restHeaders(key: string, extra?: Record<string, string>) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

/** Thrown when a locale already has a folder with that name. */
export class DuplicateFolderError extends Error {
  constructor(name: string) {
    super(`A folder named "${name}" already exists for this locale.`);
    this.name = "DuplicateFolderError";
  }
}

function assertNotDuplicate(status: number, text: string, name: string) {
  if (status === 409 || /duplicate key/i.test(text)) {
    throw new DuplicateFolderError(name);
  }
}

export async function listFolders(locale: string): Promise<Folder[]> {
  const { url, key } = restConfig();
  const response = await fetch(
    `${url}/rest/v1/project_folders?locale=eq.${encodeURIComponent(locale)}&order=name.asc`,
    { headers: restHeaders(key), next: { tags: ["folders", `folders:${locale}`] } },
  );
  if (!response.ok) {
    throw new Error(`Supabase folder list failed: ${response.status} ${await response.text()}`);
  }
  return (await response.json()).map(fromRow);
}

export async function createFolder(locale: string, name: string): Promise<Folder> {
  const { url, key } = restConfig();
  const response = await fetch(`${url}/rest/v1/project_folders`, {
    method: "POST",
    headers: restHeaders(key, { Prefer: "return=representation" }),
    body: JSON.stringify({ locale, name }),
    cache: "no-store",
  });
  if (!response.ok) {
    const text = await response.text();
    assertNotDuplicate(response.status, text, name);
    throw new Error(`Supabase folder insert failed: ${response.status} ${text}`);
  }
  return fromRow((await response.json())[0]);
}

export async function renameFolder(id: string, name: string): Promise<Folder> {
  const { url, key } = restConfig();
  const response = await fetch(
    `${url}/rest/v1/project_folders?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: restHeaders(key, { Prefer: "return=representation" }),
      body: JSON.stringify({ name }),
      cache: "no-store",
    },
  );
  if (!response.ok) {
    const text = await response.text();
    assertNotDuplicate(response.status, text, name);
    throw new Error(`Supabase folder update failed: ${response.status} ${text}`);
  }
  return fromRow((await response.json())[0]);
}

export async function deleteFolder(id: string): Promise<void> {
  const { url, key } = restConfig();
  const response = await fetch(
    `${url}/rest/v1/project_folders?id=eq.${encodeURIComponent(id)}`,
    { method: "DELETE", headers: restHeaders(key), cache: "no-store" },
  );
  if (!response.ok) {
    throw new Error(`Supabase folder delete failed: ${response.status} ${await response.text()}`);
  }
}
