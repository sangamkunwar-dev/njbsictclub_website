// Mock data for the ICT Club — replace with database reads later.

export interface TeamMember {
  id: string;
  name: string;
  position: string;
  department: string;
  order: number;
  avatar: string;
  bio: string;
  skills: string[];
  memberId: string;
  orgUrl?: string;
  website?: string;
  socials: { github?: string; linkedin?: string; twitter?: string; email?: string };
}

export interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  liveUrl: string;
  docsUrl: string;
  category: "Web" | "AI/ML" | "Mobile" | "CyberSec" | "IoT";
  tech: string[];
  team: string[];
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  image: string;
  attendees: number;
  status: "upcoming" | "past";
  tags: string[];
}

export interface CodeSnippet {
  id: string;
  title: string;
  language: string;
  author: string;
  code: string;
  description: string;
}

const AV = (seed: string) =>
  `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

export const teamMembers: TeamMember[] = [
  { id: "1", name: "Arif Rahman", position: "President", department: "Executive", order: 1, avatar: AV("Arif"), bio: "Leading the club vision & partnerships. Fullstack engineer.", skills: ["Leadership", "React", "Node.js"], memberId: "NJBs12332401", socials: { github: "#", linkedin: "#", email: "president@njbsictclub.org" } },
  { id: "2", name: "Nadia Islam", position: "Vice President", department: "Executive", order: 2, avatar: AV("Nadia"), bio: "Operations, mentorship, and event strategy.", skills: ["Strategy", "Python", "Design"], memberId: "NJBs12332402", socials: { github: "#", linkedin: "#" } },
  { id: "3", name: "Tanvir Ahmed", position: "General Secretary", department: "Executive", order: 3, avatar: AV("Tanvir"), bio: "Keeps the club running — meetings, minutes, member relations.", skills: ["Coordination", "TypeScript"], memberId: "NJBs12332403", socials: { github: "#", linkedin: "#" } },
  { id: "4", name: "Sadia Chowdhury", position: "Technical Lead", department: "Tech", order: 4, avatar: AV("Sadia"), bio: "Owns the tech stack and mentors project teams.", skills: ["React", "GoLang", "AWS"], memberId: "NJBs12332404", socials: { github: "#", linkedin: "#" } },
  { id: "5", name: "Rakib Hasan", position: "Cybersecurity Head", department: "Tech", order: 5, avatar: AV("Rakib"), bio: "Runs CTF training and security workshops.", skills: ["CyberSec", "Kali", "Python"], memberId: "NJBs12332405", socials: { github: "#" } },
  { id: "6", name: "Farhana Rahim", position: "AI Research Head", department: "Tech", order: 6, avatar: AV("Farhana"), bio: "LLMs, computer vision, and applied ML for real problems.", skills: ["Python", "PyTorch", "ML"], memberId: "NJBs12332406", socials: { github: "#", linkedin: "#" } },
  { id: "7", name: "Ibrahim Kabir", position: "Events Coordinator", department: "Events", order: 7, avatar: AV("Ibrahim"), bio: "Turns ideas into fully-run hackathons and meetups.", skills: ["Ops", "Marketing"], memberId: "NJBs12332407", socials: { linkedin: "#" } },
  { id: "8", name: "Sumaiya Akter", position: "Design Lead", department: "Design", order: 8, avatar: AV("Sumaiya"), bio: "Brand, UI systems, and print collateral.", skills: ["Figma", "UI/UX", "Illustration"], memberId: "NJBs12332408", socials: { linkedin: "#" } },
  { id: "9", name: "Hasibul Islam", position: "Content Lead", department: "Media", order: 9, avatar: AV("Hasibul"), bio: "Docs, blog, and knowledge sharing across chapters.", skills: ["Writing", "Video"], memberId: "NJBs12332409", socials: { twitter: "#" } },
  { id: "10", name: "Mahfuz Alam", position: "Core Member", department: "Tech", order: 10, avatar: AV("Mahfuz"), bio: "Backend & DevOps enthusiast.", skills: ["Docker", "K8s", "Rust"], memberId: "NJBs12332410", socials: { github: "#" } },
  { id: "11", name: "Zara Khan", position: "Core Member", department: "Design", order: 11, avatar: AV("Zara"), bio: "Motion & interaction design.", skills: ["Motion", "Framer"], memberId: "NJBs12332411", socials: {} },
  { id: "12", name: "Omar Faruk", position: "Core Member", department: "Tech", order: 12, avatar: AV("Omar"), bio: "Mobile-first developer building Flutter apps.", skills: ["Flutter", "Dart"], memberId: "NJBs12332412", socials: { github: "#" } },
];

export const projects: Project[] = [
  { id: "p1", title: "CampusConnect", description: "Real-time chat and study group platform for NJBS students, built with WebSockets & Postgres.", image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800", liveUrl: "#", docsUrl: "#", category: "Web", tech: ["React", "Node.js", "Postgres"], team: ["Arif Rahman", "Sadia Chowdhury"] },
  { id: "p2", title: "MediScan AI", description: "AI-powered symptom checker trained on regional medical data.", image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800", liveUrl: "#", docsUrl: "#", category: "AI/ML", tech: ["Python", "PyTorch", "FastAPI"], team: ["Farhana Rahim"] },
  { id: "p3", title: "SecureVault", description: "End-to-end encrypted password manager with zero-knowledge architecture.", image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800", liveUrl: "#", docsUrl: "#", category: "CyberSec", tech: ["Rust", "WASM", "Argon2"], team: ["Rakib Hasan", "Mahfuz Alam"] },
  { id: "p4", title: "SmartCampus IoT", description: "Sensor network monitoring classroom air quality & occupancy.", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800", liveUrl: "#", docsUrl: "#", category: "IoT", tech: ["ESP32", "MQTT", "Grafana"], team: ["Omar Faruk"] },
  { id: "p5", title: "NJBS Events App", description: "Native mobile app for club events, RSVPs, and push notifications.", image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800", liveUrl: "#", docsUrl: "#", category: "Mobile", tech: ["Flutter", "Firebase"], team: ["Omar Faruk", "Zara Khan"] },
  { id: "p6", title: "DevPortfolio Builder", description: "Drag-and-drop portfolio site generator for club members.", image: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800", liveUrl: "#", docsUrl: "#", category: "Web", tech: ["Next.js", "Tailwind"], team: ["Sumaiya Akter", "Sadia Chowdhury"] },
];

export const events: Event[] = [
  { id: "e1", title: "NJBS HackNight 2026", description: "24-hour overnight hackathon with mentors, snacks, and cash prizes.", date: "2026-08-14T18:00:00Z", location: "NJBS Main Auditorium", image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800", attendees: 142, status: "upcoming", tags: ["Hackathon", "Overnight"] },
  { id: "e2", title: "AI Frontier Workshop", description: "Hands-on workshop on LLMs, RAG, and building production AI apps.", date: "2026-07-28T10:00:00Z", location: "Tech Lab 3", image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800", attendees: 68, status: "upcoming", tags: ["Workshop", "AI"] },
  { id: "e3", title: "CyberSec CTF Championship", description: "Team-based Capture The Flag competition — beginners welcome.", date: "2026-09-05T09:00:00Z", location: "Room 204", image: "https://images.unsplash.com/photo-1563206767-5b18f218e8de?w=800", attendees: 34, status: "upcoming", tags: ["CTF", "Security"] },
  { id: "e4", title: "Freshers' Tech Fair 2025", description: "Introduction to club activities, project demos, and welcome.", date: "2025-09-15T11:00:00Z", location: "Central Ground", image: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800", attendees: 320, status: "past", tags: ["Community"] },
  { id: "e5", title: "React Bangla Meetup", description: "Guest talks from senior engineers at Pathao and Chaldal.", date: "2025-11-10T15:00:00Z", location: "Auditorium", image: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800", attendees: 180, status: "past", tags: ["Meetup", "React"] },
  { id: "e6", title: "Winter Code Camp 2024", description: "3-day intensive bootcamp — Git, DSA, and system design.", date: "2024-12-20T09:00:00Z", location: "Lab 1 & 2", image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800", attendees: 95, status: "past", tags: ["Bootcamp"] },
];

export const codeSnippets: CodeSnippet[] = [
  { id: "s1", title: "Debounce hook", language: "TypeScript", author: "Sadia Chowdhury", description: "Tiny React hook for input debouncing.", code: `export function useDebounce<T>(value: T, delay = 300) {\n  const [d, setD] = useState(value);\n  useEffect(() => {\n    const t = setTimeout(() => setD(value), delay);\n    return () => clearTimeout(t);\n  }, [value, delay]);\n  return d;\n}` },
  { id: "s2", title: "Python one-liner: flatten list", language: "Python", author: "Farhana Rahim", description: "Flatten nested list without imports.", code: `flat = [x for sub in nested for x in sub]` },
  { id: "s3", title: "Nginx security headers", language: "Nginx", author: "Rakib Hasan", description: "Sane defaults for any production site.", code: `add_header X-Frame-Options "SAMEORIGIN";\nadd_header X-Content-Type-Options "nosniff";\nadd_header Referrer-Policy "strict-origin-when-cross-origin";` },
];

export const positionHolders = teamMembers.filter((m) => m.order <= 6);
