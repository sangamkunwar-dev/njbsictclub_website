import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";
import { toast } from "sonner";
import { submitToInbox } from "@/lib/store";
import { useAuth } from "@/components/auth-provider";
import { Users } from "lucide-react";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Join the Club — ICT Club of NJBS" },
      { name: "description", content: "Apply to become a member of the ICT Club of NJBS." },
      { property: "og:title", content: "Join the Club — ICT Club of NJBS" },
      { property: "og:description", content: "Fill out the membership application form to join." },
    ],
  }),
  component: JoinPage,
});

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(30).optional().default(""),
  department: z.string().trim().min(1).max(100),
  year: z.string().trim().min(1).max(20),
  skills: z.string().trim().max(500).optional().default(""),
  reason: z.string().trim().min(20, "Tell us a bit more (20+ chars)").max(1000),
});

function JoinPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: "",
    department: "",
    year: "",
    skills: "",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(form);
    if (!r.success) { toast.error(r.error.issues[0].message); return; }
    setSubmitting(true);
    try {
      await submitToInbox("membership_application", r.data, { userId: user?.id });
      toast.success("Application submitted! We'll be in touch.");
      setDone(true);
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally { setSubmitting(false); }
  };

  if (done) {
    return (
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-24 max-w-xl text-center">
        <Badge variant="secondary" className="mb-3">Received</Badge>
        <h1 className="text-3xl md:text-4xl font-bold font-display">Thanks for applying!</h1>
        <p className="mt-3 text-muted-foreground">
          Your application is now with the leadership team. You'll hear from us soon.
        </p>
        <Button asChild className="mt-6 bg-gradient-primary">
          <Link to="/">Back home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 py-12 md:py-16 max-w-2xl">
      <div className="text-center mb-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary shadow-elegant mb-4">
          <Users className="h-6 w-6 text-primary-foreground" />
        </div>
        <Badge variant="secondary" className="mb-3">Membership</Badge>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display">Join the ICT Club</h1>
        <p className="mt-3 text-muted-foreground">
          Fill this out — the leadership team reviews every application.
        </p>
      </div>

      <Card className="p-6 border-border/50">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Full name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+880 …" />
            </div>
            <div>
              <Label>Department *</Label>
              <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Science / Commerce…" required />
            </div>
            <div>
              <Label>Year / Class *</Label>
              <Select value={form.year} onValueChange={(v) => setForm({ ...form, year: v })}>
                <SelectTrigger><SelectValue placeholder="Choose…" /></SelectTrigger>
                <SelectContent>
                  {["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12", "Alumni"].map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Skills / interests</Label>
            <Input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="Python, design, robotics, video…" />
          </div>
          <div>
            <Label>Why do you want to join? *</Label>
            <Textarea rows={4} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Tell us what excites you about ICT and what you'd like to contribute." required />
          </div>
          <Button type="submit" disabled={submitting} className="w-full bg-gradient-primary">
            {submitting ? "Submitting…" : "Submit application"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
