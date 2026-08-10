process.env.NITRO_PRESET = "vercel";

const { build } = await import("vite");

await build();
