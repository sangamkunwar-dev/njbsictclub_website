import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";
import { useEffect } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Toaster } from "@/components/ui/sonner";
import { CookieBanner } from "@/components/cookie-banner";
import { getIntegrations, type PublicIntegrations } from "@/lib/integrations.functions";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background bg-hero px-4">
      <div className="max-w-md text-center">
        <h1 className="text-8xl font-bold text-gradient font-display">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has moved.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-gradient-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-elegant hover:shadow-glow transition-all"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try refreshing or return home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-lg bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
          <a href="/" className="rounded-lg border border-border px-4 py-2 text-sm">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: async (): Promise<{ integrations: PublicIntegrations }> => {
    try {
      return { integrations: await getIntegrations() };
    } catch {
      return { integrations: {} };
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ICT Club of NJBS — Building the future together" },
      { name: "description", content: "The official ICT Club of Nawa Jyoti English Boarding School. Projects, hackathons, workshops, and a community for young technologists." },
      { name: "author", content: "ICT Club NJBS" },
      { property: "og:title", content: "ICT Club of NJBS — Building the future together" },
      { property: "og:description", content: "The official ICT Club of Nawa Jyoti English Boarding School. Projects, hackathons, workshops, and a community for young technologists." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "ICT Club of NJBS — Building the future together" },
      { name: "twitter:description", content: "The official ICT Club of Nawa Jyoti English Boarding School. Projects, hackathons, workshops, and a community for young technologists." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/64757a00-3381-4423-b2c1-c8db9da7ceec" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/64757a00-3381-4423-b2c1-c8db9da7ceec" },
      ...(loaderData?.integrations.gscVerification
        ? [{ name: "google-site-verification", content: loaderData.integrations.gscVerification }]
        : []),
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "apple-touch-icon", href: "/ictclub-logo.jpg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

/** Loads Google Analytics (gtag.js) once, using the admin-configured GA4 ID. */
function GoogleAnalytics({ measurementId }: { measurementId?: string }) {
  useEffect(() => {
    if (!measurementId || document.getElementById("ga-gtag")) return;
    const script = document.createElement("script");
    script.id = "ga-gtag";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
    const w = window as unknown as { dataLayer?: unknown[] };
    w.dataLayer = w.dataLayer || [];
    const gtag = (...args: unknown[]) => { w.dataLayer!.push(args); };
    gtag("js", new Date());
    gtag("config", measurementId);
  }, [measurementId]);
  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { integrations } = Route.useLoaderData();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">
              <Outlet />
            </main>
            <Footer />
          </div>
          <GoogleAnalytics measurementId={integrations?.gaMeasurementId} />
          <Toaster position="top-right" />
          <CookieBanner />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
