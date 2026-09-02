import { Link } from "@tanstack/react-router";
import { Github, Linkedin, Mail, Twitter } from "lucide-react";
import { LOGO_URL } from "./logo";

const SOCIAL_LINKS = [
  { label: "GitHub", href: "https://github.com/njbsictclub", Icon: Github },
  { label: "LinkedIn", href: "https://www.linkedin.com/", Icon: Linkedin },
  { label: "X", href: "https://x.com/", Icon: Twitter },
  { label: "Email", href: "mailto:njbsictclub@gmail.com", Icon: Mail },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/50 bg-surface/50">
      <div className="container mx-auto px-4 md:px-6 py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden ring-1 ring-border/60 bg-black shadow-elegant">
              <img src={LOGO_URL} alt="ICT Club NJBS" className="h-full w-full object-cover" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="font-display font-bold tracking-tight">ICT Club of NJBS</span>
              <span className="text-[10px] text-muted-foreground tracking-wider uppercase">Building the future, together</span>
            </span>
          </Link>
          <p className="text-sm text-muted-foreground max-w-md">
            A community of students, developers, designers, and researchers at Nawa
            Jyoti English Boarding School building meaningful technology.
          </p>
          <div className="mt-4 flex gap-2">
            {SOCIAL_LINKS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noreferrer" : undefined}
                aria-label={label}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary hover:shadow-glow transition-all"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-sm mb-3">Explore</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/team" className="hover:text-foreground">Team</Link></li>
            <li><Link to="/projects" className="hover:text-foreground">Projects</Link></li>
            <li><Link to="/events" className="hover:text-foreground">Events</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-sm mb-3">Legal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-foreground">Terms of Service</Link></li>
            <li><Link to="/privacy" className="hover:text-foreground">Cookies</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/50">
        <div className="container mx-auto px-4 md:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} ICT Club of NJBS. All rights reserved.</p>
          <p>Built with care · Cookies used only for essential functionality.</p>
        </div>
      </div>
    </footer>
  );
}
