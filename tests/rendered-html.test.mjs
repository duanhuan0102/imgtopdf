import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workerUrl = new URL("../dist/server/index.js", import.meta.url);

async function render(pathname = "/") {
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders an SEO-ready img to PDF homepage", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Img to PDF Online — Free Image Converter \| imgtopdf\.org<\/title>/i);
  assert.match(html, /<meta name="description"/i);
  assert.match(html, /<link rel="canonical" href="https:\/\/imgtopdf\.org"/i);
  assert.match(html, /<h1>Free Img to PDF Converter Online<\/h1>/i);
  assert.match(html, /href="\/img-to-word"/i);
  assert.match(html, /href="\/pdf-to-img"/i);
  assert.match(html, /href="\/tif-to-jpeg"/i);
  assert.match(html, /Convert img to PDF online/i);
  assert.match(html, /<h2[^>]*>Upload Images and Create a PDF<\/h2>/i);
  assert.match(html, /Upload Images for Img to PDF/i);
  assert.match(html, /<h2>Image and PDF Conversion Tools<\/h2>/i);
  assert.match(html, /<h2>How to Convert Img to PDF Online<\/h2>/i);
  assert.match(html, /<h2>Related Image to PDF and PDF Tools<\/h2>/i);
  assert.match(html, /<h2>Img to PDF FAQ<\/h2>/i);
  assert.match(html, /Image to PDF and Image Tools/i);
  assert.match(html, /PDF to Image and PDF Tools/i);
  assert.doesNotMatch(html, /One upload\. One clean PDF\./i);
  assert.doesNotMatch(html, /100% free to try/i);
  assert.match(html, /Download starts automatically when ready/i);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("renders the keyword-focused image to PDF page with canonical metadata and related links", async () => {
  const response = await render("/image-to-pdf");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>Image to PDF Converter Online \| Free Online Tool \| imgtopdf\.org<\/title>/i);
  assert.match(html, /<link rel="canonical" href="https:\/\/imgtopdf\.org\/image-to-pdf"/i);
  assert.match(html, /<h1>Image to PDF Converter Online<\/h1>/i);
  assert.match(html, /Related Image to PDF tools, one click away\./i);
  assert.match(html, /Upload Images for Image to PDF/i);
  assert.match(html, /Download starts automatically when ready/i);
  assert.match(html, /<h2>Image to PDF features<\/h2>/i);
  assert.match(html, /<h2>How to Convert Image to PDF<\/h2>/i);
  assert.match(html, /<h2>What Is Image to PDF\?<\/h2>/i);
  assert.match(html, /<h2>Image to PDF FAQ<\/h2>/i);
  assert.match(html, /No login required/i);
  assert.match(html, /"@type":"FAQPage"/i);
  assert.match(html, /"@type":"SoftwareApplication"/i);
  assert.match(html, /"@type":"BreadcrumbList"/i);
});

test("renders the imec to PDF search-intent landing page", async () => {
  const response = await render("/imec-to-pdf");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>IMEC to PDF Converter Online[^<]*Free Online Tool \| imgtopdf\.org<\/title>/i);
  assert.match(html, /<link rel="canonical" href="https:\/\/imgtopdf\.org\/imec-to-pdf"/i);
  assert.match(html, /<h1>IMEC to PDF Converter Online<\/h1>/i);
  assert.match(html, /Looking for &quot;imec to pdf&quot;\?/i);
  assert.match(html, /What does imec to PDF mean\?/i);
  assert.match(html, /Image to PDF/i);
  assert.match(html, /"@type":"FAQPage"/i);
});

test("renders the TIF to JPEG keyword landing page", async () => {
  const response = await render("/tif-to-jpeg");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>TIF to JPEG Converter Online[^<]*Free Online Tool \| imgtopdf\.org<\/title>/i);
  assert.match(html, /<meta name="description"[^>]*TIF[^>]*TIFF/i);
  assert.match(html, /<link rel="canonical" href="https:\/\/imgtopdf\.org\/tif-to-jpeg"/i);
  assert.match(html, /<h1>TIF to JPEG Converter Online<\/h1>/i);
  assert.match(html, /Upload TIF Images for TIF to JPEG/i);
  assert.match(html, /One TIF or TIFF/i);
  assert.match(html, /<h2>TIF to JPEG features<\/h2>/i);
  assert.match(html, /<h2>How to Convert TIF to JPEG<\/h2>/i);
  assert.match(html, /<h2>What Is TIF to JPEG\?<\/h2>/i);
  assert.match(html, /<h2>TIF to JPEG FAQ<\/h2>/i);
  assert.match(html, /href="\/image-to-pdf"/i);
  assert.match(html, /href="\/jpg-to-pdf"/i);
  assert.match(html, /href="\/png-to-pdf"/i);
  assert.match(html, /href="\/webp-to-pdf"/i);
  assert.match(html, /"@type":"FAQPage"/i);
});

