import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Code2, Users, Calendar, Rocket, Zap, Handshake, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProjectsStore, useEventsStore, useMembersStore, usePartnersStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const [projects] = useProjectsStore();
  const [events] = useEventsStore();
  const [members] = useMembersStore();
  const [partners] = usePartnersStore();
  const featured = projects.slice(0, 3);
  const upcoming = events.filter((e) => e.status === "upcoming").slice(0, 3);
  const positionHolders = [...members].sort((a, b) => a.order - b.order).slice(0, 6);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px] animate-pulse-glow" />
        </div>
        <div className="container relative mx-auto px-3 sm:px-4 md:px-6 py-20 sm:py-28 md:py-40 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/50 glass px-4 py-1.5 text-xs font-medium mb-8 text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Welcome to the creative collective
          </div>
          <h1 className="mx-auto max-w-5xl font-display text-4xl sm:text-6xl md:text-8xl font-bold tracking-tight leading-[0.95]">
            Where passion
            <br />
            <span className="text-gradient">meets innovation</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
            Join a curated community of visionary creators, developers, and forward-thinking
            minds building the future at Nawa Jyoti English Boarding School.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-gradient-primary hover:shadow-glow transition-all h-12 px-7 text-base">
              <Link to="/projects">Explore Our Collective <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-7 text-base">
              <Link to="/join">Apply to join</Link>
            </Button>
          </div>

          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { icon: Users, value: `${members.length}+`, label: "Members" },
              { icon: Code2, value: `${projects.length}+`, label: "Projects" },
              { icon: Calendar, value: `${events.length}+`, label: "Events" },
              { icon: Rocket, value: `${partners.length || "—"}`, label: "Partners" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-border/50 glass p-4">
                <s.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold font-display">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="container mx-auto px-3 sm:px-4 md:px-6 py-20">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <Badge variant="secondary" className="mb-3"><Zap className="h-3 w-3 mr-1" /> Featured work</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display">Projects built by members</h2>
          </div>
          <Button asChild variant="ghost">
            <Link to="/projects">View all <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {featured.map((p) => (
            <Card key={p.id} className="group overflow-hidden border-border/50 hover:border-primary/50 hover:shadow-elegant transition-all p-0">
              <div className="aspect-[16/10] overflow-hidden bg-muted">
                <img src={p.image} alt={p.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="p-5">
                <Badge variant="outline" className="mb-2 text-xs">{p.category}</Badge>
                <h3 className="font-semibold text-lg mb-1">{p.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Position Holders */}
      <section className="container mx-auto px-3 sm:px-4 md:px-6 py-20">
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-3">Leadership</Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display">Current position holders</h2>
          <p className="text-muted-foreground mt-2">The team leading the club this term.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {positionHolders.map((m) => (
            <div key={m.id} className="text-center rounded-2xl border border-border/50 bg-surface-elevated p-5 hover:shadow-elegant hover:-translate-y-1 transition-all">
              <img src={m.avatar || "/icon-192.ico"} alt={m.name} className="mx-auto h-20 w-20 rounded-full ring-2 ring-primary/20 mb-3 bg-muted object-cover" />
              <div className="font-semibold text-sm">{m.name}</div>
              <div className="text-xs text-primary font-medium mt-0.5">{m.position}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="container mx-auto px-3 sm:px-4 md:px-6 py-20">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <Badge variant="secondary" className="mb-3"><Calendar className="h-3 w-3 mr-1" /> What's next</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display">Upcoming events</h2>
          </div>
          <Button asChild variant="ghost"><Link to="/events">All events <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {upcoming.map((e) => (
            <Card key={e.id} className="overflow-hidden border-border/50 hover:border-primary/50 hover:shadow-elegant transition-all p-0">
              <div className="aspect-[16/9] overflow-hidden bg-muted">
                <img src={e.image} alt={e.title} className="h-full w-full object-cover" />
              </div>
              <div className="p-5">
                <div className="flex gap-2 mb-2">
                  {e.tags.map((t) => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                </div>
                <h3 className="font-semibold text-lg">{e.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(e.date).toLocaleDateString(undefined, { dateStyle: "medium" })} · {e.location}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Collaborate */}
      <section className="container mx-auto px-3 sm:px-4 md:px-6 py-20">
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-3"><Handshake className="h-3 w-3 mr-1" /> Collaborate</Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display">Partners & sponsors</h2>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            The organizations helping us build. Want to support the next generation of technologists?
          </p>
        </div>
        {partners.length === 0 ? (
          <Card className="p-10 text-center border-dashed border-border/50">
            <Handshake className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">We're actively looking for our first partners.</p>
            <Button asChild className="mt-4 bg-gradient-primary">
              <Link to="/contact">Become a partner</Link>
            </Button>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {partners.map((p) => (
                <a
                  key={p.id}
                  href={p.url || "#"}
                  target={p.url ? "_blank" : undefined}
                  rel="noreferrer"
                  className="group rounded-2xl border border-border/50 bg-surface-elevated p-5 hover:border-primary/50 hover:shadow-elegant transition-all"
                >
                  <div className="aspect-video flex items-center justify-center bg-white rounded-lg overflow-hidden mb-3 p-3">
                    <img src={p.logo} alt={p.name} className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="flex items-center gap-1 text-sm font-semibold">
                    {p.name} <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {p.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}
                </a>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Button asChild variant="outline">
                <Link to="/contact">Become a partner <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </>
        )}
      </section>

      {/* Forum snippet */}
      <section className="container mx-auto px-3 sm:px-4 md:px-6 py-20">
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-primary p-6 sm:p-10 md:p-14 text-primary-foreground">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,white/20,transparent_50%)]" />
          <div className="relative max-w-2xl">
            <Badge className="bg-white/20 text-primary-foreground border-white/30 mb-3">Salon · The Forum</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display">Real tech discussions, no algorithms.</h2>
            <p className="mt-3 text-primary-foreground/90">
              Our internal forum for deep-dive debates: language wars, system design, career questions —
              curated by members, for members.
            </p>
            <Button asChild variant="secondary" className="mt-6">
              <Link to="/auth">Join the conversation <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
}
