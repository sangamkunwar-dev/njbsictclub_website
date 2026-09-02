import { cn } from "@/lib/utils";

// Point directly to the static public root image URL
export const LOGO_URL = "/ictclub-logo.jpg";

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2.5 group", className)}>
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden ring-1 ring-border/60 bg-black shadow-elegant transition-transform group-hover:scale-105">
        <img src={LOGO_URL} alt="ICT Club NJBS" className="h-full w-full object-cover" />
        <span className="absolute inset-0 rounded-xl bg-gradient-primary opacity-0 blur-md group-hover:opacity-40 transition-opacity" />
      </span>
      {showText && (
        <span className="flex flex-col leading-tight">
          <span className="font-display font-bold text-sm tracking-tight">ICT Club</span>
          <span className="text-[10px] text-muted-foreground tracking-wider uppercase">NJBS</span>
        </span>
      )}
    </span>
  );
}