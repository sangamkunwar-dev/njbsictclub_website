import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms of Service — ICT Club of NJBS" }, { name: "description", content: "Terms of use for the ICT Club of NJBS website." }] }),
  component: () => (
    <div className="container mx-auto px-4 md:px-6 py-16 max-w-3xl">
      <h1 className="text-4xl font-bold font-display mb-8">Terms of Service</h1>
      <Card className="p-8 border-border/50 space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p><strong className="text-foreground">Last updated:</strong> July 2026</p>
        <p>By using this site you agree to be respectful in all interactions, to not misuse the platform, and to abide by NJBS community rules.</p>
        <h2 className="text-lg font-semibold text-foreground pt-4">Accounts</h2>
        <p>You are responsible for keeping your account credentials safe. Member accounts (NJBs123324xxxxx) are issued by club administrators.</p>
        <h2 className="text-lg font-semibold text-foreground pt-4">Content</h2>
        <p>Code snippets, project submissions, and forum posts remain your intellectual property; you grant the club a license to display them on this site.</p>
      </Card>
    </div>
  ),
});
