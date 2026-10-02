"use server";

import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-auth";
import { isProtectedPath } from "@/lib/url-rules";
import {
  deleteUrlRules,
  importUrlRules,
  listUrlRules,
  setUrlRuleStatus,
  type CsvEntry,
  type UrlRule,
} from "@/lib/url-rules-store";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_IMPORT_ROWS = 5000;

async function requireAuthed() {
  if (!(await isAdminAuthed())) redirect("/admin/login");
}

export async function importUrlsAction(
  entries: CsvEntry[],
): Promise<Result<{ rules: UrlRule[]; added: number; skipped: number }>> {
  await requireAuthed();
  if (entries.length === 0) return { ok: false, error: "The CSV has no URLs." };
  if (entries.length > MAX_IMPORT_ROWS) {
    return { ok: false, error: `Too many rows (max ${MAX_IMPORT_ROWS}).` };
  }
  try {
    const { added, skipped } = await importUrlRules(entries);
    return { ok: true, data: { rules: await listUrlRules(), added, skipped } };
  } catch (error) {
    console.error("[admin] import url rules failed", error);
    return { ok: false, error: "Could not save the CSV. Has the url_rules migration been run?" };
  }
}

export async function loadUrlRulesAction(): Promise<Result<UrlRule[]>> {
  await requireAuthed();
  try {
    return { ok: true, data: await listUrlRules() };
  } catch (error) {
    console.error("[admin] load url rules failed", error);
    return { ok: false, error: "Could not load the list. Has the url_rules migration been run?" };
  }
}

export type UrlRuleAction =
  | { type: "gone" }
  | { type: "redirect"; to: string }
  | { type: "ignored" }
  | { type: "pending" }
  | { type: "delete" };

export async function applyUrlRuleAction(
  ids: string[],
  action: UrlRuleAction,
): Promise<Result<UrlRule[]>> {
  await requireAuthed();
  if (ids.length === 0 || ids.some((id) => !UUID.test(id))) {
    return { ok: false, error: "Nothing valid selected." };
  }

  try {
    if (action.type === "gone" || action.type === "redirect") {
      // Refuse anything that is, or could be, a live page: 410 on /about would
      // take the real page offline.
      const blocked = (await listUrlRules()).filter(
        (rule) => ids.includes(rule.id) && rule.host && isProtectedPath(rule.path),
      );
      if (blocked.length > 0) {
        return {
          ok: false,
          error: `Not applied: ${blocked.map((rule) => rule.path).join(", ")} looks like a live page.`,
        };
      }
    }

    if (action.type === "delete") {
      await deleteUrlRules(ids);
    } else if (action.type === "redirect") {
      const target = action.to.trim();
      if (!/^\/(?!\/)/.test(target) && !/^https:\/\//.test(target)) {
        return { ok: false, error: "Redirect target must start with / or https://." };
      }
      await setUrlRuleStatus(ids, "redirect", target);
    } else {
      await setUrlRuleStatus(ids, action.type, null);
    }
    return { ok: true, data: await listUrlRules() };
  } catch (error) {
    console.error("[admin] apply url rule action failed", error);
    return { ok: false, error: "Could not save the change." };
  }
}
