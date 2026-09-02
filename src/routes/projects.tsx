import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ExternalLink, FileText, Users } from "lucide-react";
import { useProjectsStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — ICT Club of NJBS" },
      { name: "description", content: "Explore projects built by ICT Club of NJBS members." },
      { property: "og:title", content: "Projects — ICT Club of NJBS" },
      { property: "og:description", content: "Student-built projects across web, AI, mobile, and cybersecurity." },
    ],
  }),
  component: ProjectsPage,
});

const CATS = ["All", "Web", "AI/ML", "Mobile", "CyberSec", "IoT"] as const;

function ProjectsPage() {
  const [projects] = useProjectsStore();
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");
  const list = projects.filter((p) => cat === "All" || p.category === cat);

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 py-12 md:py-16">
      <div className="text-center mb-10">
        <Badge variant="secondary" className="mb-3">What we build</Badge>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display">Projects</h1>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          Real, shipping projects with docs and live links — built entirely by members.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {CATS.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-full border transition-all",
              cat === c
                ? "bg-gradient-primary text-primary-foreground border-transparent shadow-elegant"
                : "border-border hover:bg-surface",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <Card key={p.id} className="group overflow-hidden border-border/50 hover:border-primary/50 hover:shadow-elegant transition-all p-0 flex flex-col">
            <div className="aspect-[16/10] overflow-hidden bg-muted">
              <img src={p.image} alt={p.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" />
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline">{p.category}</Badge>
                <div className="flex gap-1 text-muted-foreground">
                  <a href={p.liveUrl} className="hover:text-primary p-1"><ExternalLink className="h-4 w-4" /></a>
                  <a href={p.docsUrl} className="hover:text-primary p-1"><FileText className="h-4 w-4" /></a>
                </div>
              </div>
              <h3 className="font-semibold text-lg">{p.title}</h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-3 flex-1">{p.description}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {p.tech.map((t) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{t}</span>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {p.team.join(", ")}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
