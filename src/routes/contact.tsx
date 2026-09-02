import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, MapPin, Github, Linkedin, Twitter, Send } from "lucide-react";

const SOCIAL_LINKS = [
  { label: "GitHub", href: "https://github.com/njbsictclub", Icon: Github },
  { label: "LinkedIn", href: "https://www.linkedin.com/", Icon: Linkedin },
  { label: "X", href: "https://x.com/", Icon: Twitter },
];
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { submitToInbox } from "@/lib/store";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — ICT Club of NJBS" },
      { name: "description", content: "Get in touch with the ICT Club of NJBS." },
      { property: "og:title", content: "Contact — ICT Club of NJBS" },
      { property: "og:description", content: "Reach out to the ICT Club leadership team." },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(10).max(1000),
});

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    try {
      await submitToInbox("contact", result.data);
      toast.success("Message sent! We'll get back to you soon.");
      setForm({ name: "", email: "", message: "" });
    } catch {
      toast.error("Failed to send. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 py-12 md:py-16">
      <div className="text-center mb-12">
        <Badge variant="secondary" className="mb-3">Get in touch</Badge>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display">Contact us</h1>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          Questions, sponsorship, or collaboration — we'd love to hear from you.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5 max-w-5xl mx-auto">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 border-border/50">
            <Mail className="h-5 w-5 text-primary mb-2" />
            <div className="text-xs text-muted-foreground">Email</div>
            <a href="mailto:njbsictclub@gmail.com" className="font-medium hover:text-primary">njbsictclub@gmail.com</a>
          </Card>
          <Card className="p-5 border-border/50">
            <MapPin className="h-5 w-5 text-primary mb-2" />
            <div className="text-xs text-muted-foreground">Location</div>
            <div className="font-medium">Nawa Jyoti English Boarding School, Tilottama-8, Nepal</div>
          </Card>
          <Card className="p-5 border-border/50">
            <div className="text-xs text-muted-foreground mb-2">Follow us</div>
            <div className="flex gap-2">
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:border-primary hover:text-primary transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </Card>
        </div>

        <Card className="lg:col-span-3 p-6 border-border/50">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" required maxLength={100} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required maxLength={255} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Message</label>
              <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="How can we help?" required maxLength={1000} rows={6} />
            </div>
            <Button type="submit" disabled={submitting} className="w-full bg-gradient-primary">
              <Send className="h-4 w-4 mr-2" /> {submitting ? "Sending..." : "Send message"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