test("keeps generic conversion pages aligned with their target keywords", async () => {
  const pages = [
    ["/img-to-word", "Img to Word", "How to Convert Img to Word", "What Is Img to Word?"],
    ["/jpg-to-pdf", "JPG to PDF", "How to Convert JPG to PDF", "What Is JPG to PDF?"],
    ["/png-to-pdf", "PNG to PDF", "How to Convert PNG to PDF", "What Is PNG to PDF?"],
    ["/webp-to-pdf", "WebP to PDF", "How to Convert WebP to PDF", "What Is WebP to PDF?"],
    ["/pdf-to-img", "PDF to Image", "How to Convert PDF to Image", "What Is PDF to Image?"],
    ["/pdf-to-word", "PDF to Word", "How to Convert PDF to Word", "What Is PDF to Word?"],
    ["/compress-pdf", "Compress PDF", "How to Compress PDF Online", "What Does Compress PDF Do?"],
  ];

  for (const [pathname, keyword, guideTitle, detailTitle] of pages) {
    const response = await render(pathname);
    assert.equal(response.status, 200);
    const html = await response.text();
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(html, new RegExp(`<title>[^<]*${escapedKeyword}[^<]*<\\/title>`, "i"));
    assert.match(html, new RegExp(`<meta name="description"[^>]*${escapedKeyword}`, "i"));
    assert.match(html, new RegExp(`<h1>[^<]*${escapedKeyword}[^<]*<\\/h1>`, "i"));
    assert.match(html, new RegExp(`<h2>${escapedKeyword} features<\\/h2>`, "i"));
    assert.match(html, new RegExp(`<h2>${guideTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}<\\/h2>`, "i"));
    assert.match(html, new RegExp(`<h2>${detailTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}<\\/h2>`, "i"));
    assert.match(html, new RegExp(`<h2>${escapedKeyword} FAQ<\\/h2>`, "i"));
    assert.match(html, new RegExp(`Related ${escapedKeyword} tools, one click away\\.`, "i"));
  }
});

test("exposes real browser conversion controls for PDF tools", async () => {
  const workspace = await readFile(new URL("../app/components/ToolWorkspace.tsx", import.meta.url), "utf8");
  assert.match(workspace, /buildPdfImageArtifact/);
  assert.match(workspace, /buildPdfWordDocument/);
  assert.match(workspace, /buildPdfDocxArchive/);
  assert.match(workspace, /converted\.docx/);
  assert.match(workspace, /mc:AlternateContent/);
  assert.match(workspace, /docxEditableTextParagraph/);
  assert.match(workspace, /operationsFilter/);
  assert.match(workspace, /tesseract\.js/);
  assert.match(workspace, /extractOcrTextItems/);
  assert.match(workspace, /chi_sim/);
  assert.match(workspace, /user_defined_dpi: "200"/);
  assert.match(workspace, /eraseOcrText\(draft\.canvas, eraseBoxes, draft\.ocrScale\)/);
  assert.match(workspace, /<a:noFill\/><a:ln><a:noFill\/>/);
  assert.match(workspace, /<w:sdt><w:sdtPr>/);
  assert.match(workspace, /detectFillableFields/);
  assert.match(workspace, /点击填写/);
  assert.match(workspace, /import\("utif"\)/);
  assert.match(workspace, /UTIF\.decodeImage/);
  assert.match(workspace, /UTIF\.toRGBA8/);
  assert.match(workspace, /image\/tiff/);
  assert.match(workspace, /compressPdf/);
  for (const pathname of ["/pdf-to-img", "/pdf-to-word", "/compress-pdf"]) {
    const response = await render(pathname);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.doesNotMatch(html, /Worker required|production worker is required/i);
  }
});

test("removes the old img to PDF detail URL", async () => {
  const response = await render("/img-to-pdf");
  assert.equal(response.status, 404);
});

test("permanently redirects legacy tools URLs to their canonical public routes", async () => {
  for (const [legacy, canonical] of [["/tools/image-to-pdf", "/image-to-pdf"], ["/tools/tif-to-jpeg", "/tif-to-jpeg"]]) {
    const response = await render(legacy);
    assert.ok([301, 308].includes(response.status));
    assert.equal(response.headers.get("location"), canonical);
  }
});

test("gives privacy and terms pages unique crawl metadata", async () => {
  for (const [pathname, title, canonical] of [["/privacy", "Privacy Policy", "/privacy"], ["/terms", "Terms of Use", "/terms"]]) {
    const response = await render(pathname);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, new RegExp(`<title>${title} \\| imgtopdf\\.org<\\/title>`, "i"));
    assert.match(html, new RegExp(`<link rel="canonical" href="https://imgtopdf\\.org${canonical}`, "i"));
  }
});

test("keeps the public route data aligned with the internal-link hub", async () => {
  const [data, homepage] = await Promise.all([
    readFile(new URL("../app/tool-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  ]);
  for (const slug of ["img-to-pdf", "img-to-word", "pdf-to-img", "compress-pdf", "pdf-to-word"]) {
    assert.match(data, new RegExp(`slug: "${slug}"`));
    const publicSlug = slug === "img-to-pdf" ? "image-to-pdf" : slug;
    assert.match(homepage, new RegExp(`/${publicSlug}`));
  }
  assert.match(data, /related: \["img-to-word", "jpg-to-pdf", "png-to-pdf", "webp-to-pdf", "tif-to-jpeg"\]/);
  assert.match(data, /related: \["pdf-to-word", "compress-pdf"\]/);
  assert.match(data, /related: \["pdf-to-img", "pdf-to-word"\]/);
  assert.match(data, /slug: "tif-to-jpeg"[\s\S]*featured: true/);
  assert.match(data, /shortTitle: "PDF to Image"/);
});
