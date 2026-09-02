import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — ICT Club of NJBS" }, { name: "description", content: "How the ICT Club of NJBS handles your personal data." }] }),
  component: () => (
    <div className="container mx-auto px-4 md:px-6 py-16 max-w-3xl">
      <h1 className="text-4xl font-bold font-display mb-8">Privacy Policy</h1>
      <Card className="p-8 border-border/50 space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p><strong className="text-foreground">Last updated:</strong> July 2026</p>
        <p>The ICT Club of NJBS ("we", "us") respects your privacy. This page explains what data we collect and how we use it.</p>
        <h2 className="text-lg font-semibold text-foreground pt-4">What we collect</h2>
        <p>Account info (name, email, profile picture) when you sign up, and event RSVPs when you register.</p>
        <h2 className="text-lg font-semibold text-foreground pt-4">Cookies</h2>
        <p>We use only essential cookies for authentication and theme preference. No advertising or third-party tracking.</p>
        <h2 className="text-lg font-semibold text-foreground pt-4">Your rights</h2>
        <p>You can request deletion of your account and data at any time by emailing hello@njbsictclub.org.</p>
      </Card>
    </div>
  ),
});
