import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, MapPin, Users, Ticket, Bell } from "lucide-react";
import {
  useEventsStore,
  useMyEventRegistrations,
  submitToInbox,
  type Event,
  type CustomField,
} from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/components/auth-provider";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events — ICT Club of NJBS" },
      { name: "description", content: "Hackathons, workshops, and meetups from the ICT Club of NJBS." },
      { property: "og:title", content: "Events — ICT Club of NJBS" },
      { property: "og:description", content: "Upcoming and past ICT Club events." },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const { user } = useAuth();
  const [events] = useEventsStore();
  const myRegistrations = useMyEventRegistrations(user?.id);
  const [email, setEmail] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const upcoming = events.filter((e) => e.status === "upcoming");
  const past = events.filter((e) => e.status === "past");

  const openEvent = upcoming.find((e) => e.id === openId) ?? null;

  const submitRegistration = async (form: { name: string; email: string; phone: string; note: string; extra: Record<string, string> }) => {
    if (!openEvent) return;
    try {
      await submitToInbox(
        "event_registration",
        {
          eventTitle: openEvent.title,
          name: form.name,
          email: form.email,
          phone: form.phone,
          note: form.note,
          extra: form.extra,
        },
        { eventId: openEvent.id, userId: user?.id },
      );
      toast.success(`Registered for ${openEvent.title}!`);
      setOpenId(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to register";
      toast.error(message);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await submitToInbox("subscriber", { email });
      toast.success("Subscribed! You'll get event notifications.");
      setEmail("");
    } catch {
      toast.error("Failed to subscribe");
    }
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 py-12 md:py-16">
      <div className="text-center mb-10">
        <Badge variant="secondary" className="mb-3">Community</Badge>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display">Events</h1>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          Hackathons, workshops, meetups, and everything the club hosts.
        </p>
      </div>

      <Card className="max-w-2xl mx-auto mb-16 p-6 border-primary/20 bg-gradient-glow">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-primary shadow-elegant">
            <Bell className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Never miss an event</h3>
            <p className="text-sm text-muted-foreground mb-3">Get email notifications for upcoming events.</p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <Input placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
              <Button type="submit" className="bg-gradient-primary">Subscribe</Button>
            </form>
          </div>
        </div>
      </Card>

      <section className="mb-16">
        <h2 className="text-2xl font-bold font-display mb-6 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" /> Upcoming Events
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((e) => {
            const registered = myRegistrations.has(e.id);
            return (
              <Card key={e.id} className="overflow-hidden border-border/50 hover:border-primary/50 hover:shadow-elegant transition-all p-0 flex flex-col">
                <div className="aspect-[16/9] overflow-hidden bg-muted relative">
                  <img src={e.image} alt={e.title} className="h-full w-full object-cover" />
                  <Badge className="absolute top-3 left-3 bg-success text-success-foreground">Upcoming</Badge>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex gap-2 mb-2 flex-wrap">
                    {e.tags.map((t) => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                  </div>
                  <h3 className="font-semibold text-lg">{e.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 flex-1">{e.description}</p>
                  <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{new Date(e.date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</div>
                    <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{e.location}</div>
                    <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{e.attendees} registered</div>
                  </div>
                  {registered ? (
                    <Button disabled variant="outline" className="mt-4">Registered ✓</Button>
                  ) : (
                    <Button onClick={() => setOpenId(e.id)} className="bg-gradient-primary mt-4">
                      <Ticket className="h-4 w-4 mr-2" />Register / RSVP
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold font-display mb-6 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-muted-foreground" /> Past Events
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {past.map((e) => (
            <Card key={e.id} className="overflow-hidden border-border/50 p-0 opacity-90 hover:opacity-100 transition-opacity">
              <div className="aspect-[16/9] overflow-hidden bg-muted grayscale hover:grayscale-0 transition-all">
                <img src={e.image} alt={e.title} className="h-full w-full object-cover" />
              </div>
              <div className="p-4">
                <h3 className="font-semibold">{e.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(e.date).toLocaleDateString(undefined, { dateStyle: "medium" })} · {e.attendees} attended
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <RegistrationDialog
        open={openEvent !== null}
        onOpenChange={(o) => !o && setOpenId(null)}
        event={openEvent}
        prefill={user ? { name: user.name, email: user.email ?? "" } : undefined}
        onSubmit={submitRegistration}
      />
    </div>
  );
}

function RegistrationDialog({
  open, onOpenChange, event, prefill, onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  event: Event | null;
  prefill?: { name: string; email: string };
  onSubmit: (form: { name: string; email: string; phone: string; note: string; extra: Record<string, string> }) => void;
}) {
  const [form, setForm] = useState({ name: prefill?.name ?? "", email: prefill?.email ?? "", phone: "", note: "" });
  const [extra, setExtra] = useState<Record<string, string>>({});
  const customFields: CustomField[] = event?.customFields ?? [];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { toast.error("Name and email are required"); return; }
    for (const f of customFields) {
      if (f.required && !(extra[f.id] ?? "").trim()) {
        toast.error(`${f.label} is required`); return;
      }
    }
    onSubmit({ ...form, extra });
    setForm({ name: prefill?.name ?? "", email: prefill?.email ?? "", phone: "", note: "" });
    setExtra({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register for {event?.title ?? ""}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div><Label>Full name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
          <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+880 …" /></div>
          <div><Label>Anything we should know?</Label><Textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Dietary needs, team name, questions…" /></div>

          {customFields.map((f) => (
            <div key={f.id}>
              <Label>{f.label}{f.required && " *"}</Label>
              {f.type === "textarea" ? (
                <Textarea rows={2} value={extra[f.id] ?? ""} onChange={(e) => setExtra({ ...extra, [f.id]: e.target.value })} />
              ) : f.type === "select" ? (
                <Select value={extra[f.id] ?? ""} onValueChange={(v) => setExtra({ ...extra, [f.id]: v })}>
                  <SelectTrigger><SelectValue placeholder="Choose…" /></SelectTrigger>
                  <SelectContent>
                    {(f.options ?? []).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={extra[f.id] ?? ""} onChange={(e) => setExtra({ ...extra, [f.id]: e.target.value })} />
              )}
            </div>
          ))}

          <DialogFooter>
            <Button type="submit" className="bg-gradient-primary w-full">Confirm registration</Button>
          </DialogFooter>
          {!prefill && (
            <p className="text-[11px] text-muted-foreground text-center">
              <Link to="/auth" className="text-primary hover:underline">Sign in</Link> to auto-fill and track your registrations.
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
