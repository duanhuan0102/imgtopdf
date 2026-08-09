import { notFound, permanentRedirect } from "next/navigation";
import { getPublicToolPath, getPublicToolSlug, getTool, getToolSlugFromPath, toolDefinitions } from "../../tool-data";

export function generateStaticParams() {
  return [
    ...toolDefinitions.map((tool) => ({ slug: getPublicToolSlug(tool.slug) })),
    { slug: "imec-to-pdf" },
  ];
}

export async function generateMetadata() {
  return { robots: { index: false, follow: true } };
}

export default async function LegacyToolsRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug === "img-to-pdf") notFound();
  const tool = getTool(getToolSlugFromPath(slug));
  if (!tool) notFound();
  permanentRedirect(slug === "imec-to-pdf" ? "/imec-to-pdf" : getPublicToolPath(tool.slug));
}
