import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Globe, Github, Linkedin, Mail, QrCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/$slug")({ component: PublicProfilePage });

type SharedProfile = {
  name: string;
  email: string | null;
  role: string;
  memberId?: string;
  profile: { bio: string; skills: string[]; github: string; linkedin: string; twitter: string; website?: string; avatar: string | null; qr: string | null };
};

function PublicProfilePage() {
  const { slug } = Route.useParams();
  const [profile, setProfile] = useState<SharedProfile | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    void supabase.from("profile_shares").select("payload").eq("slug", slug).maybeSingle().then(({ data, error }) => {
      if (error || !data?.payload) setMissing(true);
      else setProfile(data.payload as SharedProfile);
    });
  }, [slug]);

  if (missing) return <main className="flex min-h-screen items-center justify-center px-4"><Card className="max-w-md p-8 text-center"><h1 className="text-2xl font-bold">Profile not found</h1><p className="mt-2 leading-6 text-muted-foreground">This profile link may have expired or does not exist.</p><Button asChild className="mt-6 rounded-full"><Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Go home</Link></Button></Card></main>;
  if (!profile) return <main className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading profile…</main>;

  const { profile: details } = profile;
  const links = [
    { label: "Website", href: details.website, icon: Globe },
    { label: "GitHub", href: details.github, icon: Github },
    { label: "LinkedIn", href: details.linkedin, icon: Linkedin },
    { label: "X / Twitter", href: details.twitter, icon: ExternalLink },
  ].filter((item): item is typeof item & { href: string } => Boolean(item.href));

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
        <header className="mb-8 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">NJ</span><span><span className="block text-sm font-semibold tracking-tight">NJBS ICT Club</span><span className="block text-xs text-muted-foreground">Member directory</span></span></Link>
          <Button asChild variant="outline" size="sm" className="rounded-full bg-card"><Link to="/"><ArrowLeft data-icon="inline-start" />Home</Link></Button>
        </header>

        <Card className="overflow-hidden border-border/70 bg-card shadow-card">
          <div className="border-b bg-muted/30 px-5 py-8 sm:px-10 sm:py-10"><div className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium text-primary">Member profile</p><p className="mt-1.5 text-sm leading-6 text-muted-foreground">NJBS ICT Club · Public directory</p></div><Badge variant="outline" className="rounded-full bg-card px-3 py-1 text-xs font-medium">Verified profile</Badge></div></div>
          <div className="px-5 pb-8 sm:px-10 sm:pb-10">
            <div className="-mt-10 flex flex-col gap-6 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end"><div className="flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-8 border-card bg-primary text-4xl font-bold text-primary-foreground shadow-card sm:size-32">{details.avatar ? <img src={details.avatar} alt={`${profile.name}'s profile photo`} className="h-full w-full object-cover object-top" onError={(event) => { event.currentTarget.style.display = "none"; event.currentTarget.parentElement?.classList.add("bg-primary"); }} /> : <span aria-label={`${profile.name}'s profile initials`}>{profile.name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span>}</div><div className="pb-1"><Badge variant="secondary" className="mb-3 rounded-full px-3 py-1 text-xs font-medium capitalize">{profile.role}</Badge><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{profile.name}</h1><p className="mt-2.5 flex items-center gap-2 text-sm leading-6 text-muted-foreground"><Mail data-icon="inline-start" />{profile.email}</p></div></div>
              {profile.memberId && <div className="rounded-2xl border bg-muted/40 px-4 py-3 sm:min-w-44 sm:text-right"><p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Member ID</p><p className="mt-1 font-mono text-sm font-semibold text-primary">{profile.memberId}</p></div>}
            </div>

            <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_240px]">
              <div className="space-y-10">
                <section><p className="text-sm font-semibold text-foreground">About</p><p className="mt-3 max-w-2xl whitespace-pre-wrap text-[15px] leading-7 text-muted-foreground">{details.bio || "This member has not added a bio yet."}</p></section>
                <section><div className="flex items-center justify-between gap-4"><p className="text-sm font-semibold text-foreground">Skills & expertise</p><span className="text-xs text-muted-foreground">{details.skills.length} skills</span></div><div className="mt-4 flex flex-wrap gap-2">{details.skills.length ? details.skills.map((skill) => <Badge key={skill} variant="outline" className="rounded-full bg-primary/5 px-3 py-1.5">{skill}</Badge>) : <p className="text-sm text-muted-foreground">No skills added yet.</p>}</div></section>
                <section><p className="text-sm font-semibold text-foreground">Connect</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{links.length ? links.map(({ label, href, icon: Icon }) => <a key={href} href={href} target="_blank" rel="noreferrer" className="group flex items-center gap-3 rounded-2xl border bg-muted/20 p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-xs font-medium text-muted-foreground">{label}</span><span className="block truncate text-sm font-medium group-hover:text-primary">{href.replace(/^https?:\/\//, "")}</span></span><ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" /></a>) : <p className="text-sm text-muted-foreground">No public links added yet.</p>}</div></section>
              </div>
              <aside className="h-fit rounded-3xl border bg-muted/20 p-5 text-center"><div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground"><QrCode className="h-4 w-4" /> Verify member</div>{details.qr ? <img src={details.qr} alt={`Member QR for ${profile.name}`} className="mx-auto mt-5 w-full max-w-[190px] rounded-2xl border bg-white p-2" /> : <div className="mx-auto mt-5 flex aspect-square max-w-[190px] items-center justify-center rounded-2xl border border-dashed text-sm text-muted-foreground">QR unavailable</div>}<p className="mt-4 text-xs leading-5 text-muted-foreground">Scan this code to verify this member profile.</p></aside>
            </div>
          </div>
        </Card>
        <p className="mt-6 text-center text-xs text-muted-foreground">Shared from NJBS ICT Club · Professional member profile</p>
      </div>
    </main>
  );
}
