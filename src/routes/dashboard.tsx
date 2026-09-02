import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Calendar, Target, TrendingUp, Plus, Trash2, ListTodo, Megaphone, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/components/auth-provider";
import { MeetingCheckIn } from "@/components/meeting-checkin";
import {
  useEventsStore, useTasksStore, useMeetingsStore, useBroadcastTasksStore,
  uid, type Task,
} from "@/lib/store";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [events] = useEventsStore();
  const [meetings] = useMeetingsStore();
  const [broadcastTasks] = useBroadcastTasksStore();
  const [tasks, setTasks] = useTasksStore(user?.id);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<Task["priority"]>("medium");

  useEffect(() => {
    if (!loading) {
      if (!user) nav({ to: "/auth", search: { redirect: "/dashboard" } });
      else if (user.role === "visitor") nav({ to: "/" });
    }
  }, [loading, user, nav]);

  const upcoming = useMemo(
    () => events.filter((e) => e.status === "upcoming").sort((a, b) => a.date.localeCompare(b.date)),
    [events],
  );
  const upcomingMeetings = useMemo(
    () => [...meetings].sort((a, b) => a.date.localeCompare(b.date)),
    [meetings],
  );

  const doneCount = tasks.filter((t) => t.done).length;
  const totalCount = tasks.length;
  const completion = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  if (!user || user.role === "visitor") return null;

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setTasks((prev) => [
      { id: uid(), title: newTitle.trim(), done: false, priority: newPriority, createdAt: new Date().toISOString() },
      ...prev,
    ]);
    setNewTitle("");
    setNewPriority("medium");
  };

  const toggle = (id: string) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const remove = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id));

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 py-10 md:py-16 max-w-6xl">
      <div className="mb-10">
        <Badge variant="secondary" className="mb-2">Member workspace</Badge>
        <h1 className="text-3xl md:text-4xl font-bold font-display">Welcome back, {user.name.split(" ")[0]}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {user.memberId && <span className="font-mono text-primary">{user.memberId}</span>}
          {user.memberId && " · "}
          Your live club activity.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6 border-border/50 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Task completion</span>
          </div>
          <div className="relative flex items-center justify-center py-4">
            <svg className="w-32 h-32 -rotate-90">
              <circle cx="64" cy="64" r="56" strokeWidth="10" fill="none" className="stroke-muted" />
              <circle
                cx="64" cy="64" r="56" strokeWidth="10" fill="none"
                className="stroke-primary transition-all duration-700"
                strokeDasharray={2 * Math.PI * 56}
                strokeDashoffset={2 * Math.PI * 56 * (1 - completion / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <div className="text-3xl font-bold font-display">{completion}%</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{doneCount}/{totalCount} done</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-border/50">
          <div className="flex items-center gap-2 mb-4"><Calendar className="h-4 w-4 text-primary" /><span className="text-sm font-medium">Upcoming events</span></div>
          <div className="text-3xl font-bold font-display">{upcoming.length}</div>
          <p className="text-xs text-muted-foreground mt-1">On the calendar</p>
          <Progress value={upcoming.length ? Math.min(100, upcoming.length * 20) : 0} className="mt-4" />
          <p className="text-[10px] text-muted-foreground mt-2">{upcomingMeetings.length} club meetings scheduled</p>
        </Card>

        <Card className="p-6 border-border/50">
          <div className="flex items-center gap-2 mb-4"><TrendingUp className="h-4 w-4 text-primary" /><span className="text-sm font-medium">Assignments from admin</span></div>
          <div className="text-3xl font-bold font-display text-gradient">{broadcastTasks.length}</div>
          <p className="text-xs text-muted-foreground mt-1">Active club-wide tasks</p>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-6">
        <MeetingCheckIn user={user} meetings={upcomingMeetings} />

        <Card className="p-6 border-border/50">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Users className="h-4 w-4" />Club meetings</h3>
          {upcomingMeetings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No meetings scheduled by admin.</p>
          ) : (
            <ul className="space-y-3">
              {upcomingMeetings.slice(0, 5).map((m) => (
                <li key={m.id} className="p-3 rounded-lg border border-border/50 bg-surface/50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{m.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(m.date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} · {m.location}
                      </div>
                      {m.agenda && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.agenda}</div>}
                    </div>
                    <Badge>meeting</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6 border-border/50">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Calendar className="h-4 w-4" />Upcoming events</h3>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No upcoming events scheduled.</p>
          ) : (
            <ul className="space-y-3">
              {upcoming.slice(0, 5).map((m) => (
                <li key={m.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-surface/50">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{m.title}</div>
                    <div className="text-xs text-muted-foreground">{new Date(m.date).toLocaleDateString(undefined, { dateStyle: "medium" })} · {m.location}</div>
                  </div>
                  <Badge>event</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6 border-border/50 md:col-span-2">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Megaphone className="h-4 w-4" />Admin-assigned tasks</h3>
          {broadcastTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No club-wide tasks right now.</p>
          ) : (
            <ul className="space-y-2">
              {broadcastTasks.map((t) => (
                <li key={t.id} className="p-3 rounded-lg border border-border/50 bg-surface/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{t.title}</div>
                      {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
                      {t.dueDate && (
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Due {new Date(t.dueDate).toLocaleDateString(undefined, { dateStyle: "medium" })}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="capitalize shrink-0">{t.priority}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6 border-border/50 md:col-span-2">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><ListTodo className="h-4 w-4" />My personal tasks</h3>
          <form onSubmit={addTask} className="flex gap-2 mb-4">
            <Input placeholder="Add a task..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            <Select value={newPriority} onValueChange={(v) => setNewPriority(v as Task["priority"])}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" size="icon" className="bg-gradient-primary shrink-0"><Plus className="h-4 w-4" /></Button>
          </form>
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No tasks yet. Add one above to start tracking.</p>
          ) : (
            <ul className="space-y-2">
              {tasks.map((t) => (
                <li key={t.id} className={`flex items-center gap-3 p-3 rounded-lg border border-border/50 ${t.done ? "opacity-60" : ""}`}>
                  <button onClick={() => toggle(t.id)} className="shrink-0">
                    <CheckCircle2 className={`h-5 w-5 ${t.done ? "text-primary fill-primary/20" : "text-muted-foreground"}`} />
                  </button>
                  <span className={`flex-1 text-sm ${t.done ? "line-through" : ""}`}>{t.title}</span>
                  <Badge variant="outline" className="text-[10px] capitalize">{t.priority}</Badge>
                  <button onClick={() => remove(t.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
