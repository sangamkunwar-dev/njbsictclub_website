import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { QrCode, X, CheckCircle2, Lock, Video, MapPin, CalendarClock, TimerReset, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_ACCESS_MINUTES, type Meeting } from "@/lib/store";
import type { AppUser } from "@/components/auth-provider";

interface Props {
  user: AppUser;
  meetings: Meeting[];
}

/** meetingId -> ISO timestamp of the check-in that unlocked it. */
type JoinMap = Record<string, string>;

function accessWindow(meeting: Meeting, checkedInAt: string) {
  const minutes = meeting.accessMinutes && meeting.accessMinutes > 0
    ? meeting.accessMinutes
    : DEFAULT_ACCESS_MINUTES;
  const start = new Date(checkedInAt).getTime();
  return { start, end: start + minutes * 60_000, minutes };
}

/**
 * Lenient match: the QR image may encode the raw member ID, a URL that
 * contains it, or the ID with different casing/spacing/dashes.
 */
function codeMatchesMember(scanned: string, memberId: string) {
  const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, "");
  const expected = norm(memberId);
  if (!expected) return false;
  const candidates = new Set<string>();
  const add = (value: unknown) => { if (typeof value === "string" && value.trim()) candidates.add(value); };
  add(scanned);
  try {
    const parsed = JSON.parse(scanned) as Record<string, unknown>;
    add(parsed.memberId); add(parsed.member_id); add(parsed.username); add(parsed.id); add(parsed.email);
  } catch { /* plain text QR */ }
  for (const candidate of candidates) {
    const actual = norm(candidate);
    if (actual === expected || actual.includes(expected) || expected.includes(actual)) return true;
    const emailLocal = actual.split("njbsictclub")[0];
    if (emailLocal && (emailLocal === expected || emailLocal.includes(expected))) return true;
  }
  return false;
}

function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0
    ? `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`
    : `${m}m ${String(s).padStart(2, "0")}s`;
}

