import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Github } from "lucide-react";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import {
  usernameToEmail,
  MEMBER_EMAIL_DOMAIN,
  CLUB_ADMIN_EMAIL,
  CLUB_ADMIN_MEMBER_ID,
} from "@/lib/member-accounts";
import { requestMemberPasswordReset } from "@/lib/member-accounts.functions";

import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { Logo } from "@/components/logo";
import { GoogleIcon } from "@/components/google-icon";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — ICT Club of NJBS" },
      {
        name: "description",
        content:
          "Sign in to RSVP for ICT Club events, track meetings and manage your member profile.",
      },
      { property: "og:title", content: "Sign in — ICT Club of NJBS" },
      {
        property: "og:description",
        content: "Sign in to RSVP for ICT Club events and access your member workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { redirect } = useSearch({ from: "/auth" });

  useEffect(() => {
    if (user) nav({ to: (redirect as string) || "/" });
  }, [user, redirect, nav]);

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-16 bg-hero">
      <Card className="w-full max-w-md p-5 sm:p-8 border-border/50 shadow-elegant glass">
        <div className="flex justify-center mb-6">
          <Logo showText={false} className="scale-125" />
        </div>
        <h1 className="text-2xl font-bold font-display text-center">Welcome to ICT Club</h1>
        <p className="text-sm text-muted-foreground text-center mt-1 mb-6">
          Sign in to RSVP for events and join the community.
        </p>

        <Tabs defaultValue="signin">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <SignInForm />
          </TabsContent>
          <TabsContent value="signup">
            <SignUpForm />
          </TabsContent>
        </Tabs>

        <p className="text-[11px] text-muted-foreground text-center mt-6">
          Signing up gives you a visitor account. Member accounts (with an NJBs ID and QR) are
          created by club admins.
        </p>
      </Card>
    </div>
  );
}

