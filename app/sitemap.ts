import type { MetadataRoute } from "next";
import { getPublicToolPath, toolDefinitions } from "./tool-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://imgtopdf.org";
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    ...toolDefinitions.map((tool) => ({ url: `${base}${getPublicToolPath(tool.slug)}`, changeFrequency: "weekly" as const, priority: tool.slug === "img-to-pdf" ? 0.95 : 0.8 })),
    { url: `${base}/imec-to-pdf`, changeFrequency: "monthly" as const, priority: 0.65 },
    { url: `${base}/privacy`, changeFrequency: "yearly" as const, priority: 0.2 },
    { url: `${base}/terms`, changeFrequency: "yearly" as const, priority: 0.2 },
  ];
}