export function MeetingCheckIn({ user, meetings }: Props) {
  const [meetingId, setMeetingId] = useState<string>(meetings[0]?.id ?? "");
  const [manualId, setManualId] = useState("");
  const [scanning, setScanning] = useState(false);
  const [joined, setJoined] = useState<JoinMap>({});
  const [now, setNow] = useState(() => Date.now());
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processingRef = useRef(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const containerId = "meeting-qr-reader";

  useEffect(() => {
    if (!meetings.find((m) => m.id === meetingId) && meetings[0]) setMeetingId(meetings[0].id);
  }, [meetings, meetingId]);

  // Ticks the countdown once per second.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    // Local cache for instant paint…
    const raw = localStorage.getItem(`ict-joined-${user.id}`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        // Migrate the older array-of-ids format.
        if (Array.isArray(parsed)) {
          const map: JoinMap = {};
          parsed.forEach((id: string) => { map[id] = new Date(0).toISOString(); });
          setJoined(map);
        } else setJoined(parsed as JoinMap);
      } catch { /* ignore */ }
    }
    // …then the cloud record of this member's check-ins (RLS: own rows).
    let alive = true;
    void (async () => {
      const { data } = await supabase
        .from("submissions")
        .select("event_id, created_at, data")
        .eq("kind", "event_registration")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!alive || !data) return;
      const map: JoinMap = {};
      (data as Array<{ event_id: string | null; created_at: string; data?: { submissionType?: string } | null }>).forEach((r) => {
        if (r.event_id && r.data?.submissionType === "meeting_attendance" && !map[r.event_id]) map[r.event_id] = r.created_at;
      });
      setJoined(map);
      localStorage.setItem(`ict-joined-${user.id}`, JSON.stringify(map));
    })();
    return () => { alive = false; };
  }, [user.id]);

  const persistJoined = (next: JoinMap) => {
    setJoined(next);
    localStorage.setItem(`ict-joined-${user.id}`, JSON.stringify(next));
  };

  const stop = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch { /* ignore */ }
      try { scannerRef.current.clear(); } catch { /* ignore */ }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleDecoded = async (text: string) => {
    if (processingRef.current) return;
    const meeting = meetings.find((m) => m.id === meetingId);
    if (!meeting || joined[meeting.id]) return;
    processingRef.current = true;
    if (user.memberId && !codeMatchesMember(text, user.memberId)) {
      toast.error("That QR does not match your member ID. Use the QR from your Profile page.");
      processingRef.current = false;
      return;
    }
    await stop();
    const { error } = await supabase.from("submissions").insert({
      // submissions.kind only accepts the public form kinds; distinguish
      // meeting attendance inside the JSON payload.
      kind: "event_registration",
      event_id: meeting.id,
      user_id: user.id,
      data: {
        submissionType: "meeting_attendance",
        memberId: user.memberId ?? null,
        name: user.name,
        email: user.email,
        meetingTitle: meeting.title,
        scannedCode: text,
      },
    });
    if (error) {
      console.error("[v0] Meeting check-in failed:", error);
      toast.error("Could not record attendance. Please try again or use Verify ID.");
      processingRef.current = false;
      return;
    }
    persistJoined({ ...joined, [meeting.id]: new Date().toISOString() });
    processingRef.current = false;
    setNow(Date.now());
    toast.success(`Access unlocked for "${meeting.title}"`);
  };

  const scanImage = async (file: File) => {
    if (!meetingId) { toast.error("Choose a meeting first"); return; }
    try {
      const scanner = new Html5Qrcode(`meeting-qr-file-${user.id}`);
      const decoded = await scanner.scanFile(file, false);
      await scanner.clear();
      await handleDecoded(decoded);
    } catch {
      toast.error("No QR code was found in that image. Upload a clear member QR image.");
    }
  };

  const start = async () => {
    if (!meetingId) { toast.error("Choose a meeting first"); return; }
    setScanning(true);
    // Wait for the container to mount before starting the scanner.
    await new Promise((r) => setTimeout(r, 50));
    try {
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded) => { void handleDecoded(decoded); },
        () => { /* ignore per-frame errors */ },
      );
    } catch (err) {
      console.error(err);
      toast.error("Could not open camera. Grant permission and try again.");
      setScanning(false);
    }
  };

  useEffect(() => () => { void stop(); }, []);

  const meeting = meetings.find((m) => m.id === meetingId);
  const checkedInAt = meeting ? joined[meeting.id] : undefined;
  const window_ = meeting && checkedInAt ? accessWindow(meeting, checkedInAt) : null;
  const remaining = window_ ? window_.end - now : 0;
  const unlocked = !!window_ && remaining > 0;
  const expired = !!window_ && remaining <= 0;
  const fmt = (t: number) =>
    new Date(t).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  return (
    <Card className="p-6 border-border/50">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <QrCode className="h-4 w-4" /> Join a meeting
      </h3>

      {meetings.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No meetings scheduled yet.
        </p>
      ) : (
        <div className="space-y-3">
          <Select value={meetingId} onValueChange={setMeetingId}>
            <SelectTrigger><SelectValue placeholder="Choose meeting…" /></SelectTrigger>
            <SelectContent>
              {meetings.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.title} — {new Date(m.date).toLocaleDateString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {unlocked && meeting && window_ ? (
            <div className="rounded-lg border border-primary/40 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm text-primary font-medium">
                  <CheckCircle2 className="h-4 w-4" /> Access unlocked
                </div>
                <span
                  className={`font-mono text-xs px-2 py-1 rounded-md border ${
                    remaining < 5 * 60_000
                      ? "border-destructive/50 text-destructive bg-destructive/10"
                      : "border-primary/40 text-primary bg-primary/10"
                  }`}
                >
                  {formatCountdown(remaining)} left
                </span>
              </div>
              <div className="text-sm font-semibold">{meeting.title}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5" />
                {new Date(meeting.date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />{meeting.location || "Location TBA"}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <TimerReset className="h-3.5 w-3.5" />
                Valid {fmt(window_.start)} – {fmt(window_.end)} ({window_.minutes} min window)
              </div>
              {meeting.agenda && <p className="text-xs text-muted-foreground">{meeting.agenda}</p>}
              {meeting.link ? (
                <Button asChild className="w-full bg-gradient-primary mt-1">
                  <a href={meeting.link} target="_blank" rel="noreferrer">
                    <Video className="h-4 w-4 mr-2" /> Join meeting now
                  </a>
                </Button>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  No online link for this meeting — attend in person at the location above.
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">
                Access locks automatically when the timer ends. Scan your QR again to reopen it.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5" />
                {expired
                  ? "Your access window expired — scan your member QR again to rejoin."
                  : "Scan your member QR to unlock meeting access."}
              </div>
              {!scanning ? (
                <Button onClick={start} className="w-full bg-gradient-primary">
                  <QrCode className="h-4 w-4 mr-2" /> {expired ? "Scan QR to rejoin" : "Scan QR to join"}
                </Button>
              ) : (
                <>
                  <div id={containerId} className="w-full rounded-lg overflow-hidden border border-border" />
                  <Button onClick={() => void stop()} variant="outline" className="w-full">
                    <X className="h-4 w-4 mr-2" /> Cancel
                  </Button>
                </>
              )}

              <div id={`meeting-qr-file-${user.id}`} className="hidden" />
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void scanImage(file);
                  event.currentTarget.value = "";
                }}
              />
              <Button type="button" variant="outline" className="w-full" onClick={() => imageInputRef.current?.click()}>
                <ImagePlus className="h-4 w-4 mr-2" /> Upload QR image
              </Button>

              <div className="rounded-lg border border-border/60 p-3 space-y-2">
                <p className="text-[11px] text-muted-foreground">
                  No camera? Type your Member ID (shown on your Profile) instead.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                    placeholder={user.memberId ?? "NJBs12134…"}
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    className="shrink-0"
                    onClick={() => {
                      if (!meetingId) { toast.error("Choose a meeting first"); return; }
                      if (!manualId.trim()) { toast.error("Enter your Member ID"); return; }
                      void handleDecoded(manualId.trim()).then(() => setManualId(""));
                    }}
                  >
                    Verify ID
                  </Button>
                </div>
              </div>
            </>
          )}

          <p className="text-[11px] text-muted-foreground">
            Point the camera at your Member QR (from your Profile page) to record attendance and unlock the meeting.
          </p>

        </div>
      )}
    </Card>
  );
}
