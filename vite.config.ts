import vinext from "vinext";
import { nitro } from "nitro/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { readExecutionProfile } from "./scripts/execution-profile.mjs";
import { sites } from "./build/sites-vite-plugin";

const isCodexSeatbeltSandbox =
  process.env.CODEX_SANDBOX === "seatbelt";

const managedLinux =
  readExecutionProfile() === "managed-linux";

export default defineConfig(() => {
  return {
    server: {
      host: "0.0.0.0",
      port: 5173,
      strictPort: true,

      ...(managedLinux
        ? { allowedHosts: ["terminal.local"] }
        : {}),

      ...(isCodexSeatbeltSandbox
        ? {
          watch: {
            useFsEvents: false,
            usePolling: true,
          },
        }
        : {}),
    },

    plugins: [
      vinext(),

      tailwindcss(),

      nitro({
        preset: "vercel",
      }),

      sites({
        mockAuth: !managedLinux,
      }),
    ],
  };
});