const signInSchema = z.object({
  identifier: z.string().trim().min(2, "Enter your email or username").max(120),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

function SignInForm() {
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null);

  const signInWithOAuth = async (provider: "google" | "github") => {
    setOauthLoading(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: import.meta.env.VITE_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth`,
      },
    });
    if (error) {
      toast.error(
        `${provider === "google" ? "Google" : "GitHub"} sign-in is unavailable. Enable this provider in Supabase first.`,
      );
      setOauthLoading(null);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = signInSchema.safeParse(form);
    if (!r.success) {
      toast.error(r.error.issues[0].message);
      return;
    }
    setLoading(true);
    // Admin-created member logins use a username; everyone else uses their email.
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(r.data.identifier),
      password: r.data.password,
    });
    setLoading(false);
    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes("invalid login credentials")) {
        toast.error(
          ["admin", CLUB_ADMIN_MEMBER_ID.toLowerCase(), CLUB_ADMIN_EMAIL].includes(
            r.data.identifier.trim().toLowerCase(),
          )
            ? `Admin login failed. Use Google or ${CLUB_ADMIN_EMAIL} with the password configured in Supabase Auth.`
            : "Member ID or password is incorrect. Use the exact Member ID given by the admin.",
        );
      } else if (message.includes("email not confirmed")) {
        toast.error("Please confirm this email address before signing in.");
      } else {
        toast.error("Sign-in is unavailable right now. Please try again.");
      }
    } else toast.success("Welcome back!");
  };

  return (
    <form onSubmit={submit} className="space-y-4 mt-4">
      <div>
        <Label>Email or member username</Label>
        <Input
          type="text"
          autoCapitalize="none"
          autoComplete="username"
          value={form.identifier}
          onChange={(e) => setForm({ ...form, identifier: e.target.value })}
          placeholder="you@example.com or your username"
          required
        />
        <p className="mt-1 text-[10px] text-muted-foreground">
          Admin login: use Google, {CLUB_ADMIN_EMAIL}, or admin ID {CLUB_ADMIN_MEMBER_ID}. Members
          use their exact Member ID.
        </p>
      </div>
      <div>
        <Label>Password</Label>
        <Input
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full bg-gradient-primary">
        {loading ? "Signing in..." : "Sign in"}
      </Button>
      <div className="text-center">
        <ForgotPasswordDialog />
      </div>
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">or continue with</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={loading || oauthLoading !== null}
          onClick={() => signInWithOAuth("google")}
        >
          {oauthLoading === "google" ? (
            "Connecting..."
          ) : (
            <>
              <GoogleIcon /> Google
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={loading || oauthLoading !== null}
          onClick={() => signInWithOAuth("github")}
        >
          {oauthLoading === "github" ? (
            "Connecting..."
          ) : (
            <>
              <Github className="mr-2 h-4 w-4" /> GitHub
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function ForgotPasswordDialog() {
  const requestReset = useServerFn(requestMemberPasswordReset);
  const [open, setOpen] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = identifier.trim().toLowerCase();
    if (value.length < 2) {
      toast.error("Enter your email, member ID, or username");
      return;
    }
    setBusy(true);
    try {
      const isRealEmail = value.includes("@") && !value.endsWith(`@${MEMBER_EMAIL_DOMAIN}`);
      if (isRealEmail) {
        const { error } = await supabase.auth.resetPasswordForEmail(value, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw new Error(error.message);
        toast.success("Reset link sent — check your inbox.");
      } else {
        const isMemberId = /^(njb|njbs|member)[-_ ]?[a-z0-9]+$/i.test(value);
        const username = isMemberId
          ? undefined
          : value.endsWith(`@${MEMBER_EMAIL_DOMAIN}`) ? value.split("@")[0] : value;
        await requestReset({ data: { username, memberId: isMemberId ? value.toUpperCase().replace(/[ ]+/g, "-") : undefined, note } });
        toast.success("Recovery request sent. The club admin will send a secure reset link to your registered email.");
      }
      setOpen(false);
      setIdentifier("");
      setNote("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message.replace(/^Error:\s*/, "") : "Could not send the request",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className="text-xs text-primary hover:underline">
          Forgot password?
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Recover your access</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Email, member ID, or username</Label>
            <Input
              autoCapitalize="none"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you@example.com or NJBS121348789"
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              Email accounts receive a secure reset link. Member IDs and usernames are sent to the club
              admin, who sends the reset link to the member&apos;s registered email.
            </p>
          </div>
          <div>
            <Label>Message for the admin (optional)</Label>
            <Textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="How can we reach you? e.g. phone or class"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={busy} className="bg-gradient-primary w-full">
              {busy ? "Sending…" : "Send recovery request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const signUpSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

function SignUpForm() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null);

  const signUpWithOAuth = async (provider: "google" | "github") => {
    setOauthLoading(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: import.meta.env.VITE_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) {
      toast.error(
        `${provider === "google" ? "Google" : "GitHub"} sign-up is unavailable. Enable this provider in Supabase first.`,
      );
      setOauthLoading(null);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = signUpSchema.safeParse(form);
    if (!r.success) {
      toast.error(r.error.issues[0].message);
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: r.data.email,
      password: r.data.password,
      options: {
        emailRedirectTo:
          import.meta.env.VITE_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth`,
        data: { full_name: r.data.name, role: "visitor" },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(
      data.session
        ? "Account created — you're signed in as a visitor."
        : "Account created! Check your email to confirm, then sign in.",
    );
  };

  return (
    <form onSubmit={submit} className="space-y-4 mt-4">
      <div>
        <Label>Full name</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>
      <div>
        <Label>Email</Label>
        <Input
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
      </div>
      <div>
        <Label>Password</Label>
        <Input
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          minLength={6}
        />
      </div>
      <Button
        type="submit"
        disabled={loading || oauthLoading !== null}
        className="w-full bg-gradient-primary"
      >
        {loading ? "Creating..." : "Create visitor account"}
      </Button>
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">or sign up with</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={loading || oauthLoading !== null}
          onClick={() => signUpWithOAuth("google")}
        >
          {oauthLoading === "google" ? (
            "Connecting..."
          ) : (
            <>
              <GoogleIcon /> Google
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={loading || oauthLoading !== null}
          onClick={() => signUpWithOAuth("github")}
        >
          {oauthLoading === "github" ? (
            "Connecting..."
          ) : (
            <>
              <Github className="mr-2 h-4 w-4" /> GitHub
            </>
          )}
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground text-center">
        Want to become a member? Apply on the Join page — admins issue member logins with an NJBs
        ID.
      </p>
    </form>
  );
}
