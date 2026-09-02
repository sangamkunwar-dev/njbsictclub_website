import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Upload, QrCode, Save, X, Download, Share2, Eye, Copy, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/auth-provider";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function encodeProfile(data: unknown) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
}

function decodeProfile(value: string): ProfileData & { name: string; email: string; role: string; memberId?: string } | null {
  try {
    const parsed = JSON.parse(decodeURIComponent(escape(atob(value)))) as Record<string, unknown>;
    if (typeof parsed.name !== "string" || typeof parsed.email !== "string" || typeof parsed.profile !== "object" || !parsed.profile) return null;
    const profile = parsed.profile as ProfileData;
    if (!Array.isArray(profile.skills) || typeof profile.bio !== "string") return null;
    return { ...profile, name: parsed.name, email: parsed.email, role: String(parsed.role ?? "member"), memberId: typeof parsed.memberId === "string" ? parsed.memberId : undefined };
  } catch { return null; }
}

interface ProfileData {
  bio: string;
  skills: string[];
  github: string;
  linkedin: string;
  twitter: string;
  website: string;
  avatar: string | null;
  qr: string | null;
}

const EMPTY: ProfileData = { bio: "", skills: [], github: "", linkedin: "", twitter: "", website: "", avatar: null, qr: null };

function ProfilePage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [profile, setProfile] = useState<ProfileData>(EMPTY);
  const [skillInput, setSkillInput] = useState("");
  const [sharedProfile, setSharedProfile] = useState<ReturnType<typeof decodeProfile>>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareChecked, setShareChecked] = useState(false);

  useEffect(() => {
    const shared = new URLSearchParams(window.location.search).get("share");
    if (shared) setSharedProfile(decodeProfile(shared));
    setShareChecked(true);
  }, []);

  useEffect(() => {
    if (shareChecked && !sharedProfile && !loading && !user) nav({ to: "/auth", search: { redirect: "/profile" } });
  }, [loading, user, nav, sharedProfile, shareChecked]);

  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`ict-profile-${user.id}`);
      if (stored) setProfile(JSON.parse(stored));
    }
  }, [user]);

  if (sharedProfile) return <SharedProfileView profile={sharedProfile} />;
  if (!user) return null;

  const save = () => {
    localStorage.setItem(`ict-profile-${user.id}`, JSON.stringify(profile));
    toast.success("Profile saved");
  };

  const createShareUrl = async () => {
    const { data: authData } = await supabase.auth.getUser();
    const ownerId = authData.user?.id;
    if (!ownerId || ownerId !== user.id) {
      toast.error("Your session expired. Please sign in again before sharing.");
      throw new Error("Authenticated session is missing");
    }
    const base = user.name || user.email?.split("@")[0] || "member";
    const baseSlug = base.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "member";
    const payload = { name: user.name, email: user.email, role: user.role, memberId: user.memberId, profile: { ...profile, qr: shownQr } };

    // Keep the friendly username URL when available. If another member already
    // uses it, add the member ID so every profile gets its own public link.
    const { data: existing, error: lookupError } = await supabase.from("profile_shares").select("slug, owner_id").eq("slug", baseSlug).maybeSingle();
    const suffix = (user.memberId || ownerId.slice(0, 8)).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8);
    const rawSlug = existing && existing.owner_id !== ownerId ? `${baseSlug}-${suffix || "profile"}` : baseSlug;
    const slug = rawSlug.slice(0, 30).replace(/-+$/g, "") || `member-${ownerId.slice(0, 8)}`;
    const record = { slug, owner_id: ownerId, payload };
    const { error } = existing?.owner_id === ownerId
      ? await supabase.from("profile_shares").update({ payload }).eq("slug", slug).eq("owner_id", ownerId)
      : await supabase.from("profile_shares").insert(record);
    if (lookupError && lookupError.code !== "PGRST116") console.warn("[v0] Share lookup warning:", lookupError.message);
    if (error) {
      console.error("[v0] Short profile link failed:", error);
      toast.error(`Short link failed: ${error.message}`);
      throw error;
    }
    const url = `${window.location.origin}/${slug}`;
    setShareUrl(url);
    return url;
  };

  const copyText = async (text: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const input = document.createElement("textarea");
        input.value = text;
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        input.remove();
      }
      toast.success("Profile URL copied. You can paste and share it anywhere.");
    } catch {
      toast.error("Copy failed. Select the URL and copy it manually.");
    }
  };

  const shareProfile = async () => {
    const url = await createShareUrl();
    try {
      if (navigator.share) {
        await navigator.share({ title: `${user.name} — ICT Club profile`, text: "View my ICT Club profile", url });
      } else {
        await copyText(url);
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) await copyText(url);
    }
  };

  const copyShareUrl = async () => copyText(shareUrl || await createShareUrl());

  const readFile = (file: File, key: "avatar" | "qr") => {
    const reader = new FileReader();
    reader.onload = (e) => setProfile((p) => ({ ...p, [key]: e.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const addSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      setProfile((p) => ({ ...p, skills: [...new Set([...p.skills, skillInput.trim()])] }));
      setSkillInput("");
    }
  };

  // Real QR generated locally from the member ID; custom uploads override it.
  const [autoQr, setAutoQr] = useState<string | null>(null);
  useEffect(() => {
    if (!user.memberId) { setAutoQr(null); return; }
    let alive = true;
    void import("qrcode").then((QR) =>
      QR.toDataURL(user.memberId as string, {
        width: 512,
        margin: 2,
        errorCorrectionLevel: "M",
        color: { dark: "#000000", light: "#ffffff" },
      }).then((url: string) => { if (alive) setAutoQr(url); }),
    );
    return () => { alive = false; };
  }, [user.memberId]);
  const shownQr = profile.qr ?? autoQr;


  return (
    <main className="min-h-screen bg-hero"><div className="container mx-auto max-w-5xl px-3 py-8 sm:px-4 md:px-6 md:py-12">
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <Badge variant="secondary" className="mb-2">Your profile</Badge>
          <h1 className="text-3xl md:text-4xl font-bold font-display">{user.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{user.email} · <span className="capitalize">{user.role}</span>{user.memberId && ` · `}{user.memberId && <span className="font-mono text-primary">{user.memberId}</span>}</p>
        </div>
        <div className="flex gap-2">
          {(user.role === "member" || user.role === "admin") && (
            <Button asChild variant="outline"><Link to="/dashboard">Dashboard</Link></Button>
          )}
          <Button variant="outline" onClick={() => setShowPreview(true)}><Eye className="h-4 w-4 mr-2" />Preview</Button>
          <Button variant="outline" onClick={shareProfile}><Share2 className="h-4 w-4 mr-2" />Share</Button>
          <Button onClick={save} className="bg-gradient-primary"><Save className="h-4 w-4 mr-2" />Save</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6 border-border/50">
          <Label className="mb-2 block">Profile photo</Label>
          <div className="flex flex-col items-center gap-3">
            <div className="h-32 w-32 rounded-full ring-2 ring-primary/20 overflow-hidden bg-muted flex items-center justify-center">
              {profile.avatar ? <img src={profile.avatar} className="h-full w-full object-cover" alt="Avatar" /> : (user.avatar ? <img src={user.avatar} className="h-full w-full object-cover" alt="" /> : <Upload className="h-6 w-6 text-muted-foreground" />)}
            </div>
            <label className="cursor-pointer text-xs text-primary hover:underline">
              Upload new
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0], "avatar")} />
            </label>
          </div>
        </Card>

        <Card className="p-6 border-border/50 md:col-span-2">
          <Label>Bio</Label>
          <Textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="Tell the club about yourself..." rows={4} className="mt-1.5" maxLength={500} />

          <Label className="mt-4 block">Tech stack</Label>
          <div className="flex flex-wrap gap-1.5 mt-1.5 mb-2">
            {profile.skills.map((s) => (
              <Badge key={s} variant="outline" className="gap-1 bg-primary/10 text-primary border-primary/20">
                {s}
                <button onClick={() => setProfile({ ...profile, skills: profile.skills.filter((x) => x !== s) })}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={addSkill} placeholder="Type a skill and press Enter (React, Python, CyberSec...)" />
        </Card>

        <Card className="p-6 border-border/50 md:col-span-2">
          <Label>Social links</Label>
          <div className="space-y-3 mt-2">
            <Input placeholder="GitHub URL" value={profile.github} onChange={(e) => setProfile({ ...profile, github: e.target.value })} />
            <Input placeholder="LinkedIn URL" value={profile.linkedin} onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })} />
            <Input placeholder="Twitter URL" value={profile.twitter} onChange={(e) => setProfile({ ...profile, twitter: e.target.value })} />
            <Input type="url" placeholder="Personal website URL (https://...)" value={profile.website ?? ""} onChange={(e) => setProfile({ ...profile, website: e.target.value })} />
          </div>
        </Card>

        <Card className="p-6 border-border/50">
          <Label className="mb-2 flex items-center gap-1.5"><QrCode className="h-4 w-4" /> Member QR</Label>
          <div className="aspect-square rounded-lg border border-dashed border-border bg-white flex items-center justify-center overflow-hidden">
            {shownQr ? (
              <img src={shownQr} className="h-full w-full object-contain p-2" alt={`QR for ${user.memberId ?? user.name}`} />
            ) : (
              <div className="text-center p-4">
                <QrCode className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground">Members get a QR — sign up as Member to receive one.</p>
              </div>
            )}
          </div>
          {user.memberId && (
            <p className="mt-2 text-center font-mono text-[11px] text-muted-foreground">{user.memberId}</p>
          )}
          <div className="mt-3 flex flex-col gap-1.5">
            {shownQr && (
              <a
                href={shownQr}
                download={`${user.memberId ?? "member"}-qr.png`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline text-center inline-flex items-center justify-center gap-1"
              >
                <Download className="h-3 w-3" /> Download QR
              </a>
            )}
            <label className="cursor-pointer text-xs text-muted-foreground hover:text-primary text-center">
              Upload custom QR
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0], "qr")} />
            </label>
            {profile.qr && (
              <button
                onClick={() => setProfile({ ...profile, qr: null })}
                className="text-[11px] text-destructive hover:underline"
              >
                Reset to auto QR
              </button>
            )}
          </div>
        </Card>
      </div>
      {showPreview && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-background/95 p-4 sm:p-8">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-bold">Profile preview</h2>
              <Button variant="outline" onClick={() => setShowPreview(false)}><X className="mr-2 h-4 w-4" />Close</Button>
            </div>
            <SharedProfileCard profile={{ ...profile, qr: shownQr }} name={user.name} email={user.email} role={user.role} memberId={user.memberId} />
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={shareProfile}><Share2 className="mr-2 h-4 w-4" />Share this profile</Button>
              <Button variant="outline" onClick={copyShareUrl}><Copy className="mr-2 h-4 w-4" />Copy link</Button>
            </div>
            {shareUrl && (
              <div className="mt-4 flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/40 p-3 sm:flex-row sm:items-center">
                <label htmlFor="profile-share-url" className="sr-only">Profile share URL</label>
                <input id="profile-share-url" value={shareUrl} readOnly className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-xs" onFocus={(event) => event.currentTarget.select()} />
                <Button variant="outline" onClick={copyShareUrl}><Copy className="mr-2 h-4 w-4" />Copy URL</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div></main>
  );
}

function SharedProfileView({ profile }: { profile: NonNullable<ReturnType<typeof decodeProfile>> }) {
  return <div className="container mx-auto max-w-3xl px-4 py-10"><div className="mb-6 flex items-center justify-between"><Badge variant="secondary">Shared ICT Club profile</Badge><Button asChild variant="outline"><Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Home</Link></Button></div><SharedProfileCard profile={profile} name={profile.name} email={profile.email} role={profile.role} memberId={profile.memberId} /></div>;
}

function SharedProfileCard({ profile, name, email, role, memberId }: { profile: ProfileData; name: string; email: string; role: string; memberId?: string }) {
  return <Card className="overflow-hidden border-border/50"><div className="bg-primary/10 p-6 sm:p-8"><div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">{profile.avatar ? <img src={profile.avatar} alt={`${name}'s profile photo`} className="h-28 w-28 rounded-full object-cover ring-4 ring-background" /> : <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary text-4xl font-bold text-primary-foreground">{name.charAt(0).toUpperCase()}</div>}<div><h1 className="text-3xl font-bold">{name}</h1><p className="mt-1 text-muted-foreground">{email}</p><p className="mt-2 text-sm capitalize">{role}{memberId ? ` · ${memberId}` : ""}</p></div></div></div><div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[1fr_180px]"> <div className="space-y-6"><section><h2 className="font-semibold">About</h2><p className="mt-2 whitespace-pre-wrap leading-6 text-muted-foreground">{profile.bio || "No bio added yet."}</p></section><section><h2 className="font-semibold">Skills</h2><div className="mt-2 flex flex-wrap gap-2">{profile.skills.length ? profile.skills.map((skill) => <Badge key={skill}>{skill}</Badge>) : <span className="text-sm text-muted-foreground">No skills added yet.</span>}</div></section><section><h2 className="font-semibold">Links</h2><div className="mt-2 flex flex-col gap-2 text-sm">{[profile.website, profile.github, profile.linkedin, profile.twitter].filter(Boolean).map((link) => <a key={link} href={link} target="_blank" rel="noreferrer" className="break-all text-primary hover:underline">{link}</a>)}{![profile.website, profile.github, profile.linkedin, profile.twitter].some(Boolean) && <span className="text-muted-foreground">No links added yet.</span>}</div></section></div>{profile.qr && <div className="text-center"><p className="mb-2 text-sm font-medium">Member QR</p><img src={profile.qr} alt={`Member QR for ${name}`} className="mx-auto w-full max-w-[180px] rounded-lg border bg-white p-2" />{memberId && <p className="mt-2 font-mono text-xs text-muted-foreground">{memberId}</p>}</div>}</div></Card>;
}
