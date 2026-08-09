import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { PDFDocument } from "pdf-lib";

const require = createRequire(import.meta.url);
const { createCanvas, DOMMatrix, ImageData, Path2D } = require("@napi-rs/canvas");
globalThis.DOMMatrix = DOMMatrix;
globalThis.ImageData = ImageData;
globalThis.Path2D = Path2D;
const sharp = require("sharp");
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

const assetsDir = path.resolve("D:/Pictures/Camera Roll/imgtopdf-test-assets");
const renderDir = path.resolve("tmp/test-asset-renders");
await fs.mkdir(renderDir, { recursive: true });

async function readPdf(name) {
  const bytes = await fs.readFile(path.join(assetsDir, name));
  const document = await PDFDocument.load(bytes);
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(bytes), disableWorker: true }).promise;
  let text = "";
  for (let index = 1; index <= pdf.numPages; index += 1) {
    const page = await pdf.getPage(index);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str ?? "").join(" ");
  }
  return { pageCount: document.getPageCount(), textLength: text.trim().length, pdf };
}

async function renderFirstPage(name, outputName) {
  const bytes = await fs.readFile(path.join(assetsDir, name));
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(bytes), disableWorker: true }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 1 });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
  await fs.writeFile(path.join(renderDir, outputName), canvas.toBuffer("image/png"));
}

const imageNames = ["test-jpg-01.jpg", "test-jpg-02.jpg", "test-png-transparent.png", "test-webp.webp", "test-tif.tiff"];
const imageResults = [];
for (const name of imageNames) {
  const metadata = await sharp(path.join(assetsDir, name)).metadata();
  imageResults.push(`${name}: ${metadata.format} ${metadata.width}x${metadata.height}`);
}

const textPdf = await readPdf("test-text-selectable.pdf");
const scannedPdf = await readPdf("test-scanned-image-only.pdf");
const compressionPdf = await readPdf("test-compression-source.pdf");
await renderFirstPage("test-text-selectable.pdf", "test-text-selectable-page-1.png");
await renderFirstPage("test-scanned-image-only.pdf", "test-scanned-image-only-page-1.png");
await renderFirstPage("test-compression-source.pdf", "test-compression-source-page-1.png");

console.log(imageResults.join("\n"));
console.log(`test-text-selectable.pdf: ${textPdf.pageCount} pages, ${textPdf.textLength} extracted characters`);
console.log(`test-scanned-image-only.pdf: ${scannedPdf.pageCount} pages, ${scannedPdf.textLength} extracted characters`);
console.log(`test-compression-source.pdf: ${compressionPdf.pageCount} pages`);
console.log(`Rendered PDF previews: ${renderDir}`);
