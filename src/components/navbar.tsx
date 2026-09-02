import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, LogOut, User as UserIcon, LayoutDashboard, Shield } from "lucide-react";
import { useAuth } from "./auth-provider";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { NotificationBell } from "./notification-bell";
import { InstallButton } from "./install-button";

interface NavLink {
  to: string;
  label: string;
}

const PUBLIC_LINKS: NavLink[] = [
  { to: "/", label: "Home" },
  { to: "/team", label: "Team" },
  { to: "/projects", label: "Projects" },
  { to: "/events", label: "Events" },
  { to: "/join", label: "Join" },
  { to: "/contact", label: "Contact" },
];

export function Navbar() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const links: NavLink[] = [...PUBLIC_LINKS];

  const initials =
    user?.name
      ?.split(" ")
      .map((s) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 glass">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link to="/">
          <Logo />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              activeOptions={{ exact: link.to === "/" }}
              className="px-3 py-2 text-sm font-medium text-muted-foreground rounded-lg transition-colors hover:text-foreground hover:bg-surface"
              activeProps={{ className: "text-foreground bg-surface" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Desktop & Tablet Buttons */}
          <InstallButton className="hidden sm:inline-flex" />
          <NotificationBell />
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-border p-0.5 pr-3 hover:bg-surface transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar ?? undefined} alt={user.name} />
                    <AvatarFallback className="text-xs bg-gradient-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline text-sm font-medium">{user.name.split(" ")[0]}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="text-sm">{user.name}</span>
                  <span className="text-xs text-muted-foreground font-normal">{user.email}</span>
                  <span
                    className={cn(
                      "mt-1 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                      user.role === "admin"
                        ? "bg-destructive/15 text-destructive"
                        : user.role === "member"
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {user.role === "admin" && <Shield className="h-2.5 w-2.5" />}
                    {user.role}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile"><UserIcon className="mr-2 h-4 w-4" />Profile</Link>
                </DropdownMenuItem>
                {(user.role === "member" || user.role === "admin") && (
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Link>
                  </DropdownMenuItem>
                )}
                {user.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin"><Shield className="mr-2 h-4 w-4" />Admin Panel</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="hidden sm:inline-flex bg-gradient-primary hover:shadow-glow transition-all">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
          
          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setOpen((o) => !o)}
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border"
            aria-label="Menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {open && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur">
          <nav className="container mx-auto px-4 py-3 flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-surface"
              >
                {link.label}
              </Link>
            ))}
            
            <div className="flex items-center gap-2 pt-2 border-t border-border/50 mt-1">
              <InstallButton className="flex-1 sm:hidden" />
              {!user && (
                <Button asChild size="sm" className="flex-1 bg-gradient-primary">
                  <Link to="/auth" onClick={() => setOpen(false)}>Sign in</Link>
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
