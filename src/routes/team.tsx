import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Github, Linkedin, Mail, Twitter, Globe } from "lucide-react";
import { useMembersStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "Team — ICT Club of NJBS" },
      { name: "description", content: "Meet the leadership and members of the ICT Club of NJBS." },
      { property: "og:title", content: "Our Team — ICT Club of NJBS" },
      { property: "og:description", content: "Meet the students building the ICT Club community." },
    ],
  }),
  component: TeamPage,
});

const DEPTS = ["All", "Executive", "Tech", "Design", "Events", "Media"] as const;

function TeamPage() {
  const [dept, setDept] = useState<(typeof DEPTS)[number]>("All");
  const [teamMembers] = useMembersStore();
  const members = teamMembers
    .filter((m) => dept === "All" || m.department === dept)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 py-12 md:py-16">
      <div className="text-center mb-12">
        <Badge variant="secondary" className="mb-3">Our people</Badge>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display">Meet the team</h1>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          Organized by hierarchy and department — every member listed here helps run the club.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {DEPTS.map((d) => (
          <button
            key={d}
            onClick={() => setDept(d)}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-full border transition-all",
              dept === d
                ? "bg-gradient-primary text-primary-foreground border-transparent shadow-elegant"
                : "border-border hover:bg-surface",
            )}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {members.map((m) => (
          <div key={m.id} className="group rounded-2xl border border-border/50 bg-surface-elevated p-6 hover:shadow-elegant hover:-translate-y-1 transition-all">
            <div className="relative mb-4">
              <img src={m.avatar} alt={m.name} className="mx-auto h-24 w-24 rounded-full ring-2 ring-primary/20 bg-muted" />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-gradient-primary px-2 py-0.5 text-[10px] font-mono text-primary-foreground shadow-elegant">
                #{m.order}
              </div>
            </div>
            <div className="text-center">
              <h3 className="font-semibold">{m.name}</h3>
              <p className="text-xs text-primary font-medium mt-0.5">{m.position}</p>
              <p className="text-[10px] text-muted-foreground font-mono mt-1">{m.memberId}</p>
              <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{m.bio}</p>
              <div className="flex flex-wrap justify-center gap-1 mt-3">
                {m.skills.slice(0, 3).map((s) => (
                  <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{s}</span>
                ))}
              </div>
              <div className="mt-4 flex justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                {m.socials.github && m.socials.github !== "#" && <a href={m.socials.github} target="_blank" rel="noreferrer" aria-label={`${m.name} GitHub`} className="text-muted-foreground hover:text-foreground"><Github className="h-4 w-4" /></a>}
                {m.orgUrl && <a href={m.orgUrl} target="_blank" rel="noreferrer" aria-label={`${m.name} organization`} className="text-muted-foreground hover:text-foreground"><Github className="h-4 w-4" /></a>}
                {m.website && <a href={m.website} target="_blank" rel="noreferrer" aria-label={`${m.name} website`} className="text-muted-foreground hover:text-foreground"><Globe className="h-4 w-4" /></a>}
                {m.socials.linkedin && m.socials.linkedin !== "#" && <a href={m.socials.linkedin} target="_blank" rel="noreferrer" aria-label={`${m.name} LinkedIn`} className="text-muted-foreground hover:text-foreground"><Linkedin className="h-4 w-4" /></a>}
                {m.socials.twitter && m.socials.twitter !== "#" && <a href={m.socials.twitter} target="_blank" rel="noreferrer" aria-label={`${m.name} Twitter`} className="text-muted-foreground hover:text-foreground"><Twitter className="h-4 w-4" /></a>}
                {m.socials.email && <a href={`mailto:${m.socials.email}`} aria-label={`Email ${m.name}`} className="text-muted-foreground hover:text-foreground"><Mail className="h-4 w-4" /></a>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
