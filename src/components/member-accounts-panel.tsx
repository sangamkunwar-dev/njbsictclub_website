import { useCallback, useEffect, useState } from "react";
import { KeyRound, Plus, RefreshCw, Trash2, Copy, Pencil, LifeBuoy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  listMemberAccounts,
  createMemberAccount,
  deleteMemberAccount,
  setMemberPassword,
  updateMemberAccount,
} from "@/lib/member-accounts.functions";
import { MEMBER_EMAIL_DOMAIN, randomMemberId, type MemberAccount } from "@/lib/member-accounts";
import { useSubmissions } from "@/lib/store";

function errMsg(e: unknown) {
  const m = e instanceof Error ? e.message : String(e);
  return m.replace(/^Error:\s*/, "");
}

export function MemberAccountsPanel() {
  const list = listMemberAccounts;
  const create = createMemberAccount;
  const remove = deleteMemberAccount;
  const setPwd = setMemberPassword;
  const update = updateMemberAccount;

  const authToken = async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) {
      throw new Error("Your admin session has expired. Please sign in again.");
    }
    return data.session.access_token;
  };

  const [rows, setRows] = useState<MemberAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await list({ data: { accessToken: await authToken() } });
      // ✅ FIX: Ensure the response is actually an array before setting state
      if (Array.isArray(data)) {
        setRows(data);
      } else if (data && Array.isArray((data as any).data)) {
        setRows((data as any).data);
      } else {
        setRows([]);
      }
    } catch (e) {
      toast.error(errMsg(e));
      setRows([]); // Fallback to empty array on fetch error
    } finally {
      setLoading(false);
    }
  }, [list]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const safeRows = Array.isArray(rows) ? rows : [];

  return (
    <div className="space-y-6">
      <Card className="p-4 sm:p-6 border-border/50">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 mb-4 sm:flex sm:flex-wrap sm:justify-between">
          <div className="min-w-0">
            <h2 className="font-semibold flex items-center gap-2">
              <KeyRound className="h-4 w-4 shrink-0" />
              Member logins ({safeRows.length})
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Create a username + password for each member. They sign in on the Sign in tab with
              just that username.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={() => void refresh()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <AccountDialog
              onSave={async (v) => {
                await create({ data: { ...v, accessToken: await authToken() } });
                toast.success(`Login created for ${v.username}`);
                await refresh();
              }}
              trigger={
                <Button size="sm" className="bg-gradient-primary">
                  <Plus className="h-4 w-4 mr-1" />
                  New login
                </Button>
              }
            />
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Loading accounts…</p>
        ) : safeRows.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No member logins yet.</p>
        ) : (
          <div className="space-y-2">
            {safeRows.map((a) => (
              <div
                key={a.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-border/50 p-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium truncate">{a.name || a.username}</span>
                    <Badge variant="outline" className="font-mono text-[10px] shrink-0">
                      {a.memberId || "no ID"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    username: <span className="font-mono">{a.username}</span>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    title="Copy username"
                    onClick={() => {
                      void navigator.clipboard.writeText(a.username);
                      toast.success("Username copied");
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <EditAccountDialog
                    account={a}
                    onSave={async (v) => {
                      await update({
                        data: { userId: a.id, ...v, accessToken: await authToken() },
                      });
                      toast.success("Member updated");
                      await refresh();
                    }}
                  />
                  <ResetPasswordDialog
                    username={a.username}
                    onSave={async (password) => {
                      await setPwd({
                        data: { userId: a.id, password, accessToken: await authToken() },
                      });
                      toast.success("Password updated");
                    }}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => {
                      if (!confirm(`Delete login "${a.username}"?`)) return;
                      void authToken()
                        .then((accessToken) => remove({ data: { userId: a.id, accessToken } }))
                        .then(() => {
                          toast.success("Login deleted");
                          return refresh();
                        })
                        .catch((e) => toast.error(errMsg(e)));
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <ResetRequestsCard
        onSetPassword={async (userId, password) => {
          await setPwd({ data: { userId, password, accessToken: await authToken() } });
        }}
      />
    </div>
  );
}

function ResetRequestsCard({
  onSetPassword,
}: {
  onSetPassword: (userId: string, password: string) => Promise<void>;
}) {
  const { rows, loading, remove } = useSubmissions("password_reset_request");
  const safeRows = Array.isArray(rows) ? rows : [];

  return (
    <Card className="p-4 sm:p-6 border-border/50">
      <h2 className="font-semibold flex items-center gap-2">
        <LifeBuoy className="h-4 w-4 shrink-0" />
        Password reset requests ({safeRows.length})
      </h2>
      <p className="text-xs text-muted-foreground mt-1 mb-4">
        Members who forgot their password. Set a new one, tell them, then clear the request.
      </p>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-6">Loading requests…</p>
      ) : safeRows.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No pending requests.</p>
      ) : (
        <div className="space-y-2">
          {safeRows.map((r) => {
            const d = (r.data || {}) as Record<string, string>;
            return (
              <div
                key={r.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-border/50 p-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium truncate">{d.name || d.username}</span>
                    <Badge variant="outline" className="font-mono text-[10px] shrink-0">
                      {d.memberId || "no ID"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    username: <span className="font-mono">{d.username}</span> ·{" "}
                    {new Date(r.created_at).toLocaleString()}
                  </div>
                  {d.note && (
                    <p className="text-xs text-muted-foreground mt-1 break-words">{d.note}</p>
                  )}
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <ResetPasswordDialog
                    username={d.username ?? ""}
                    onSave={async (password) => {
                      if (!d.userId) throw new Error("This request has no linked account");
                      await onSetPassword(d.userId, password);
                      toast.success("Password updated — share it with the member");
                    }}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => void remove(r.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function AccountDialog({
  onSave,
  trigger,
}: {
  onSave: (v: {
    username: string;
    password: string;
    name: string;
    memberId: string;
  }) => Promise<void>;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(() => {
    const id = randomMemberId();
    return { username: id, password: "", name: "", memberId: id };
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.memberId.trim() || form.password.length < 6) {
      toast.error("Member ID and a 6+ character password are required");
      return;
    }
    setBusy(true);
    try {
      const memberId = form.memberId.trim().toUpperCase();
      await onSave({ ...form, username: memberId.toLowerCase(), memberId });
      setOpen(false);
      const nextId = randomMemberId();
      setForm({ username: nextId, password: "", name: "", memberId: nextId });
    } catch (err) {
      const message = errMsg(err);
      toast.error(
        message.includes("claims") || message.includes("Admin access")
          ? "Your admin session is invalid or expired. Sign in again."
          : message,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New member login</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Full name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Aayush Sharma"
            />
          </div>
          <div>
            <Label>Member ID (used as username)</Label>
            <Input
              value={form.memberId}
              onChange={(e) =>
                setForm({ ...form, memberId: e.target.value, username: e.target.value })
              }
              placeholder="NJBS121341234"
              className="font-mono"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              The member signs in with this exact ID. Internally it becomes{" "}
              <span className="font-mono">member-id@{MEMBER_EMAIL_DOMAIN}</span>.
            </p>
          </div>
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="min 6 characters"
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={busy} className="bg-gradient-primary">
              {busy ? "Creating…" : "Create login"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditAccountDialog({
  account,
  onSave,
}: {
  account: MemberAccount;
  onSave: (v: { name: string; memberId: string }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: account.name, memberId: account.memberId });

  useEffect(() => {
    if (open) setForm({ name: account.name, memberId: account.memberId });
  }, [open, account.name, account.memberId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onSave(form);
      setOpen(false);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" title="Edit member">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit — {account.username}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Full name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Member ID</Label>
            <div className="flex gap-2">
              <Input
                value={form.memberId}
                onChange={(e) => setForm({ ...form, memberId: e.target.value })}
                className="font-mono"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => setForm({ ...form, memberId: randomMemberId() })}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={busy} className="bg-gradient-primary">
              {busy ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({
  username,
  onSave,
}: {
  username: string;
  onSave: (password: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onSave(password);
      setOpen(false);
      setPassword("");
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" title="Change password">
          <KeyRound className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Change password — {username}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>New password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="min 6 characters"
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={busy || password.length < 6}
              className="bg-gradient-primary"
            >
              {busy ? "Saving…" : "Save password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
