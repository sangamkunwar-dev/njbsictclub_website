// Shared cloud-backed store. Data lives in Supabase `app_data` (jsonb rows),
// so admin edits are visible to every visitor instantly via realtime.
// Public-form submissions (contact, RSVP, membership application, subscribe)
// live in the `submissions` table so anonymous users can write them.
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  projects as seedProjects,
  events as seedEvents,
  teamMembers as seedMembers,
  codeSnippets as seedSnippets,
  type Project,
  type Event as ClubEvent,
  type TeamMember,
  type CodeSnippet,
} from "./mock-data";

// ---------- shared cache + realtime ----------
type Listener = () => void;
const cache = new Map<string, unknown>();
const listeners = new Map<string, Set<Listener>>();
const loaded = new Set<string>();
const inflight = new Map<string, Promise<unknown>>();
// Bumped on every local write so a slower in-flight fetch can't clobber it.
const version = new Map<string, number>();

const snapKey = (key: string) => `ict-snap-${key}`;

function readSnapshot<T>(key: string): T | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(snapKey(key));
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
}

function writeSnapshot(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(snapKey(key), JSON.stringify(value)); } catch { /* ignore */ }
}

function notify(key: string) {
  listeners.get(key)?.forEach((fn) => fn());
}

function subscribe(key: string, fn: Listener) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(fn);
  return () => {
    listeners.get(key)?.delete(fn);
  };
}

function commit(key: string, value: unknown) {
  cache.set(key, value);
  loaded.add(key);
  writeSnapshot(key, value);
  notify(key);
}

async function loadKey<T>(key: string, seed: T): Promise<T> {
  if (loaded.has(key)) return cache.get(key) as T;
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;
  const startVersion = version.get(key) ?? 0;
  const p = (async () => {
    const { data } = await supabase
      .from("app_data")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    // A local write happened while fetching — keep the local value.
    if ((version.get(key) ?? 0) !== startVersion) return cache.get(key) as T;
    const value = (data?.value ?? seed) as T;
    commit(key, value);
    return value;
  })();
  inflight.set(key, p);
  try {
    return await p;
  } finally {
    inflight.delete(key);
  }
}

async function writeKey<T>(key: string, value: T) {
  version.set(key, (version.get(key) ?? 0) + 1);
  commit(key, value);
  const { error } = await supabase
    .from("app_data")
    .upsert({ key, value: value as never }, { onConflict: "key" });
  if (error) {
    console.error(`[store] failed to save ${key}:`, error.message);
    throw error;
  }
}

// One global realtime channel for app_data.
let realtimeStarted = false;
function ensureRealtime() {
  if (realtimeStarted || typeof window === "undefined") return;
  realtimeStarted = true;
  supabase
    .channel("app_data-sync")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "app_data" },
      (payload: { new?: unknown; old?: unknown; eventType?: string }) => {
        const row = (payload.new ?? payload.old) as { key?: string; value?: unknown } | null;
        if (!row?.key) return;
        if (payload.eventType === "DELETE") {
          cache.delete(row.key);
          loaded.delete(row.key);
          notify(row.key);
        } else {
          commit(row.key, row.value);
        }
      },
    )
    .subscribe();
}

