import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import netlify from "@netlify/vite-plugin-tanstack-start";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Deployed on Netlify via @netlify/vite-plugin-tanstack-start (added after
// tanstackStart(), per https://docs.netlify.com/build/frameworks/framework-setup-guides/tanstack-start/).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const envDefine = Object.fromEntries(
    Object.entries(env).map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)]),
  );

  return {
    define: envDefine,
    resolve: {
      alias: { "@": `${process.cwd()}/src` },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
    },
    plugins: [
      tailwindcss(),
      tsConfigPaths({ projects: ["./tsconfig.json"] }),
      tanstackStart({
        importProtection: {
          behavior: "error",
          client: { files: ["**/server/**"], specifiers: ["server-only"] },
        },
        server: { entry: "server" },
      }),
      viteReact(),
      netlify(),
    ],
  };
});
