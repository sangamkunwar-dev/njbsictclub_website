import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className={cn(
        "group relative inline-flex h-9 w-16 items-center rounded-full border border-border bg-surface-elevated p-1 transition-all duration-500 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <span
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-elegant transition-transform duration-500 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]",
          isDark ? "translate-x-7" : "translate-x-0",
        )}
      >
        <Sun
          className={cn(
            "h-4 w-4 absolute transition-all duration-500",
            isDark ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100",
          )}
        />
        <Moon
          className={cn(
            "h-4 w-4 absolute transition-all duration-500",
            isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0",
          )}
        />
      </span>
    </button>
  );
}