function useCloud<T>(key: string, seed: T) {
  ensureRealtime();
  // Prefer the last known cloud value (snapshot) over mock seeds so deleted
  // items never flash on screen while the fresh fetch is in flight.
  const initial = () => (cache.get(key) as T) ?? readSnapshot<T>(key) ?? seed;
  const [state, setState] = useState<T>(initial);
  const [ready, setReady] = useState<boolean>(() => loaded.has(key));

  useEffect(() => {
    let alive = true;
    setState(initial());
    if (!loaded.has(key)) {
      loadKey<T>(key, seed).then((v) => {
        if (!alive) return;
        setState(v);
        setReady(true);
      });
    } else {
      setState(cache.get(key) as T);
      setReady(true);
    }
    return subscribe(key, () => alive && setState((cache.get(key) as T) ?? seed));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const set = useCallback(
    (updater: T | ((prev: T) => T)) => {
      void (async () => {
        // Make sure we mutate the freshest cloud value, never a stale seed.
        const prev = loaded.has(key) ? (cache.get(key) as T) : await loadKey<T>(key, seed);
        const next =
          typeof updater === "function" ? (updater as (p: T) => T)(prev) : updater;
        await writeKey(key, next).catch(() => { /* logged in writeKey */ });
      })();


    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );
  return [state, set, ready] as const;

}

// ---------- local-only per-user store (tasks / attendance) ----------
function useLocal<T>(key: string, seed: T) {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return seed;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : seed;
    } catch {
      return seed;
    }
  });
  const set = useCallback((u: T | ((p: T) => T)) => {
    setState((prev) => {
      const next = typeof u === "function" ? (u as (p: T) => T)(prev) : u;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, [key]);
  return [state, set] as const;
}

// ---------- keys ----------
export const K_PROJECTS = "projects";
export const K_EVENTS = "events";
export const K_TEAM = "team";
export const K_MEETINGS = "meetings";
export const K_TASKS = "broadcast_tasks";
export const K_PARTNERS = "partners";
export const K_NOTIFICATIONS = "notifications";
export const K_SNIPPETS = "snippets";
export const K_INTEGRATIONS = "integrations";

// ---------- types ----------
export type { Project, TeamMember, CodeSnippet };
export type Event = ClubEvent & { customFields?: CustomField[] };

export interface Meeting {
  id: string; title: string; date: string; location: string; agenda: string; link?: string;
  /** How long access stays unlocked after a member scans their QR (minutes). */
  accessMinutes?: number;
}
export interface BroadcastTask {
  id: string; title: string; description: string;
  priority: "low" | "medium" | "high"; dueDate: string; createdAt: string;
}
export interface Partner {
  id: string; name: string; logo: string; url: string; description?: string;
}
export interface Notification {
  id: string; kind: "project" | "event" | "partner" | "meeting" | "task" | "info";
  title: string; body?: string; link?: string; createdAt: string;
}
export interface CustomField {
  id: string; label: string; type: "text" | "textarea" | "select"; required: boolean; options?: string[];
}
export interface Integrations {
  /** GA4 measurement ID, e.g. G-XXXXXXX */
  gaMeasurementId?: string;
  /** Value of the google-site-verification meta tag content attribute. */
  gscVerification?: string;
}
export const DEFAULT_ACCESS_MINUTES = 120;

// ---------- cloud hooks ----------
export const useProjectsStore = () => useCloud<Project[]>(K_PROJECTS, seedProjects);
export const useEventsStore = () => useCloud<Event[]>(K_EVENTS, seedEvents as Event[]);
export const useMembersStore = () => useCloud<TeamMember[]>(K_TEAM, seedMembers);
export const useMeetingsStore = () => useCloud<Meeting[]>(K_MEETINGS, []);
export const useBroadcastTasksStore = () => useCloud<BroadcastTask[]>(K_TASKS, []);
export const usePartnersStore = () => useCloud<Partner[]>(K_PARTNERS, []);
export const useNotificationsStore = () => useCloud<Notification[]>(K_NOTIFICATIONS, []);
export const useSnippetsStore = () => useCloud<CodeSnippet[]>(K_SNIPPETS, seedSnippets);
export const useIntegrationsStore = () => useCloud<Integrations>(K_INTEGRATIONS, {});


// Direct writers for non-hook contexts.
export async function pushNotification(n: Omit<Notification, "id" | "createdAt">) {
  const key = K_NOTIFICATIONS;
  if (!loaded.has(key)) await loadKey<Notification[]>(key, []);
  const list = ((cache.get(key) as Notification[]) ?? []).slice();
  list.unshift({ ...n, id: uid(), createdAt: new Date().toISOString() });
  await writeKey(key, list.slice(0, 50));
}

// ---------- personal (local-only) ----------
export interface Task {
  id: string; title: string; done: boolean;
  priority: "low" | "medium" | "high"; createdAt: string;
}
export const useTasksStore = (userId: string | undefined) =>
  useLocal<Task[]>(`ict-tasks-${userId ?? "anon"}`, []);

export interface AttendanceRecord {
  eventId: string; attended: boolean; date: string;
}
export const useAttendanceStore = (userId: string | undefined) =>
  useLocal<AttendanceRecord[]>(`ict-attendance-${userId ?? "anon"}`, []);

// ---------- submissions helpers ----------
export interface EventRegistration {
  id: string; eventId: string; name: string; email: string; phone: string;
  note: string; userId?: string; createdAt: string; extra?: Record<string, string>;
}
export interface Message {
  id: string; name: string; email: string; message: string; createdAt: string;
}
export interface MembershipApplication {
  id: string; name: string; email: string; phone: string; department: string;
  year: string; reason: string; skills: string; createdAt: string;
}
export interface Subscriber {
  id: string; email: string; createdAt: string;
}

/** Send a public form submission (contact, RSVP, application, subscribe). */
export async function submitToInbox(
  kind: "contact" | "event_registration" | "membership_application" | "subscriber",
  data: Record<string, unknown>,
  opts: { eventId?: string; userId?: string } = {},
) {
  const { error } = await supabase.from("submissions").insert({
    kind,
    data: data as never,
    event_id: opts.eventId ?? null,
    user_id: opts.userId ?? null,
  });
  if (error) throw error;
}


/** Admin-side hook: reads submissions of a given kind + realtime. */
export function useSubmissions(kind: "contact" | "event_registration" | "membership_application" | "subscriber" | "password_reset_request") {
  const [rows, setRows] = useState<Array<{ id: string; kind: string; data: Record<string, unknown>; event_id: string | null; user_id: string | null; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("submissions").select("*")
        .eq("kind", kind)
        .order("created_at", { ascending: false });
      if (alive) { setRows((data ?? []) as never); setLoading(false); }
    })();
    const ch = supabase
      .channel(`subs-${kind}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "submissions", filter: `kind=eq.${kind}` },
        () => {
          supabase.from("submissions").select("*")
            .eq("kind", kind)
            .order("created_at", { ascending: false })
            .then(({ data }: { data: unknown[] | null }) => alive && setRows((data ?? []) as never));
        })
      .subscribe();
    return () => { alive = false; supabase.removeChannel(ch); };
  }, [kind]);

  const remove = useCallback(async (id: string) => {
    await supabase.from("submissions").delete().eq("id", id);
  }, []);

  return { rows, loading, remove };
}

/** Signed-in user's own event registrations (works via RLS). */
export function useMyEventRegistrations(userId: string | undefined) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("submissions").select("event_id")
        .eq("kind", "event_registration")
        .eq("user_id", userId);
      if (alive) setIds(new Set(((data ?? []) as Array<{ event_id: string | null }>).map((r) => r.event_id).filter(Boolean) as string[]));
    })();
    const ch = supabase
      .channel(`my-regs-${userId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "submissions", filter: `user_id=eq.${userId}` },
        (payload: { new?: unknown }) => {
          const eid = (payload.new as { event_id?: string; kind?: string })?.event_id;
          if (eid && (payload.new as { kind?: string }).kind === "event_registration") {
            setIds((prev) => { const n = new Set(prev); n.add(eid); return n; });
          }
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId]);
  return ids;
}

// ---------- misc ----------
export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// Kept for backwards compat (auth-provider still calls it — no-op now that users
// come from the auth session, not localStorage).
export interface RegisteredUser {
  id: string; email: string; name: string; avatar?: string | null;
  role: "visitor" | "member" | "admin"; memberId?: string;
  createdAt: string; lastSeenAt: string;
}
export function upsertRegisteredUser(_u: RegisteredUser) { /* no-op */ }
export const useRegisteredUsersStore = () => [[] as RegisteredUser[], (() => {}) as (v: unknown) => void] as const;
