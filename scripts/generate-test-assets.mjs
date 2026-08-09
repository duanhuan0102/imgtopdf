import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const outputDir = path.resolve("D:/Pictures/Camera Roll/imgtopdf-test-assets");
await fs.mkdir(outputDir, { recursive: true });

function outputPath(name) {
  return path.join(outputDir, name);
}

function escapeXml(value) {
  return value.replace(/[&<>\'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&apos;",
    '"': "&quot;",
  }[character] ?? character));
}

function cardSvg({ width, height, title, subtitle, background, accent, transparent = false, variant = 1 }) {
  const backgroundMarkup = transparent ? "" : `<rect width="${width}" height="${height}" fill="${background}"/>`;
  const stripeY = Math.round(height * 0.68);
  const circleX = Math.round(width * (variant % 2 ? 0.78 : 0.22));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${backgroundMarkup}
  <rect x="${Math.round(width * 0.07)}" y="${Math.round(height * 0.12)}" width="${Math.round(width * 0.86)}" height="${Math.round(height * 0.76)}" rx="28" fill="${transparent ? "#ffffff" : "#ffffff"}" fill-opacity="${transparent ? "0.18" : "0.92"}"/>
  <circle cx="${circleX}" cy="${Math.round(height * 0.32)}" r="${Math.round(Math.min(width, height) * 0.14)}" fill="${accent}" fill-opacity="0.88"/>
  <rect x="${Math.round(width * 0.14)}" y="${Math.round(height * 0.27)}" width="${Math.round(width * 0.34)}" height="${Math.round(height * 0.045)}" rx="10" fill="${accent}"/>
  <rect x="${Math.round(width * 0.14)}" y="${Math.round(height * 0.38)}" width="${Math.round(width * 0.50)}" height="${Math.round(height * 0.025)}" rx="8" fill="${accent}" fill-opacity="0.65"/>
  <rect x="${Math.round(width * 0.14)}" y="${Math.round(height * 0.44)}" width="${Math.round(width * 0.42)}" height="${Math.round(height * 0.025)}" rx="8" fill="${accent}" fill-opacity="0.45"/>
  <rect x="0" y="${stripeY}" width="${width}" height="${height - stripeY}" fill="${accent}" fill-opacity="0.9"/>
  <text x="${Math.round(width * 0.08)}" y="${Math.round(height * 0.77)}" font-family="Arial, sans-serif" font-size="${Math.round(height * 0.06)}" font-weight="700" fill="#ffffff">${escapeXml(title)}</text>
  <text x="${Math.round(width * 0.08)}" y="${Math.round(height * 0.84)}" font-family="Arial, sans-serif" font-size="${Math.round(height * 0.032)}" fill="#ffffff">${escapeXml(subtitle)}</text>
  </svg>`;
}

async function writeRaster(name, svg, format, options = {}) {
  const image = sharp(Buffer.from(svg));
  if (format === "jpg") await image.flatten({ background: "#ffffff" }).jpeg({ quality: options.quality ?? 92 }).toFile(outputPath(name));
  if (format === "png") await image.png().toFile(outputPath(name));
  if (format === "webp") await image.flatten({ background: "#ffffff" }).webp({ quality: options.quality ?? 90 }).toFile(outputPath(name));
  if (format === "tiff") await image.flatten({ background: "#ffffff" }).tiff({ compression: "lzw" }).toFile(outputPath(name));
  return outputPath(name);
}

const jpgOneSvg = cardSvg({ width: 1600, height: 1100, title: "TEST JPG 01", subtitle: "Use for JPG to PDF and image to PDF", background: "#e8f4f2", accent: "#087f78", variant: 1 });
const jpgTwoSvg = cardSvg({ width: 1200, height: 1600, title: "TEST JPG 02", subtitle: "Second page for ordering tests", background: "#fff1dc", accent: "#e07b39", variant: 2 });
const pngSvg = cardSvg({ width: 1400, height: 1000, title: "TEST PNG", subtitle: "Transparent PNG input", background: "#d9e8ff", accent: "#3468c0", transparent: true, variant: 1 });
const webpSvg = cardSvg({ width: 1400, height: 900, title: "TEST WEBP", subtitle: "WebP input for format validation", background: "#f1e4ff", accent: "#7a4fb3", variant: 2 });
const tifSvg = cardSvg({ width: 1600, height: 1200, title: "TEST TIFF", subtitle: "TIF/TIFF input for JPEG conversion", background: "#e9e2d0", accent: "#7e633d", variant: 1 });

await writeRaster("test-jpg-01.jpg", jpgOneSvg, "jpg");
await writeRaster("test-jpg-02.jpg", jpgTwoSvg, "jpg");
await writeRaster("test-png-transparent.png", pngSvg, "png");
await writeRaster("test-webp.webp", webpSvg, "webp");
await writeRaster("test-tif.tiff", tifSvg, "tiff");

const scanOneSvg = cardSvg({ width: 1400, height: 1900, title: "SCANNED PAGE 1", subtitle: "Image-only PDF page - OCR test", background: "#f2efe6", accent: "#5f625e", variant: 1 });
const scanTwoSvg = cardSvg({ width: 1400, height: 1900, title: "SCANNED PAGE 2", subtitle: "There is no selectable text layer", background: "#eee9dd", accent: "#6c675b", variant: 2 });
const scanOnePath = await writeRaster("test-scan-page-01.png", scanOneSvg, "png");
const scanTwoPath = await writeRaster("test-scan-page-02.png", scanTwoSvg, "png");

const compressionSources = [];
for (let index = 1; index <= 3; index += 1) {
  const svg = cardSvg({
    width: 2400,
    height: 1600,
    title: `COMPRESSION PAGE ${index}`,
    subtitle: "High-resolution source image for PDF compression",
    background: index === 1 ? "#d9f1ed" : index === 2 ? "#ffe4dc" : "#e8e2ff",
    accent: index === 1 ? "#087f78" : index === 2 ? "#c95d47" : "#7050a8",
    variant: index,
  });
  compressionSources.push(await writeRaster(`test-compress-source-0${index}.jpg`, svg, "jpg", { quality: 96 }));
}

async function createTextPdf() {
  const pdf = await PDFDocument.create();
  pdf.setTitle("imgtopdf selectable text test");
  pdf.setAuthor("imgtopdf.org test fixture");
  pdf.setSubject("Selectable text for PDF to Word and PDF to Image tests");
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pages = [
    ["PDF TO WORD TEST", "This PDF contains a real selectable text layer.", "Use it to test PDF to Word extraction."],
    ["PAGE ORDER TEST", "The second page helps verify all-pages and first-page options.", "Text should remain selectable in a PDF viewer."],
    ["COMPRESSION TEST", "This page includes metadata and repeated text content.", "Use it with Compress PDF and compare the downloaded file size."],
  ];
  pages.forEach(([heading, lineOne, lineTwo], index) => {
    const page = pdf.addPage([612, 792]);
    page.drawText(heading, { x: 72, y: 704, size: 24, font: bold, color: rgb(0.03, 0.35, 0.33) });
    page.drawText(lineOne, { x: 72, y: 650, size: 14, font, color: rgb(0.15, 0.15, 0.15) });
    page.drawText(lineTwo, { x: 72, y: 622, size: 14, font, color: rgb(0.15, 0.15, 0.15) });
    page.drawText(`imgtopdf.org test page ${index + 1} of ${pages.length}`, { x: 72, y: 84, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
    page.drawRectangle({ x: 72, y: 565, width: 468, height: 2, color: rgb(0.08, 0.55, 0.5) });
  });
  const bytes = await pdf.save({ useObjectStreams: true });
  await fs.writeFile(outputPath("test-text-selectable.pdf"), bytes);
}

async function createImageOnlyPdf(name, imagePaths) {
  const pdf = await PDFDocument.create();
  pdf.setTitle("imgtopdf scanned image test");
  pdf.setAuthor("imgtopdf.org test fixture");
  for (const imagePath of imagePaths) {
    const image = await pdf.embedPng(await fs.readFile(imagePath));
    const page = pdf.addPage([612, 792]);
    const scale = Math.min(page.getWidth() / image.width, page.getHeight() / image.height);
    const width = image.width * scale;
    const height = image.height * scale;
    page.drawImage(image, { x: (page.getWidth() - width) / 2, y: (page.getHeight() - height) / 2, width, height });
  }
  const bytes = await pdf.save({ useObjectStreams: true });
  await fs.writeFile(outputPath(name), bytes);
}

async function createCompressionPdf() {
  const pdf = await PDFDocument.create();
  pdf.setTitle("imgtopdf compression source test");
  pdf.setAuthor("imgtopdf.org test fixture");
  pdf.setSubject("High-resolution image pages for compression testing");
  for (const sourcePath of compressionSources) {
    const image = await pdf.embedJpg(await fs.readFile(sourcePath));
    const page = pdf.addPage([612, 792]);
    const scale = Math.min(page.getWidth() / image.width, page.getHeight() / image.height);
    const width = image.width * scale;
    const height = image.height * scale;
    page.drawImage(image, { x: (page.getWidth() - width) / 2, y: (page.getHeight() - height) / 2, width, height });
  }
  const bytes = await pdf.save({ useObjectStreams: false });
  await fs.writeFile(outputPath("test-compression-source.pdf"), bytes);
}

await createTextPdf();
await createImageOnlyPdf("test-scanned-image-only.pdf", [scanOnePath, scanTwoPath]);
await createCompressionPdf();
await fs.writeFile(outputPath("invalid-fake.jpg"), "This is a validation test file, not a real JPEG image.\n", "utf8");

const pdfChecks = [];
for (const [name, expectedPages] of [["test-text-selectable.pdf", 3], ["test-scanned-image-only.pdf", 2], ["test-compression-source.pdf", 3]]) {
  const document = await PDFDocument.load(await fs.readFile(outputPath(name)));
  pdfChecks.push(`${name}: ${document.getPageCount()} pages (expected ${expectedPages})`);
}

const readme = `imgtopdf.org test assets
========================

Image to PDF / JPG to PDF:
- test-jpg-01.jpg
- test-jpg-02.jpg

PNG to PDF:
- test-png-transparent.png

WebP to PDF:
- test-webp.webp

TIF to JPEG:
- test-tif.tiff

PDF to Image and Compress PDF:
- test-text-selectable.pdf (3 pages, selectable text)
- test-scanned-image-only.pdf (2 image-only pages)
- test-compression-source.pdf (3 high-resolution image pages)

PDF to Word:
- Use test-text-selectable.pdf to test selectable-text extraction.
- Use test-scanned-image-only.pdf to confirm the OCR limitation message.

Upload validation error:
- invalid-fake.jpg is intentionally not a real image and should be rejected.

Generated PDF checks:
${pdfChecks.join("\n")}
`;
await fs.writeFile(outputPath("README.txt"), readme, "utf8");

const files = (await fs.readdir(outputDir)).sort();
console.log(`Created ${files.length} test assets in ${outputDir}`);
console.log(files.join("\n"));
