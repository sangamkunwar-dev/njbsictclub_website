import { useEffect, useState } from "react";
import { Cookie, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const KEY = "ict-cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(KEY)) setVisible(true);
  }, []);

  const decide = (choice: "accepted" | "rejected") => {
    localStorage.setItem(KEY, choice);
    window.dispatchEvent(new CustomEvent("njbs:cookie-consent", { detail: { analytics: choice === "accepted" } }));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-3 md:p-5 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-4xl rounded-3xl border border-border/60 bg-card/95 p-4 shadow-elegant backdrop-blur-xl md:p-5 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="text-sm">
            <p className="font-semibold tracking-tight">Your privacy, your choice</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              We use essential storage to keep NJBS ICT Club secure and working. Choose Accept to enable privacy-respecting usage analytics and improve the experience, or Reject to keep analytics off.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => decide("rejected")}>
            Reject
          </Button>
          <Button size="sm" onClick={() => decide("accepted")} className="bg-gradient-primary">
            Accept
          </Button>
          <button
            onClick={() => decide("rejected")}
            aria-label="Close"
            className="ml-1 text-muted-foreground hover:text-foreground md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
