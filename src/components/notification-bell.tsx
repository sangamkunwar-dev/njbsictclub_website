import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useNotificationsStore, type Notification } from "@/lib/store";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

const READ_KEY = "ict-notifications-read-at";
const SEEN_KEY = "ict-notifications-seen";

function loadSeen(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]") as string[]; } catch { return []; }
}

export function NotificationBell() {
  const [notifications] = useNotificationsStore();
  const [readAt, setReadAt] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    return Number(localStorage.getItem(READ_KEY) ?? 0);
  });
  // Persisted across sessions so each notification only ever toasts once.
  const seenIds = useRef<Set<string>>(new Set(loadSeen()));

  useEffect(() => {
    let changed = false;
    for (const n of notifications) {
      if (seenIds.current.has(n.id)) continue;
      seenIds.current.add(n.id);
      changed = true;
      // Only toast genuinely fresh items (last 24h), never a backlog on load.
      if (Date.now() - new Date(n.createdAt).getTime() < 86_400_000) {
        toast(n.title, { description: n.body });
      }
    }
    if (changed) {
      try {
        localStorage.setItem(SEEN_KEY, JSON.stringify([...seenIds.current].slice(-200)));
      } catch { /* ignore */ }
    }
  }, [notifications]);


  const unread = notifications.filter((n) => new Date(n.createdAt).getTime() > readAt).length;

  const markRead = () => {
    const now = Date.now();
    setReadAt(now);
    try { localStorage.setItem(READ_KEY, String(now)); } catch { /* ignore */ }
  };

  return (
    <DropdownMenu onOpenChange={(o) => o && markRead()}>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Notifications"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-surface transition-colors"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">You're all caught up.</p>
        ) : (
          <ul className="divide-y divide-border">
            {notifications.slice(0, 20).map((n) => (
              <NotificationRow key={n.id} n={n} />
            ))}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationRow({ n }: { n: Notification }) {
  const body = (
    <div className={cn("px-3 py-2.5 hover:bg-surface/60 rounded-md")}>
      <div className="text-sm font-medium">{n.title}</div>
      {n.body && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</div>}
      <div className="text-[10px] text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</div>
    </div>
  );
  if (n.link) {
    return <li><Link to={n.link}>{body}</Link></li>;
  }
  return <li>{body}</li>;
}
