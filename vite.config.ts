import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { fileURLToPath, URL } from "node:url";

const staticTanStackStart = fileURLToPath(
  new URL("./src/lib/tanstack-start-static.ts", import.meta.url),
);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
  base: "/",
  server: { host: "::", port: 8080 },
  resolve: {
    alias: {
      "@tanstack/react-start/server": staticTanStackStart,
      "@tanstack/react-start": staticTanStackStart,
    },
  },
  plugins: [tsconfigPaths(), tailwindcss(), react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
  },
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || ""),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || ""),
  },
  };
});
