import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Shield, FolderKanban, Calendar, Users, Inbox, Mail, Trash2, Plus, Pencil,
  Megaphone, CalendarClock, Ticket, Handshake, ClipboardList, Video, KeyRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/components/auth-provider";
import {
  useProjectsStore, useEventsStore, useMembersStore,
  useMeetingsStore, useBroadcastTasksStore, usePartnersStore,
  useSubmissions, pushNotification, uid, DEFAULT_ACCESS_MINUTES,
  type Meeting, type BroadcastTask, type Partner, type CustomField,
  type Project, type Event, type TeamMember,
} from "@/lib/store";
import { MemberAccountsPanel } from "@/components/member-accounts-panel";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Panel — ICT Club" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

const CATS = ["Web", "AI/ML", "Mobile", "CyberSec", "IoT"] as const;

function AdminPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [projects, setProjects] = useProjectsStore();
  const [events, setEvents] = useEventsStore();
  const [members, setMembers] = useMembersStore();
  const [meetings, setMeetings] = useMeetingsStore();
  const [bTasks, setBTasks] = useBroadcastTasksStore();
  const [partners, setPartners] = usePartnersStore();
  const inbox = useSubmissions("contact");
  const regs = useSubmissions("event_registration");
  const apps = useSubmissions("membership_application");
  const subs = useSubmissions("subscriber");

  useEffect(() => {
    if (!loading) {
      if (!user) nav({ to: "/auth", search: { redirect: "/admin" } });
      else if (user.role !== "admin") nav({ to: "/" });
    }
  }, [loading, user, nav]);

  if (user?.role !== "admin") return null;

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 py-10 md:py-16 max-w-6xl">
      <div className="mb-10 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary shadow-elegant">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <Badge variant="secondary" className="mb-1">Superuser</Badge>
          <h1 className="text-2xl sm:text-3xl font-bold font-display">Admin Panel</h1>
        </div>
      </div>

      <Tabs defaultValue="projects">
        <TabsList className="flex h-auto w-full flex-nowrap justify-start gap-1 overflow-x-auto sm:flex-wrap [&>button]:shrink-0">
          <TabsTrigger value="projects"><FolderKanban className="h-4 w-4 mr-1.5" />Projects</TabsTrigger>
          <TabsTrigger value="events"><Calendar className="h-4 w-4 mr-1.5" />Events</TabsTrigger>
          <TabsTrigger value="team"><Users className="h-4 w-4 mr-1.5" />Team</TabsTrigger>
          <TabsTrigger value="partners"><Handshake className="h-4 w-4 mr-1.5" />Collaborate</TabsTrigger>
          <TabsTrigger value="accounts"><KeyRound className="h-4 w-4 mr-1.5" />Member logins</TabsTrigger>
          <TabsTrigger value="meetings"><CalendarClock className="h-4 w-4 mr-1.5" />Meetings</TabsTrigger>
          <TabsTrigger value="tasks"><Megaphone className="h-4 w-4 mr-1.5" />Tasks</TabsTrigger>
          <TabsTrigger value="registrations"><Ticket className="h-4 w-4 mr-1.5" />RSVPs {regs.rows.length > 0 && <Badge className="ml-1.5 h-4 min-w-4 px-1 text-[10px]">{regs.rows.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="applications"><ClipboardList className="h-4 w-4 mr-1.5" />Applications {apps.rows.length > 0 && <Badge className="ml-1.5 h-4 min-w-4 px-1 text-[10px]">{apps.rows.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="subscribers"><Mail className="h-4 w-4 mr-1.5" />Subscribers {subs.rows.length > 0 && <Badge className="ml-1.5 h-4 min-w-4 px-1 text-[10px]">{subs.rows.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="inbox"><Inbox className="h-4 w-4 mr-1.5" />Inbox {inbox.rows.length > 0 && <Badge className="ml-1.5 h-4 min-w-4 px-1 text-[10px]">{inbox.rows.length}</Badge>}</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-6">
          <Card className="p-4 sm:p-6 border-border/50">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="font-semibold">Manage projects ({projects.length})</h2>
              <ProjectDialog
                onSave={(p) => {
                  setProjects((prev) => [p, ...prev]);
                  void pushNotification({ kind: "project", title: "New project", body: p.title, link: "/projects" });
                  toast.success("Project added");
                }}
                trigger={<Button size="sm" className="bg-gradient-primary"><Plus className="h-4 w-4 mr-1" />New project</Button>}
              />
            </div>
            <div className="divide-y divide-border">
              {projects.map((p) => (
                <div key={p.id} className="flex items-center gap-4 py-3">
                  <img src={p.image} className="h-12 w-16 rounded object-cover" alt="" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{p.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{p.category} · {p.team.join(", ")}</div>
                  </div>
                  <ProjectDialog
                    project={p}
                    onSave={(next) => { setProjects((prev) => prev.map((x) => x.id === next.id ? next : x)); toast.success("Project updated"); }}
                    trigger={<Button size="sm" variant="outline"><Pencil className="h-3.5 w-3.5 mr-1" />Edit</Button>}
                  />
                  <Button size="sm" variant="ghost" className="text-destructive"
                    onClick={() => { if (confirm(`Delete "${p.title}"?`)) { setProjects((prev) => prev.filter((x) => x.id !== p.id)); toast.success("Project deleted"); } }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <Card className="p-4 sm:p-6 border-border/50">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="font-semibold">Manage events ({events.length})</h2>
              <EventDialog
                onSave={(e) => {
                  setEvents((prev) => [e, ...prev]);
                  void pushNotification({ kind: "event", title: "New event", body: e.title, link: "/events" });
                  toast.success("Event added");
                }}
                trigger={<Button size="sm" className="bg-gradient-primary"><Plus className="h-4 w-4 mr-1" />New event</Button>}
              />
            </div>
            <div className="divide-y divide-border">
              {events.map((e) => (
                <div key={e.id} className="flex items-center gap-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{e.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(e.date).toLocaleDateString()} · {regs.rows.filter((r) => r.event_id === e.id).length} form registrations
                      {(e.customFields?.length ?? 0) > 0 && ` · ${e.customFields!.length} custom field(s)`}
                    </div>
                  </div>
                  <Badge variant={e.status === "upcoming" ? "default" : "outline"}>{e.status}</Badge>
                  <EventDialog
                    event={e}
                    onSave={(next) => { setEvents((prev) => prev.map((x) => x.id === next.id ? next : x)); toast.success("Event updated"); }}
                    trigger={<Button size="sm" variant="outline"><Pencil className="h-3.5 w-3.5 mr-1" />Edit</Button>}
                  />
                  <Button size="sm" variant="ghost" className="text-destructive"
                    onClick={() => { if (confirm(`Delete "${e.title}"?`)) { setEvents((prev) => prev.filter((x) => x.id !== e.id)); toast.success("Event deleted"); } }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <Card className="p-4 sm:p-6 border-border/50">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="font-semibold">Team members ({members.length})</h2>
              <MemberDialog
                onSave={(m) => { setMembers((prev) => [...prev, m]); toast.success("Team member added"); }}
                trigger={<Button size="sm" className="bg-gradient-primary"><Plus className="h-4 w-4 mr-1" />Add team member</Button>}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground uppercase border-b border-border">
                  <tr><th className="text-left py-2">Name</th><th className="text-left">Member ID</th><th className="text-left">Position</th><th className="text-left">Skills</th><th></th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {members.map((m) => (
                    <tr key={m.id}>
                      <td className="py-3 flex items-center gap-2"><img src={m.avatar} className="h-7 w-7 rounded-full" alt="" />{m.name}</td>
                      <td className="font-mono text-xs">{m.memberId}</td>
                      <td>{m.position}</td>
                      <td className="text-xs text-muted-foreground">{m.skills.slice(0, 2).join(", ")}</td>
                      <td className="text-right">
                        <MemberDialog member={m}
                          onSave={(next) => { setMembers((prev) => prev.map((x) => x.id === next.id ? next : x)); toast.success("Team member updated"); }}
                          trigger={<Button size="sm" variant="ghost"><Pencil className="h-3.5 w-3.5" /></Button>}
                        />
                        <Button size="sm" variant="ghost" className="text-destructive"
                          onClick={() => { if (confirm(`Remove ${m.name}?`)) { setMembers((prev) => prev.filter((x) => x.id !== m.id)); toast.success("Removed"); } }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="partners" className="mt-6">
          <Card className="p-4 sm:p-6 border-border/50">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-semibold">Collaborate partners ({partners.length})</h2>
                <p className="text-xs text-muted-foreground">Shown in the Collaborate section on the home page.</p>
              </div>
              <PartnerDialog
                onSave={(p) => {
                  setPartners((prev) => [p, ...prev]);
                  void pushNotification({ kind: "partner", title: "New partner", body: p.name, link: "/" });
                  toast.success("Partner added");
                }}
                trigger={<Button size="sm" className="bg-gradient-primary"><Plus className="h-4 w-4 mr-1" />New partner</Button>}
              />
            </div>
            {partners.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No partners yet.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {partners.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50">
                    <img src={p.logo} className="h-12 w-12 rounded object-contain bg-white p-1" alt={p.name} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{p.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{p.url}</div>
                    </div>
                    <PartnerDialog partner={p}
                      onSave={(n) => { setPartners((prev) => prev.map((x) => x.id === n.id ? n : x)); toast.success("Updated"); }}
                      trigger={<Button size="sm" variant="ghost"><Pencil className="h-3.5 w-3.5" /></Button>}
                    />
                    <Button size="sm" variant="ghost" className="text-destructive"
                      onClick={() => { if (confirm(`Delete ${p.name}?`)) { setPartners((prev) => prev.filter((x) => x.id !== p.id)); toast.success("Deleted"); } }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="accounts" className="mt-6">
          <MemberAccountsPanel />
        </TabsContent>

        <TabsContent value="meetings" className="mt-6">
          <Card className="p-4 sm:p-6 border-border/50">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="font-semibold">Club meetings ({meetings.length}) — shown on member dashboards</h2>
              <MeetingDialog
                onSave={(m) => {
                  setMeetings((prev) => [m, ...prev]);
                  void pushNotification({ kind: "meeting", title: "New meeting", body: m.title });
                  toast.success("Meeting added");
                }}
                trigger={<Button size="sm" className="bg-gradient-primary"><Plus className="h-4 w-4 mr-1" />New meeting</Button>}
              />
            </div>
            {meetings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No meetings yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {meetings.map((m) => (
                  <div key={m.id} className="flex items-center gap-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{m.title}</div>
                      <div className="text-xs text-muted-foreground">{new Date(m.date).toLocaleString()} · {m.location}</div>
                      {m.agenda && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.agenda}</p>}
                    </div>
                    <MeetingDialog meeting={m}
                      onSave={(next) => { setMeetings((prev) => prev.map((x) => x.id === next.id ? next : x)); toast.success("Meeting updated"); }}
                      trigger={<Button size="sm" variant="outline"><Pencil className="h-3.5 w-3.5" /></Button>}
                    />
                    <Button size="sm" variant="ghost" className="text-destructive"
                      onClick={() => { if (confirm(`Delete "${m.title}"?`)) { setMeetings((prev) => prev.filter((x) => x.id !== m.id)); toast.success("Deleted"); } }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <Card className="p-4 sm:p-6 border-border/50">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="font-semibold">Broadcast tasks ({bTasks.length}) — pushed to all member dashboards</h2>
              <TaskDialog
                onSave={(t) => {
                  setBTasks((prev) => [t, ...prev]);
                  void pushNotification({ kind: "task", title: "New task assigned", body: t.title });
                  toast.success("Task assigned");
                }}
                trigger={<Button size="sm" className="bg-gradient-primary"><Plus className="h-4 w-4 mr-1" />New task</Button>}
              />
            </div>
            {bTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No club-wide tasks yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {bTasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{t.title}</div>
                      {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
                      <div className="text-[11px] text-muted-foreground mt-1">
                        {t.dueDate && `Due ${new Date(t.dueDate).toLocaleDateString()}`}
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">{t.priority}</Badge>
                    <TaskDialog task={t}
                      onSave={(next) => { setBTasks((prev) => prev.map((x) => x.id === next.id ? next : x)); toast.success("Task updated"); }}
                      trigger={<Button size="sm" variant="outline"><Pencil className="h-3.5 w-3.5" /></Button>}
                    />
                    <Button size="sm" variant="ghost" className="text-destructive"
                      onClick={() => { if (confirm(`Delete task "${t.title}"?`)) { setBTasks((prev) => prev.filter((x) => x.id !== t.id)); toast.success("Deleted"); } }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="registrations" className="mt-6">
          <Card className="p-4 sm:p-6 border-border/50">
            <h2 className="font-semibold mb-4">Event registrations ({regs.rows.length})</h2>
            {regs.rows.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No one has registered through the form yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground uppercase border-b border-border">
                    <tr><th className="text-left py-2">Event</th><th className="text-left">Name</th><th className="text-left">Email</th><th className="text-left">Phone</th><th className="text-left">When</th><th></th></tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {regs.rows.map((r) => {
                      const ev = events.find((e) => e.id === r.event_id);
                      const d = r.data as Record<string, unknown>;
                      return (
                        <tr key={r.id}>
                          <td className="py-3">{ev?.title ?? (d.eventTitle as string) ?? "—"}</td>
                          <td>{d.name as string}</td>
                          <td className="text-muted-foreground">{d.email as string}</td>
                          <td className="text-muted-foreground">{(d.phone as string) || "—"}</td>
                          <td className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                          <td className="text-right">
                            <Button size="sm" variant="ghost" className="text-destructive"
                              onClick={() => { if (confirm(`Remove registration from ${d.name}?`)) { void regs.remove(r.id).then(() => toast.success("Removed")); } }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="mt-6">
          <Card className="p-4 sm:p-6 border-border/50">
            <h2 className="font-semibold mb-4">Membership applications ({apps.rows.length})</h2>
            {apps.rows.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No applications yet.</p>
            ) : (
              <div className="space-y-3">
                {apps.rows.map((a) => {
                  const d = a.data as Record<string, string>;
                  return (
                    <div key={a.id} className="p-4 rounded-lg border border-border/50">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium">{d.name} <span className="text-xs text-muted-foreground font-normal">· {d.email}</span></div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {d.department} · {d.year} · {new Date(a.created_at).toLocaleDateString()}
                          </div>
                          {d.skills && <div className="text-xs text-muted-foreground mt-1"><span className="font-medium text-foreground">Skills:</span> {d.skills}</div>}
                          <p className="text-sm mt-2 whitespace-pre-wrap">{d.reason}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button size="sm" variant="outline" asChild>
                            <a href={`mailto:${d.email}`}><Mail className="h-4 w-4 mr-1.5" />Reply</a>
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Delete application from ${d.name}?`)) { void apps.remove(a.id).then(() => toast.success("Removed")); } }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="subscribers" className="mt-6">
          <Card className="p-4 sm:p-6 border-border/50">
            <h2 className="font-semibold mb-4">Event notification subscribers ({subs.rows.length})</h2>
            {subs.rows.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No one has subscribed yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {subs.rows.map((s) => (
                  <div key={s.id} className="flex items-center py-2 gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 text-sm">{(s.data as { email?: string }).email}</span>
                    <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</span>
                    <Button size="sm" variant="ghost" onClick={() => { void subs.remove(s.id).then(() => toast.success("Removed")); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="inbox" className="mt-6">
          <Card className="p-4 sm:p-6 border-border/50">
            <h2 className="font-semibold mb-4">Contact form messages</h2>
            {inbox.rows.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No messages yet.</p>
            ) : (
              <div className="space-y-3">
                {inbox.rows.map((m) => {
                  const d = m.data as { name: string; email: string; message: string };
                  return (
                    <div key={m.id} className="p-4 rounded-lg border border-border/50 bg-surface/50">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium">{d.name} <span className="text-xs text-muted-foreground font-normal">· {d.email}</span></div>
                          <div className="text-xs text-muted-foreground mt-0.5">{new Date(m.created_at).toLocaleString()}</div>
                          <p className="text-sm mt-2">{d.message}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button size="sm" variant="outline" asChild>
                            <a href={`mailto:${d.email}?subject=Re: your message to ICT Club`}><Mail className="h-4 w-4 mr-1.5" />Reply</a>
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { void inbox.remove(m.id).then(() => toast.success("Deleted")); }}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------- Project dialog ---------- */
function ProjectDialog({ project, onSave, trigger }: { project?: Project; onSave: (p: Project) => void; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Project>(
    project ?? { id: uid(), title: "", description: "", image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800", liveUrl: "#", docsUrl: "#", category: "Web", tech: [], team: [] },
  );
  const [techInput, setTechInput] = useState("");
  const [teamInput, setTeamInput] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title required"); return; }
    onSave(form);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{project ? "Edit project" : "New project"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><Label>Image URL</Label><Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Live URL</Label><Input value={form.liveUrl} onChange={(e) => setForm({ ...form, liveUrl: e.target.value })} /></div>
            <div><Label>Docs URL</Label><Input value={form.docsUrl} onChange={(e) => setForm({ ...form, docsUrl: e.target.value })} /></div>
          </div>
          <div>
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as Project["category"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <TagInput label="Tech stack" value={form.tech} setValue={(v) => setForm({ ...form, tech: v })} input={techInput} setInput={setTechInput} />
          <TagInput label="Team members" value={form.team} setValue={(v) => setForm({ ...form, team: v })} input={teamInput} setInput={setTeamInput} />
          <DialogFooter><Button type="submit" className="bg-gradient-primary">{project ? "Save changes" : "Create"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Event dialog (with custom fields for RSVP form) ---------- */
function EventDialog({ event, onSave, trigger }: { event?: Event; onSave: (e: Event) => void; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Event>(
    event ?? { id: uid(), title: "", description: "", date: new Date().toISOString(), location: "", image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800", attendees: 0, status: "upcoming", tags: [], customFields: [] },
  );
  const [tagInput, setTagInput] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title required"); return; }
    onSave(form);
    setOpen(false);
  };

  const dateForInput = form.date.slice(0, 16);
  const fields = form.customFields ?? [];

  const addField = () => setForm({ ...form, customFields: [...fields, { id: uid(), label: "", type: "text", required: false }] });
  const updateField = (id: string, patch: Partial<CustomField>) =>
    setForm({ ...form, customFields: fields.map((f) => f.id === id ? { ...f, ...patch } : f) });
  const removeField = (id: string) => setForm({ ...form, customFields: fields.filter((f) => f.id !== id) });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{event ? "Edit event" : "New event"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Date & time</Label><Input type="datetime-local" value={dateForInput} onChange={(e) => setForm({ ...form, date: new Date(e.target.value).toISOString() })} /></div>
            <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          </div>
          <div><Label>Image URL</Label><Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Event["status"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Attendees</Label><Input type="number" value={form.attendees} onChange={(e) => setForm({ ...form, attendees: Number(e.target.value) || 0 })} /></div>
          </div>
          <TagInput label="Tags" value={form.tags} setValue={(v) => setForm({ ...form, tags: v })} input={tagInput} setInput={setTagInput} />

          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between mb-2">
              <Label>RSVP form — extra questions</Label>
              <Button type="button" size="sm" variant="outline" onClick={addField}><Plus className="h-3.5 w-3.5 mr-1" />Add field</Button>
            </div>
            <div className="space-y-2">
              {fields.length === 0 && <p className="text-xs text-muted-foreground">The RSVP form asks for name, email, phone, and notes by default. Add extra fields here.</p>}
              {fields.map((f) => (
                <div key={f.id} className="rounded-lg border border-border/50 p-3 space-y-2">
                  <div className="flex gap-2">
                    <Input placeholder="Question label" value={f.label} onChange={(e) => updateField(f.id, { label: e.target.value })} />
                    <Select value={f.type} onValueChange={(v) => updateField(f.id, { type: v as CustomField["type"] })}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Short text</SelectItem>
                        <SelectItem value="textarea">Long text</SelectItem>
                        <SelectItem value="select">Choice</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => removeField(f.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                  {f.type === "select" && (
                    <Input
                      placeholder="Options, comma-separated (Yes, No, Maybe)"
                      value={(f.options ?? []).join(", ")}
                      onChange={(e) => updateField(f.id, { options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                    />
                  )}
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input type="checkbox" checked={f.required} onChange={(e) => updateField(f.id, { required: e.target.checked })} /> Required
                  </label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter><Button type="submit" className="bg-gradient-primary">{event ? "Save changes" : "Create"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Member dialog ---------- */
function MemberDialog({ member, onSave, trigger }: { member?: TeamMember; onSave: (m: TeamMember) => void; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<TeamMember>(
    member ?? {
      id: uid(),
      name: "",
      position: "Core Member",
      department: "Tech",
      order: 99,
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${Math.random()}`,
      bio: "",
      skills: [],
  memberId: `NJBs12134${Math.floor(1000 + Math.random() * 9000)}`,
  orgUrl: "",
  website: "",
  socials: {},
    },
  );
  const [skillInput, setSkillInput] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Name required"); return; }
    onSave(form);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{member ? "Edit member" : "Add member"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Member ID</Label><Input value={form.memberId} onChange={(e) => setForm({ ...form, memberId: e.target.value })} className="font-mono" /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Position</Label><Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} /></div>
            <div><Label>Department</Label><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Avatar URL</Label><Input value={form.avatar} onChange={(e) => setForm({ ...form, avatar: e.target.value })} /></div>
            <div><Label>Order</Label><Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) || 99 })} /></div>
          </div>
          <div><Label>Bio</Label><Textarea rows={2} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
          <TagInput label="Skills" value={form.skills} setValue={(v) => setForm({ ...form, skills: v })} input={skillInput} setInput={setSkillInput} />
  <div className="grid grid-cols-2 gap-2">
  <div><Label>GitHub profile</Label><Input value={form.socials.github ?? ""} onChange={(e) => setForm({ ...form, socials: { ...form.socials, github: e.target.value } })} placeholder="https://github.com/member" /></div>
  <div><Label>GitHub organization</Label><Input value={form.orgUrl ?? ""} onChange={(e) => setForm({ ...form, orgUrl: e.target.value })} placeholder="https://github.com/org" /></div>
  </div>
  <div className="grid grid-cols-2 gap-2">
  <div><Label>Website</Label><Input value={form.website ?? ""} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://example.com" /></div>
  <div><Label>LinkedIn</Label><Input value={form.socials.linkedin ?? ""} onChange={(e) => setForm({ ...form, socials: { ...form.socials, linkedin: e.target.value } })} /></div>
  </div>
          <DialogFooter><Button type="submit" className="bg-gradient-primary">{member ? "Save changes" : "Add member"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Meeting dialog ---------- */
function MeetingDialog({ meeting, onSave, trigger }: { meeting?: Meeting; onSave: (m: Meeting) => void; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Meeting>(
    meeting ?? { id: uid(), title: "", date: new Date().toISOString(), location: "", agenda: "", accessMinutes: DEFAULT_ACCESS_MINUTES },
  );
  const dateForInput = form.date.slice(0, 16);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title required"); return; }
    onSave(form);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{meeting ? "Edit meeting" : "New meeting"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Date & time</Label><Input type="datetime-local" value={dateForInput} onChange={(e) => setForm({ ...form, date: new Date(e.target.value).toISOString() })} /></div>
            <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Room 204 / Zoom" /></div>
          </div>
          <div><Label>Agenda</Label><Textarea rows={3} value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} /></div>
          <div>
            <Label>Google Meet / meeting link (unlocked after QR check-in)</Label>
            <div className="flex gap-2">
              <Input value={form.link ?? ""} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://meet.google.com/abc-defg-hij" />
              <Button type="button" variant="outline" size="sm" className="shrink-0"
                onClick={() => window.open("https://meet.google.com/new", "_blank", "noreferrer")}>
                <Video className="h-4 w-4 mr-1" />New Meet
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Click “New Meet” to create a Google Meet, then paste its link here so members can join after check-in.
            </p>
          </div>
          <div>
            <Label>Access window (minutes after QR scan)</Label>
            <Input type="number" min={5} max={1440}
              value={form.accessMinutes ?? DEFAULT_ACCESS_MINUTES}
              onChange={(e) => setForm({ ...form, accessMinutes: Number(e.target.value) || DEFAULT_ACCESS_MINUTES })} />
            <p className="text-[11px] text-muted-foreground mt-1">
              Members see a live countdown; access locks again when it ends.
            </p>
          </div>

          <DialogFooter><Button type="submit" className="bg-gradient-primary">{meeting ? "Save" : "Create"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Broadcast task dialog ---------- */
function TaskDialog({ task, onSave, trigger }: { task?: BroadcastTask; onSave: (t: BroadcastTask) => void; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<BroadcastTask>(
    task ?? { id: uid(), title: "", description: "", priority: "medium", dueDate: "", createdAt: new Date().toISOString() },
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title required"); return; }
    onSave(form);
    setOpen(false);
  };

  const dueForInput = form.dueDate ? form.dueDate.slice(0, 10) : "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{task ? "Edit task" : "Assign task to all members"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as BroadcastTask["priority"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Due date</Label><Input type="date" value={dueForInput} onChange={(e) => setForm({ ...form, dueDate: e.target.value ? new Date(e.target.value).toISOString() : "" })} /></div>
          </div>
          <DialogFooter><Button type="submit" className="bg-gradient-primary">{task ? "Save" : "Assign"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Partner dialog ---------- */
function PartnerDialog({ partner, onSave, trigger }: { partner?: Partner; onSave: (p: Partner) => void; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partner>(
    partner ?? { id: uid(), name: "", logo: "", url: "", description: "" },
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.logo.trim()) { toast.error("Name and logo URL required"); return; }
    onSave(form);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{partner ? "Edit partner" : "New partner"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div>
            <Label>Logo</Label>
            {form.logo && (
              <div className="mt-1 mb-2 flex items-center gap-2">
                <img src={form.logo} alt="preview" className="h-14 w-14 rounded object-contain bg-white p-1 border border-border" />
                <Button type="button" variant="outline" size="sm" onClick={() => setForm({ ...form, logo: "" })}>Remove</Button>
              </div>
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2MB"); return; }
                const reader = new FileReader();
                reader.onload = () => setForm((f) => ({ ...f, logo: String(reader.result) }));
                reader.readAsDataURL(file);
              }}
            />
            <Input className="mt-2" value={form.logo.startsWith("data:") ? "" : form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} placeholder="…or paste logo URL" />
          </div>
          <div><Label>Website URL</Label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…" /></div>
          <div><Label>Short description</Label><Textarea rows={2} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <DialogFooter><Button type="submit" className="bg-gradient-primary">{partner ? "Save" : "Add partner"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Tag input helper ---------- */
function TagInput({ label, value, setValue, input, setInput }: { label: string; value: string[]; setValue: (v: string[]) => void; input: string; setInput: (v: string) => void }) {
  const add = () => {
    const v = input.trim();
    if (!v) return;
    setValue([...new Set([...value, v])]);
    setInput("");
  };
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5 mb-2 mt-1.5">
        {value.map((t) => (
          <Badge key={t} variant="outline" className="gap-1 bg-primary/10 text-primary border-primary/20">
            {t}
            <button type="button" onClick={() => setValue(value.filter((x) => x !== t))}>×</button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} placeholder="Type and press Enter" />
        <Button type="button" variant="outline" onClick={add}>Add</Button>
      </div>
    </div>
  );
}
