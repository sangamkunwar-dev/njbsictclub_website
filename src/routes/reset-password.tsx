import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/logo";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — ICT Club of NJBS" },
      { name: "description", content: "Choose a new password for your ICT Club of NJBS account." },
      { property: "og:title", content: "Set a new password — ICT Club of NJBS" },
      { property: "og:description", content: "Choose a new password for your ICT Club account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    const isRecovery = hash.includes("type=recovery");
    void supabase.auth.getSession().then(({ data }: { data: { session: unknown } }) => {
      setReady(isRecovery || Boolean(data.session));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (password !== confirm) { toast.error("Passwords don't match"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated — you're signed in.");
    void nav({ to: "/" });
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-16 bg-hero">
      <Card className="w-full max-w-md p-5 sm:p-8 border-border/50 shadow-elegant glass">
        <div className="flex justify-center mb-6"><Logo showText={false} className="scale-125" /></div>
        <h1 className="text-2xl font-bold font-display text-center">Set a new password</h1>
        {!ready ? (
          <p className="text-sm text-muted-foreground text-center mt-3">
            Open this page from the reset link in your email to continue.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-4 mt-6">
            <div>
              <Label>New password</Label>
              <Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <div>
              <Label>Confirm password</Label>
              <Input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" disabled={busy} className="w-full bg-gradient-primary">
              {busy ? "Saving…" : "Update password"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
