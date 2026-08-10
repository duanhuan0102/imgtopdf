import { nitro } from "nitro/vite";
import vinext from "vinext";
import { defineConfig } from "vite";

const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";
if (process.env.VERCEL === "1") {
  process.env.NITRO_PRESET ??= "vercel";
}

export default defineConfig({
  server: isCodexSeatbeltSandbox
    ? { watch: { useFsEvents: false, usePolling: true } }
    : undefined,
  plugins: [vinext(), nitro()],
});
