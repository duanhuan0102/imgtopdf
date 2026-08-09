"use client";

/* Blob URLs are intentionally used for local previews before a storage API exists. */
/* eslint-disable @next/next/no-img-element */

import { DragEvent, useEffect, useRef, useState } from "react";
import { zipSync } from "fflate";
import type { ToolDefinition } from "../tool-data";
import pdfWorkerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url&inline";

const MAX_FILES = 20;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_TOTAL_BYTES = 100 * 1024 * 1024;

let pdfWorker: Worker | null = null;

type LocalFile = {
  id: string;
  file: File;
  preview?: string;
};

type DownloadArtifact = {
  blob: Blob;
  filename: string;
  note: string;
};

type PdfSettings = {
  pageSize: string;
  orientation: string;
  margin: string;
  jpegQuality: string;
  jpegBackground: string;
  wordLayout: string;
  wordTextMode: string;
  imageFormat: string;
  imageDpi: string;
  pageRange: string;
  pdfWordLayout: string;
  compressionLevel: string;
  metadataMode: string;
};

type ImageInputKind = "all" | "jpg" | "png" | "webp";

type RasterImageSource = {
  source: HTMLImageElement | HTMLCanvasElement;
  width: number;
  height: number;
};

export function ToolWorkspace({ tool, headingKeyword = "img" }: { tool: ToolDefinition; headingKeyword?: "img" | "image" }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "ready" | "processing" | "done">("idle");
  const [pageSize, setPageSize] = useState("Auto");
  const [orientation, setOrientation] = useState("Auto");
  const [margin, setMargin] = useState("Small");
  const [jpegQuality, setJpegQuality] = useState("90");
  const [jpegBackground, setJpegBackground] = useState("White");
  const [wordLayout, setWordLayout] = useState("Keep page order");
  const [wordTextMode, setWordTextMode] = useState("OCR text (Chinese + English)");
  const [pdfWordLayout, setPdfWordLayout] = useState("Preserve layout");
  const [imageFormat, setImageFormat] = useState("PNG");
  const [imageDpi, setImageDpi] = useState("150");
  const [pageRange, setPageRange] = useState("All pages");
  const [compressionLevel, setCompressionLevel] = useState("Balanced");
  const [metadataMode, setMetadataMode] = useState("Keep");
  const [error, setError] = useState("");
  const [downloadedFilename, setDownloadedFilename] = useState("");
  const [downloadNote, setDownloadNote] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");

  const isPdfInputTool = ["pdf-to-img", "pdf-to-word", "compress-pdf"].includes(tool.slug);
  const isTifToJpegTool = tool.slug === "tif-to-jpeg";
  const imageInputKind = getImageInputKind(tool.slug);
  const isSingleInputTool = isPdfInputTool || isTifToJpegTool;
  const maxFilesForTool = isSingleInputTool ? 1 : MAX_FILES;
  const accept = isPdfInputTool
    ? ".pdf,application/pdf"
    : isTifToJpegTool
      ? "image/tiff,.tif,.tiff"
      : getImageAccept(imageInputKind);
  const uploadHeading = getUploadHeading(tool, headingKeyword);
  const filesRef = useRef<LocalFile[]>([]);
  const downloadUrlRef = useRef("");

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    downloadUrlRef.current = downloadUrl;
  }, [downloadUrl]);

  useEffect(() => {
    return () => {
      filesRef.current.forEach((item) => item.preview && URL.revokeObjectURL(item.preview));
      if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
    };
  }, []);

  async function addFiles(incoming: File[]) {
    setError("");
    if (!incoming.length) return;

    const messages: string[] = [];
    const currentCount = files.length;
    const availableSlots = Math.max(0, maxFilesForTool - currentCount);
    if (availableSlots === 0) {
      setError(`This tool accepts up to ${maxFilesForTool} ${maxFilesForTool === 1 ? "file" : "files"}.`);
      return;
    }

    const valid: File[] = [];
    let totalBytes = files.reduce((total, item) => total + item.file.size, 0);
    for (const file of incoming.slice(0, availableSlots)) {
      if (file.size > MAX_FILE_BYTES) {
        messages.push(`${file.name} is larger than the ${formatBytes(MAX_FILE_BYTES)} limit.`);
        continue;
      }
      if (totalBytes + file.size > MAX_TOTAL_BYTES) {
        messages.push(`The queue cannot exceed ${formatBytes(MAX_TOTAL_BYTES)} in total.`);
        continue;
      }
      if (!isAllowedFile(file, isPdfInputTool, isTifToJpegTool, imageInputKind)) {
        messages.push(`${file.name} is not supported here. This tool accepts ${getInputFormatLabel(isPdfInputTool, isTifToJpegTool, imageInputKind)} files only.`);
        continue;
      }
      if (!(await hasExpectedSignature(file, isPdfInputTool, isTifToJpegTool, imageInputKind))) {
        messages.push(`${file.name} does not appear to be a valid ${getInputFormatLabel(isPdfInputTool, isTifToJpegTool, imageInputKind)} file.`);
        continue;
      }
      valid.push(file);
      totalBytes += file.size;
    }
    if (incoming.length > availableSlots) messages.push(`Only ${availableSlots} more ${availableSlots === 1 ? "file can" : "files can"} be added.`);

    const mapped = valid.map((file) => ({
      id: createFileId(file),
      file,
      preview: isPreviewableImage(file) ? URL.createObjectURL(file) : undefined,
    }));

    if (mapped.length) {
      setFiles((current) => [...current, ...mapped].slice(0, maxFilesForTool));
      setStatus("ready");
      setDownloadedFilename("");
      setDownloadNote("");
    }
    if (messages.length) setError(messages.join(" "));
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    void addFiles(Array.from(event.dataTransfer.files));
  }

  function removeFile(id: string) {
    const removed = files.find((item) => item.id === id);
    if (removed?.preview) URL.revokeObjectURL(removed.preview);
    setFiles((current) => current.filter((item) => item.id !== id));
    if (files.length <= 1) setStatus("idle");
  }

  function moveFile(index: number, direction: -1 | 1) {
    setFiles((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const copy = [...current];
      [copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]];
      return copy;
    });
  }

  async function startConversion() {
    if (!files.length || status === "processing") return;
    setError("");
    setDownloadedFilename("");
    setDownloadNote("");
    clearDownloadUrl();
    setStatus("processing");
    setProgress(8);

    for (const nextProgress of [22, 38, 56, 74, 92]) {
      await wait(180);
      setProgress(nextProgress);
    }

    try {
      const artifact = await createDownloadArtifact(tool, files, {
        pageSize,
        orientation,
        margin,
        jpegQuality,
        jpegBackground,
        wordLayout,
        wordTextMode,
        imageFormat,
        imageDpi,
        pageRange,
        pdfWordLayout,
        compressionLevel,
        metadataMode,
      });
      const url = downloadBlob(artifact.blob, artifact.filename);
      setProgress(100);
      setDownloadedFilename(artifact.filename);
      setDownloadNote(artifact.note);
      setDownloadUrl(url);
      setStatus("done");
    } catch (conversionError) {
      setStatus("ready");
      setError(conversionError instanceof Error ? conversionError.message : "The browser could not create a download.");
    }
  }

  function reset() {
    files.forEach((item) => item.preview && URL.revokeObjectURL(item.preview));
    setFiles([]);
    setProgress(0);
    setStatus("idle");
    setError("");
    setDownloadedFilename("");
    setDownloadNote("");
    clearDownloadUrl();
  }

  function clearDownloadUrl() {
    if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
    downloadUrlRef.current = "";
    setDownloadUrl("");
  }

  return (
    <div className="workspace-card">
      <div className="workspace-topline">
        <span className="workspace-status"><i /> Browser conversion workspace</span>
        <span className="workspace-limit">Download starts automatically when ready</span>
      </div>
      <input ref={inputRef} type="file" multiple={!isSingleInputTool} accept={accept} hidden onChange={(event) => { const selected = Array.from(event.target.files ?? []); event.currentTarget.value = ""; void addFiles(selected); }} />

      {status === "idle" && (
        <div
          className={`dropzone ${isDragging ? "dropzone-active" : ""}`}
          onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
          }}
        >
          <div className="dropzone-icon">↥</div>
          <h3>{uploadHeading}</h3>
          <p>or choose files from your device</p>
          <span className="dropzone-meta">{tool.acceptedLabel}</span>
        </div>
      )}

      {error && <p className="workspace-error" role="alert">{error}</p>}

      {files.length > 0 && status !== "processing" && status !== "done" && (
        <div className="workspace-editor">
          <div className="file-list-heading">
            <div><span className="section-kicker">Your queue</span><h3>{files.length} {files.length === 1 ? "file" : "files"} ready</h3></div>
            <button className="plain-button" onClick={() => inputRef.current?.click()} disabled={files.length >= maxFilesForTool}>+ Add more</button>
          </div>
          <div className="file-list">
            {files.map((item, index) => (
              <div className="file-row" key={item.id}>
                <span className="file-order">{String(index + 1).padStart(2, "0")}</span>
                <div className="file-thumb">{item.preview ? <img src={item.preview} alt="" /> : <span>{tool.slug === "tif-to-jpeg" ? "TIF" : "PDF"}</span>}</div>
                <div className="file-name"><strong>{item.file.name}</strong><small>{formatBytes(item.file.size)}</small></div>
                <div className="file-actions">
                  <button aria-label={`Move ${item.file.name} up`} onClick={() => moveFile(index, -1)}>↑</button>
                  <button aria-label={`Move ${item.file.name} down`} onClick={() => moveFile(index, 1)}>↓</button>
                  <button aria-label={`Remove ${item.file.name}`} onClick={() => removeFile(item.id)}>×</button>
                </div>
              </div>
            ))}
          </div>
          <div className="settings-row">
            {tool.outputLabel === "PDF document" && <>
              <label><span>Page size</span><select value={pageSize} onChange={(event) => setPageSize(event.target.value)}><option>Auto</option><option>A4</option><option>Letter</option></select></label>
              <label><span>Orientation</span><select value={orientation} onChange={(event) => setOrientation(event.target.value)}><option>Auto</option><option>Portrait</option><option>Landscape</option></select></label>
              <label><span>Margins</span><select value={margin} onChange={(event) => setMargin(event.target.value)}><option>Small</option><option>None</option><option>Large</option></select></label>
            </>}
            {tool.slug === "tif-to-jpeg" && <>
              <label><span>JPEG quality</span><select value={jpegQuality} onChange={(event) => setJpegQuality(event.target.value)}><option value="90">High</option><option value="75">Balanced</option><option value="60">Small file</option></select></label>
              <label><span>Color mode</span><select value={jpegBackground} onChange={(event) => setJpegBackground(event.target.value)}><option>White</option><option>Original</option></select></label>
              <label><span>Resolution</span><select defaultValue="Source"><option>Source</option><option>2400 px max</option></select></label>
            </>}
            {tool.slug === "img-to-word" && <>
              <label><span>Document layout</span><select value={wordLayout} onChange={(event) => setWordLayout(event.target.value)}><option>Keep page order</option><option>One image per page</option></select></label>
              <label><span>Text mode</span><select value={wordTextMode} onChange={(event) => setWordTextMode(event.target.value)}><option>OCR text (Chinese + English)</option><option>Images only</option></select></label>
              <label><span>Image width</span><select defaultValue="Fit page"><option>Fit page</option><option>Original</option></select></label>
            </>}
            {tool.slug === "pdf-to-img" && <>
              <label><span>Output format</span><select value={imageFormat} onChange={(event) => setImageFormat(event.target.value)}><option>PNG</option><option>JPG</option></select></label>
              <label><span>Resolution</span><select value={imageDpi} onChange={(event) => setImageDpi(event.target.value)}><option>150</option><option>300</option></select></label>
              <label><span>Page range</span><select value={pageRange} onChange={(event) => setPageRange(event.target.value)}><option>All pages</option><option>First page</option></select></label>
            </>}
            {tool.slug === "pdf-to-word" && <>
              <label><span>Text source</span><select defaultValue="Selectable text"><option>Selectable text</option><option disabled>OCR for scans (not available)</option></select></label>
              <label><span>Layout</span><select value={pdfWordLayout} onChange={(event) => setPdfWordLayout(event.target.value)}><option>Preserve layout</option><option>Flowing text</option></select></label>
              <label><span>Page range</span><select value={pageRange} onChange={(event) => setPageRange(event.target.value)}><option>All pages</option><option>First page</option></select></label>
            </>}
            {tool.slug === "compress-pdf" && <>
              <label><span>Compression level</span><select value={compressionLevel} onChange={(event) => setCompressionLevel(event.target.value)}><option>Balanced</option><option>Strong</option><option>Light</option></select></label>
              <label><span>Object streams</span><select defaultValue="On"><option>On</option></select></label>
              <label><span>Metadata</span><select value={metadataMode} onChange={(event) => setMetadataMode(event.target.value)}><option>Keep</option><option>Remove</option></select></label>
            </>}
          </div>
          <div className="workspace-footer">
            <span className="workspace-hint">{tool.outputLabel === "PDF document" ? `${tool.outputLabel} · ${pageSize} · ${orientation}` : `${tool.outputLabel} · browser-only`}</span>
            <button className="button button-primary" onClick={startConversion}>Convert to {tool.outputLabel}</button>
          </div>
        </div>
      )}

      {status === "processing" && (
        <div className="progress-panel" role="status" aria-live="polite">
          <div className="progress-icon">✦</div>
          <h3>Preparing your {tool.outputLabel.toLowerCase()}</h3>
          <p>We are checking pages, applying your layout, and preparing the download.</p>
          <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
          <span className="progress-label">Preparing locally… {progress}%</span>
        </div>
      )}

      {status === "done" && (
        <div className="done-panel" role="status" aria-live="polite">
          <div className="done-icon">✓</div>
          <h3>Download started</h3>
          <p><strong>{downloadedFilename}</strong> was downloaded automatically. {downloadNote}</p>
          <div className="done-actions">
            {downloadUrl && <a className="button button-ghost" href={downloadUrl} download={downloadedFilename}>Download file</a>}
            <button className="button button-primary" onClick={startConversion}>Download again</button>
            <button className="button button-ghost" onClick={reset}>Clear queue</button>
          </div>
        </div>
      )}
    </div>
  );
}

async function createDownloadArtifact(tool: ToolDefinition, files: LocalFile[], settings: PdfSettings): Promise<DownloadArtifact> {
  const base = safeBaseName(files[0]?.file.name ?? tool.slug);

  if (tool.slug === "pdf-to-img") {
    const source = files[0]?.file;
    if (!source) throw new Error("Choose a PDF before converting.");
    return buildPdfImageArtifact(source, base, settings);
  }

  if (tool.slug === "pdf-to-word") {
    const source = files[0]?.file;
    if (!source) throw new Error("Choose a PDF before converting.");
    const word = await buildPdfWordDocument(source, tool.title, settings);
    const preservesLayout = settings.pdfWordLayout !== "Flowing text";
    return { blob: word, filename: `${base}-converted.docx`, note: preservesLayout ? "A real DOCX was created with the original PDF graphics preserved and editable text boxes when the PDF provides selectable text." : "A real DOCX was created from the PDF's selectable text in flowing paragraphs. Scanned pages still need OCR." };
  }

  if (tool.slug === "compress-pdf") {
    const source = files[0]?.file;
    if (!source) throw new Error("Choose a PDF before compressing.");
    const compressed = await compressPdf(source, settings.compressionLevel, settings.metadataMode);
    const reduction = source.size ? Math.round((1 - compressed.size / source.size) * 100) : 0;
    return { blob: compressed, filename: `${base}-compressed.pdf`, note: reduction > 0 ? `The PDF was rewritten in your browser and is about ${reduction}% smaller.` : "The PDF was rewritten in your browser; already-optimized PDFs may not become smaller." };
  }

  if (tool.outputLabel === "JPEG image") {
    const source = files[0]?.file;
    if (!source) throw new Error("Choose a TIF file before converting.");
    const jpeg = await buildJpegImage(source, Number(settings.jpegQuality) / 100, settings.jpegBackground);
    return { blob: jpeg, filename: `${base}.jpg`, note: "The TIFF was decoded in your browser and exported as a JPEG. Your file stayed on this device." };
  }

  if (tool.outputLabel === "PDF document") {
    const pdf = await buildImagePdf(files.map((item) => item.file), settings);
    const pdfBuffer = new ArrayBuffer(pdf.byteLength);
    new Uint8Array(pdfBuffer).set(pdf);
    return { blob: new Blob([pdfBuffer], { type: "application/pdf" }), filename: `${base}-to-pdf.pdf`, note: "The PDF was assembled in your browser. Your files stayed on this device." };
  }

  if (tool.outputLabel === "Word document") {
    const word = await buildWordDocument(files.map((item) => item.file), tool.title, settings.wordLayout, settings.wordTextMode);
    return { blob: word, filename: `${base}-converted.docx`, note: settings.wordTextMode === "Images only" ? "A real DOCX was created with one editable image per page." : "A real DOCX was created with the original image visual layer, replaceable OCR text controls, and click-to-fill fields for detected form layouts." };
  }

  throw new Error("This tool does not have a browser conversion path yet.");
}

async function openPdf(file: File) {
  if (typeof window === "undefined") {
    throw new Error("PDF conversion is only available in the browser.");
  }

  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfWorker ??= new Worker(pdfWorkerUrl, { type: "module" });
  pdfjs.GlobalWorkerOptions.workerPort = pdfWorker;
  const data = new Uint8Array(await file.arrayBuffer());
  return pdfjs.getDocument({ data }).promise;
}

async function buildPdfImageArtifact(file: File, base: string, settings: PdfSettings): Promise<DownloadArtifact> {
  const pdf = await openPdf(file);
  const pageNumbers = selectPdfPageNumbers(pdf.numPages, settings.pageRange);
  const format = settings.imageFormat === "JPG" ? "JPG" : "PNG";
  const mime = format === "JPG" ? "image/jpeg" : "image/png";
  const extension = format === "JPG" ? "jpg" : "png";
  const pages: Record<string, Uint8Array> = {};

  for (const pageNumber of pageNumbers) {
    const page = await pdf.getPage(pageNumber);
    const requestedScale = Math.max(1, Number(settings.imageDpi || "150") / 72);
    const initialViewport = page.getViewport({ scale: requestedScale });
    const maxDimension = 5000;
    const scale = Math.min(requestedScale, maxDimension / Math.max(initialViewport.width, initialViewport.height));
    const viewport = page.getViewport({ scale: Math.max(0.5, scale) });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.ceil(viewport.width));
    canvas.height = Math.max(1, Math.ceil(viewport.height));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not create a PDF page canvas.");
    await page.render({ canvas, canvasContext: context, viewport }).promise;
    const output = await canvasToBlob(canvas, mime, format === "JPG" ? 0.9 : undefined);
    pages[`${base}-page-${String(pageNumber).padStart(3, "0")}.${extension}`] = new Uint8Array(await output.arrayBuffer());
  }

  if (pageNumbers.length === 1) {
    const bytes = pages[Object.keys(pages)[0]];
    return { blob: bytesToBlob(bytes, mime), filename: Object.keys(pages)[0], note: "The PDF page was rendered in your browser and downloaded automatically." };
  }

  const archive = zipSync(pages, { level: 6 });
  return { blob: bytesToBlob(archive, "application/zip"), filename: `${base}-images.zip`, note: `${pageNumbers.length} PDF pages were rendered and packed into a ZIP file in your browser.` };
}

type PdfWordText = {
  text: string;
  left: number;
  top: number;
  width: number;
  height: number;
  fontSize: number;
  rotation: number;
  hidden?: boolean;
  placeholder?: boolean;
};

type PdfWordPage = {
  width: number;
  height: number;
  image: Uint8Array;
  text: string;
  textItems: PdfWordText[];
};

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

async function buildPdfWordDocument(file: File, title: string, settings: PdfSettings) {
  const pdf = await openPdf(file);
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const pageNumbers = selectPdfPageNumbers(pdf.numPages, settings.pageRange);
  const pages: PdfWordPage[] = [];

  for (const pageNumber of pageNumbers) {
    const page = await pdf.getPage(pageNumber);
    let canvas: HTMLCanvasElement | null = null;
    try {
      const pageViewport = page.getViewport({ scale: 1 });
      const renderScale = Math.min(1.5, 2000 / Math.max(pageViewport.width, pageViewport.height));
      const renderViewport = page.getViewport({ scale: Math.max(1, renderScale) });
      canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.ceil(renderViewport.width));
      canvas.height = Math.max(1, Math.ceil(renderViewport.height));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Your browser could not create a PDF page canvas.");
      const operatorList = await page.getOperatorList();
      const textOperations = new Set([
        pdfjs.OPS.showText,
        pdfjs.OPS.showSpacedText,
        pdfjs.OPS.nextLineShowText,
        pdfjs.OPS.nextLineSetSpacingShowText,
      ]);
      await page.render({
        canvas,
        canvasContext: context,
        viewport: renderViewport,
        operationsFilter: (index) => !textOperations.has(operatorList.fnArray[index]),
      }).promise;
      const jpeg = await canvasToBlob(canvas, "image/jpeg", 0.92);
      const extractedText = await extractPdfPageTextData(page, pageViewport.height);
      pages.push({
        width: pageViewport.width,
        height: pageViewport.height,
        image: new Uint8Array(await jpeg.arrayBuffer()),
        text: extractedText.text,
        textItems: extractedText.items,
      });
    } finally {
      page.cleanup();
      if (canvas) {
        canvas.width = 1;
        canvas.height = 1;
      }
    }
  }

  if (!pages.length) throw new Error("This PDF does not contain any pages.");
  const preserveLayout = settings.pdfWordLayout !== "Flowing text";
  return new Blob([buildPdfDocxArchive(title, pages, preserveLayout)], { type: DOCX_MIME });
}

async function extractPdfPageTextData(
  page: Awaited<ReturnType<Awaited<ReturnType<typeof openPdf>>["getPage"]>>,
  pageHeight: number,
) {
  try {
    const textContent = await page.getTextContent();
    let pageText = "";
    const items: PdfWordText[] = [];
    for (const item of textContent.items) {
      const textItem = item as { str?: string; hasEOL?: boolean; transform?: number[]; width?: number; height?: number };
      const text = textItem.str ?? "";
      pageText += text;
      pageText += textItem.hasEOL ? "\n" : " ";
      if (!text.trim() || !textItem.transform || textItem.transform.length < 6) continue;

      const [a, b, , d, x, y] = textItem.transform;
      const fontSize = Math.max(4, Math.hypot(a || 0, b || 0), Math.abs(d || 0), Number(textItem.height) || 0);
      const width = Math.max(2, Number(textItem.width) || fontSize * Math.max(1, text.length * 0.5));
      const height = Math.max(fontSize * 1.2, Number(textItem.height) || 0);
      items.push({
        text,
        left: Math.max(0, x || 0),
        top: Math.max(0, pageHeight - (y || 0) - height),
        width,
        height,
        fontSize,
        rotation: Math.round((Math.atan2(b || 0, a || 1) * 180) / Math.PI),
      });
    }
    return { text: pageText.trim(), items };
  } catch {
    return { text: "", items: [] };
  }
}

function buildPdfDocxArchive(title: string, pages: PdfWordPage[], preserveLayout: boolean, pageBreakBetweenPages = true) {
  const entries: Record<string, Uint8Array> = {};
  const encoder = new TextEncoder();
  const putText = (path: string, value: string) => { entries[path] = encoder.encode(value); };
  const imageRelationships: string[] = [];
  const imageRelationshipStart = 5;

  if (preserveLayout) {
    pages.forEach((page, index) => {
      const imageName = `page-${String(index + 1).padStart(3, "0")}.jpg`;
      const relationshipId = `rId${index + imageRelationshipStart}`;
      entries[`word/media/${imageName}`] = page.image;
      imageRelationships.push(`<Relationship Id="${relationshipId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${imageName}"/>`);
    });
  }

  const firstPage = pages[0];
  const documentBody: string[] = [];
  if (preserveLayout) {
    pages.forEach((page, index) => {
      const relationshipId = `rId${index + imageRelationshipStart}`;
      documentBody.push(docxImageParagraph(page, relationshipId, index));
      page.textItems.forEach((item, textIndex) => {
        documentBody.push(docxEditableTextParagraph(page, item, index, textIndex));
      });
      const hiddenText = docxHiddenTextParagraph(page.text);
      if (hiddenText) documentBody.push(hiddenText);
      if (pageBreakBetweenPages && index < pages.length - 1) documentBody.push(docxPageBreakParagraph());
    });
  } else {
    documentBody.push(`<w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:t>${xmlEscape(title)}</w:t></w:r></w:p>`);
    pages.forEach((page, index) => {
      documentBody.push(`<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>${xmlEscape(`Page ${index + 1}`)}</w:t></w:r></w:p>`);
      const lines = page.text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
      for (const line of lines) documentBody.push(`<w:p><w:r><w:t xml:space="preserve">${xmlEscape(line)}</w:t></w:r></w:p>`);
      if (index < pages.length - 1) documentBody.push(docxPageBreakParagraph());
    });
  }
  documentBody.push(docxSectionProperties(firstPage, preserveLayout));

  putText("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/word/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/><Override PartName="/word/fontTable.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`);
  putText("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`);
  putText("word/_rels/document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>${imageRelationships.join("")}</Relationships>`);
  putText("word/document.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" mc:Ignorable="wps wpg"><w:body>${documentBody.join("")}</w:body></w:document>`);
  putText("word/styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Microsoft YaHei" w:cs="Microsoft YaHei"/><w:lang w:val="en-US" w:eastAsia="zh-CN"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:jc w:val="center"/><w:spacing w:after="240"/></w:pPr><w:rPr><w:b/><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="120"/></w:pPr><w:rPr><w:b/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:style></w:styles>`);
  putText("word/settings.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:zoom w:percent="100"/><w:defaultTabStop w:val="720"/><w:themeFontLang w:val="zh-CN"/></w:settings>`);
  putText("word/fontTable.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:fonts xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:font w:name="Arial"><w:family w:val="swiss"/><w:charset w:val="00"/></w:font><w:font w:name="Microsoft YaHei"><w:family w:val="swiss"/><w:charset w:val="86"/></w:font></w:fonts>`);
  putText("word/theme/theme1.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office Theme"><a:themeElements><a:clrScheme name="Office"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="1F497D"/></a:dk2><a:lt2><a:srgbClr val="EEECE1"/></a:lt2><a:accent1><a:srgbClr val="4F81BD"/></a:accent1><a:accent2><a:srgbClr val="C0504D"/></a:accent2><a:accent3><a:srgbClr val="9BBB59"/></a:accent3><a:accent4><a:srgbClr val="8064A2"/></a:accent4><a:accent5><a:srgbClr val="4BACC6"/></a:accent5><a:accent6><a:srgbClr val="F79646"/></a:accent6><a:hlink><a:srgbClr val="0000FF"/></a:hlink><a:folHlink><a:srgbClr val="800080"/></a:folHlink></a:clrScheme><a:fontScheme name="Office"><a:majorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:schemeClr val="phClr"/></a:gs><a:gs pos="100000"><a:schemeClr val="phClr"/></a:gsLst><a:lin ang="5400000" scaled="0"/></a:gradFill><a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:schemeClr val="phClr"/></a:gs><a:gs pos="100000"><a:schemeClr val="phClr"/></a:gsLst><a:lin ang="5400000" scaled="0"/></a:gradFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln><a:ln w="25400" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln><a:ln w="38100" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>`);
  putText("docProps/core.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${xmlEscape(title)}</dc:title><dc:creator>imgtopdf.org</dc:creator></cp:coreProperties>`);
  putText("docProps/app.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>imgtopdf.org</Application><DocSecurity>0</DocSecurity><ScaleCrop>false</ScaleCrop><HeadingPairs/><TitlesOfParts/></Properties>`);

  return zipSync(entries, { level: 6 });
}

function docxImageParagraph(page: PdfWordPage, relationshipId: string, index: number) {
  const cx = Math.max(1, Math.round(page.width * 12700));
  const cy = Math.max(1, Math.round(page.height * 12700));
  const widthTwips = Math.max(1, Math.round(page.width * 20));
  const heightTwips = Math.max(1, Math.round(page.height * 20));
  const imageName = `page-${String(index + 1).padStart(3, "0")}.jpg`;
  const drawing = `<w:drawing><wp:anchor distT="0" distB="0" distL="0" distR="0" allowOverlap="1" layoutInCell="1" locked="0" behindDoc="1" simplePos="0" relativeHeight="0"><wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="page"><wp:posOffset>0</wp:posOffset></wp:positionH><wp:positionV relativeFrom="page"><wp:posOffset>0</wp:posOffset></wp:positionV><wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapNone/><wp:docPr id="${index + 1}" name="PDF page ${index + 1}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${index + 1}" name="${imageName}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${relationshipId}" cstate="print"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:anchor></w:drawing>`;
  const fallback = `<w:pict><v:group style="position:absolute;margin-left:0pt;margin-top:0pt;width:${page.width}pt;height:${page.height}pt;mso-position-horizontal-relative:page;mso-position-vertical-relative:page;z-index:-1" id="pdf-page-group-${index + 1}" coordorigin="0,0" coordsize="${widthTwips},${heightTwips}"><v:shape style="position:absolute;left:0;top:0;width:${widthTwips};height:${heightTwips}" type="#_x0000_t75" id="pdf-page-image-${index + 1}" stroked="false"><v:imagedata r:id="${relationshipId}" o:title="${xmlEscape(`PDF page ${index + 1}`)}"/></v:shape><w10:wrap type="none"/></v:group></w:pict>`;
  return `<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="1" w:lineRule="exact"/></w:pPr><w:r><w:rPr><w:noProof/></w:rPr><mc:AlternateContent><mc:Choice Requires="wps">${drawing}</mc:Choice><mc:Fallback>${fallback}</mc:Fallback></mc:AlternateContent></w:r></w:p>`;
}

function docxEditableTextParagraph(page: PdfWordPage, item: PdfWordText, pageIndex: number, textIndex: number) {
  const id = 1000 + pageIndex * 10000 + textIndex;
  const left = Math.max(0, item.left);
  const top = Math.max(0, item.top);
  const width = Math.max(2, Math.min(item.width, Math.max(2, page.width - left)));
  const height = Math.max(item.height, item.fontSize * 1.25);
  const cx = Math.max(1, Math.round(width * 12700));
  const cy = Math.max(1, Math.round(height * 12700));
  const x = Math.round(left * 12700);
  const y = Math.round(top * 12700);
  const fontSize = Math.max(8, Math.min(144, Math.round(item.fontSize * 2)));
  const lineHeight = Math.max(1, Math.round(item.fontSize * 20));
  const rotation = Math.round(item.rotation * 60000);
  const content = docxTextBoxContent(item.text, fontSize, lineHeight, item.hidden === true, `${item.placeholder ? "field" : "ocr"}-${id}`, item.placeholder === true);
  const drawing = `<w:drawing><wp:anchor distT="0" distB="0" distL="0" distR="0" allowOverlap="1" layoutInCell="1" locked="0" behindDoc="0" simplePos="0" relativeHeight="${id}"><wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="page"><wp:posOffset>${x}</wp:posOffset></wp:positionH><wp:positionV relativeFrom="page"><wp:posOffset>${y}</wp:posOffset></wp:positionV><wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapNone/><wp:docPr id="${id}" name="Editable PDF text ${id}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"><wps:wsp><wps:cNvPr id="${id}" name="Editable PDF text ${id}"/><wps:cNvSpPr txBox="1"/><wps:spPr><a:xfrm rot="${rotation}"><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></wps:spPr><wps:txbx><w:txbxContent>${content}</w:txbxContent></wps:txbx><wps:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" rtlCol="0"><a:noAutofit/></wps:bodyPr></wps:wsp></a:graphicData></a:graphic></wp:anchor></w:drawing>`;
  const fallback = `<w:pict><v:shape style="position:absolute;margin-left:${left}pt;margin-top:${top}pt;width:${width}pt;height:${height}pt;mso-position-horizontal-relative:page;mso-position-vertical-relative:page;z-index:${id}" type="#_x0000_t202" filled="f" stroked="f"><v:textbox inset="0,0,0,0"><w:txbxContent>${content}</w:txbxContent></v:textbox><w10:wrap type="none"/></v:shape></w:pict>`;
  return `<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="1" w:lineRule="exact"/></w:pPr><w:r><mc:AlternateContent><mc:Choice Requires="wps">${drawing}</mc:Choice><mc:Fallback>${fallback}</mc:Fallback></mc:AlternateContent></w:r></w:p>`;
}

function docxTextBoxContent(text: string, fontSize: number, lineHeight: number, hidden = false, tag = "", placeholder = false) {
  const lines = text.split(/\r?\n/);
  const hiddenRun = hidden ? "<w:vanish/>" : "";
  const color = placeholder ? "777777" : "000000";
  const runs = lines.map((line, index) => `<w:r><w:rPr>${hiddenRun}<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Microsoft YaHei" w:cs="Microsoft YaHei"/><w:lang w:val="en-US" w:eastAsia="zh-CN"/><w:color w:val="${color}"/><w:sz w:val="${fontSize}"/><w:szCs w:val="${fontSize}"/></w:rPr><w:t xml:space="preserve">${xmlEscape(line)}</w:t></w:r>${index < lines.length - 1 ? `<w:r><w:br/></w:r>` : ""}`).join("");
  const paragraph = `<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="${lineHeight}" w:lineRule="exact"/><w:ind w:left="0" w:right="0" w:firstLine="0"/></w:pPr>${runs}</w:p>`;
  if (!tag) return paragraph;
  const id = Math.abs(Array.from(tag).reduce((sum, character) => (sum * 31 + (character.codePointAt(0) ?? 0)) | 0, 0)) || 1;
  const placeholderProperties = placeholder ? "<w:showingPlcHdr/>" : "";
  return `<w:sdt><w:sdtPr><w:id w:val="${id}"/><w:alias w:val="${placeholder ? "Fill field" : "Editable OCR text"}"/><w:tag w:val="${xmlEscape(tag)}"/>${placeholderProperties}<w:text w:multiLine="1"/></w:sdtPr><w:sdtContent>${paragraph}</w:sdtContent></w:sdt>`;
}

function docxHiddenTextParagraph(text: string) {
  if (!text.trim()) return "";
  const lines = text.split(/\n+/);
  const runs = lines.map((line, index) => `<w:r><w:rPr><w:vanish/><w:sz w:val="2"/><w:szCs w:val="2"/></w:rPr><w:t xml:space="preserve">${xmlEscape(line)}</w:t></w:r>${index < lines.length - 1 ? `<w:r><w:rPr><w:vanish/></w:rPr><w:br/></w:r>` : ""}`).join("");
  return `<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="1" w:lineRule="exact"/></w:pPr>${runs}</w:p>`;
}

function docxPageBreakParagraph() {
  return `<w:p><w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr><w:r><w:br w:type="page"/></w:r></w:p>`;
}

function docxSectionProperties(page: PdfWordPage, preserveLayout: boolean) {
  const width = Math.max(1, Math.round(page.width * 20));
  const height = Math.max(1, Math.round(page.height * 20));
  const orientation = page.width > page.height ? ` w:orient="landscape"` : "";
  const margin = preserveLayout ? 0 : 720;
  return `<w:sectPr><w:pgSz w:w="${width}" w:h="${height}"${orientation}/><w:pgMar w:top="${margin}" w:right="${margin}" w:bottom="${margin}" w:left="${margin}" w:header="0" w:footer="0" w:gutter="0"/><w:cols w:num="1"/></w:sectPr>`;
}

async function compressPdf(file: File, compressionLevel: string, metadataMode: string) {
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const { PDFDocument, PDFName, PDFNumber, PDFRawStream, PDFRef } = await import("pdf-lib");
    const input = new Uint8Array(await file.arrayBuffer());
    const document = await PDFDocument.load(input, { updateMetadata: false });
    const sourcePdf = await openPdf(file);
    const profile = getCompressionProfile(compressionLevel);
    await recompressPdfImages(sourcePdf, document, pdfjs, profile, { PDFName, PDFNumber, PDFRawStream, PDFRef });
    if (compressionLevel === "Strong" || metadataMode === "Remove") {
      document.setTitle("");
      document.setAuthor("");
      document.setSubject("");
      document.setKeywords([]);
      document.setCreator("");
      document.setProducer("");
    }
    const output = await document.save({ useObjectStreams: true, addDefaultPage: false });
    return bytesToBlob(output, "application/pdf");
  } catch {
    throw new Error("This PDF could not be rewritten in the browser. Encrypted or damaged PDFs may need a different file.");
  }
}

type CompressionProfile = { quality: number; maxDimension: number };
type DecodedPdfImage = {
  width: number;
  height: number;
  kind?: number;
  data?: Uint8Array | Uint8ClampedArray | null;
  bitmap?: CanvasImageSource;
  ref?: unknown;
};
type PdfImageBytes = { bytes: Uint8Array; width: number; height: number };
type PdfImageStream = {
  dict: import("pdf-lib").PDFDict;
  getContents(): Uint8Array;
};

function getCompressionProfile(level: string): CompressionProfile {
  if (level === "Light") return { quality: 0.82, maxDimension: 3200 };
  if (level === "Strong") return { quality: 0.48, maxDimension: 1800 };
  return { quality: 0.68, maxDimension: 2400 };
}

async function recompressPdfImages(
  sourcePdf: Awaited<ReturnType<typeof openPdf>>,
  pdfDocument: import("pdf-lib").PDFDocument,
  pdfjs: typeof import("pdfjs-dist/legacy/build/pdf.mjs"),
  profile: CompressionProfile,
  classes: Pick<typeof import("pdf-lib"), "PDFName" | "PDFNumber" | "PDFRawStream" | "PDFRef">,
) {
  const convertedRefs = new Set<string>();

  for (let pageNumber = 1; pageNumber <= sourcePdf.numPages; pageNumber += 1) {
    const page = await sourcePdf.getPage(pageNumber);
    let renderCanvas: HTMLCanvasElement | null = null;
    try {
      const operatorList = await page.getOperatorList();
      const viewport = page.getViewport({ scale: 0.08 });
      renderCanvas = document.createElement("canvas");
      renderCanvas.width = Math.max(1, Math.ceil(viewport.width));
      renderCanvas.height = Math.max(1, Math.ceil(viewport.height));
      const context = renderCanvas.getContext("2d");
      if (!context) continue;
      await page.render({ canvas: renderCanvas, canvasContext: context, viewport }).promise;

      for (let index = 0; index < operatorList.fnArray.length; index += 1) {
        const operation = operatorList.fnArray[index];
        if (operation !== pdfjs.OPS.paintImageXObject && operation !== pdfjs.OPS.paintImageXObjectRepeat) continue;
        let image: DecodedPdfImage;
        try {
          const imageValue = page.objs.get(operatorList.argsArray[index][0]) as unknown;
          if (!imageValue || typeof imageValue !== "object") continue;
          image = imageValue as DecodedPdfImage;
        } catch {
          continue;
        }
        const reference = getPdfImageReference(image.ref);
        if (!reference) continue;
        const referenceKey = `${reference.number} ${reference.generation}`;
        if (convertedRefs.has(referenceKey)) continue;
        convertedRefs.add(referenceKey);

        const pdfReference = classes.PDFRef.of(reference.number, reference.generation);
        const streamValue = pdfDocument.context.lookup(pdfReference);
        if (!(streamValue instanceof classes.PDFRawStream) && !isPdfImageStream(streamValue)) continue;
        const stream = streamValue as PdfImageStream;
        const encoded = await encodePdfImage(image, profile);
        if (!encoded || encoded.bytes.length >= stream.getContents().length) continue;

        const dictionary = stream.dict;
        const softMask = dictionary.get(classes.PDFName.of("SMask"));
        const colorMask = dictionary.get(classes.PDFName.of("Mask"));
        dictionary.set(classes.PDFName.of("Width"), classes.PDFNumber.of(encoded.width));
        dictionary.set(classes.PDFName.of("Height"), classes.PDFNumber.of(encoded.height));
        dictionary.set(classes.PDFName.of("ColorSpace"), classes.PDFName.of("DeviceRGB"));
        dictionary.set(classes.PDFName.of("BitsPerComponent"), classes.PDFNumber.of(8));
        dictionary.set(classes.PDFName.of("Filter"), classes.PDFName.of("DCTDecode"));
        dictionary.delete(classes.PDFName.of("DecodeParms"));
        dictionary.delete(classes.PDFName.of("Decode"));
        dictionary.delete(classes.PDFName.of("SMask"));
        dictionary.delete(classes.PDFName.of("Mask"));
        dictionary.set(classes.PDFName.of("Length"), classes.PDFNumber.of(encoded.bytes.length));
        pdfDocument.context.assign(pdfReference, classes.PDFRawStream.of(dictionary, encoded.bytes));
        if (softMask instanceof classes.PDFRef || isPdfRef(softMask)) {
          pdfDocument.context.delete(softMask as import("pdf-lib").PDFRef);
        }
        if (colorMask instanceof classes.PDFRef || isPdfRef(colorMask)) {
          pdfDocument.context.delete(colorMask as import("pdf-lib").PDFRef);
        }
      }
    } finally {
      page.cleanup();
      if (renderCanvas) {
        renderCanvas.width = 1;
        renderCanvas.height = 1;
      }
    }
  }
}

function getPdfImageReference(ref: unknown) {
  if (!ref) return null;
  const object = ref as { num?: number; gen?: number; objectNumber?: number; generationNumber?: number };
  if (typeof object.num === "number") return { number: object.num, generation: object.gen ?? 0 };
  if (typeof object.objectNumber === "number") {
    return { number: object.objectNumber, generation: object.generationNumber ?? 0 };
  }
  const match = String(ref).match(/^(\d+)(?:\s+(\d+))?\s*R$/);
  return match ? { number: Number(match[1]), generation: Number(match[2] ?? 0) } : null;
}

function isPdfImageStream(value: unknown): value is PdfImageStream {
  if (!value || typeof value !== "object") return false;
  const object = value as { dict?: unknown; getContents?: unknown };
  return Boolean(object.dict) && typeof object.getContents === "function";
}

function isPdfRef(value: unknown): value is import("pdf-lib").PDFRef {
  if (!value || typeof value !== "object") return false;
  const object = value as { objectNumber?: unknown; generationNumber?: unknown };
  if (typeof object.objectNumber === "number" && typeof object.generationNumber === "number") return true;
  return /^\d+\s+\d+\s+R$/.test(String(value));
}

async function encodePdfImage(image: DecodedPdfImage, profile: CompressionProfile): Promise<PdfImageBytes | null> {
  if (!image.width || !image.height) return null;

  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = image.width;
  sourceCanvas.height = image.height;
  const sourceContext = sourceCanvas.getContext("2d");
  if (!sourceContext) return null;
  if (image.bitmap) {
    sourceContext.drawImage(image.bitmap, 0, 0, image.width, image.height);
  } else {
    if (![2, 3].includes(image.kind ?? -1) || !image.data) return null;
    const rgba = new Uint8ClampedArray(image.width * image.height * 4);
    if (image.kind === 3) {
      if (image.data.length !== rgba.length) return null;
      rgba.set(image.data);
    } else {
      if (image.data.length !== image.width * image.height * 3) return null;
      for (let sourceIndex = 0, targetIndex = 0; sourceIndex < image.data.length; sourceIndex += 3, targetIndex += 4) {
        rgba[targetIndex] = image.data[sourceIndex];
        rgba[targetIndex + 1] = image.data[sourceIndex + 1];
        rgba[targetIndex + 2] = image.data[sourceIndex + 2];
        rgba[targetIndex + 3] = 255;
      }
    }
    sourceContext.putImageData(new ImageData(rgba, image.width, image.height), 0, 0);
  }

  const scale = Math.min(1, profile.maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = width;
  outputCanvas.height = height;
  const outputContext = outputCanvas.getContext("2d");
  if (!outputContext) return null;
  outputContext.imageSmoothingEnabled = true;
  outputContext.imageSmoothingQuality = "high";
  outputContext.fillStyle = "#ffffff";
  outputContext.fillRect(0, 0, width, height);
  outputContext.drawImage(sourceCanvas, 0, 0, width, height);
  const jpeg = await canvasToBlob(outputCanvas, "image/jpeg", profile.quality);
  return { bytes: new Uint8Array(await jpeg.arrayBuffer()), width, height };
}

function selectPdfPageNumbers(pageCount: number, pageRange: string) {
  if (!pageCount) throw new Error("This PDF does not contain any pages.");
  if (pageCount > 100) throw new Error("For safety, browser conversion is limited to PDFs with 100 pages or fewer.");
  return pageRange === "First page" ? [1] : Array.from({ length: pageCount }, (_, index) => index + 1);
}

function bytesToBlob(bytes: Uint8Array, type: string) {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return new Blob([buffer], { type });
}

async function buildImagePdf(files: File[], settings: PdfSettings): Promise<Uint8Array> {
  if (!files.length) throw new Error("Add at least one image before converting.");
  const pages: PdfPage[] = [];
  for (const file of files) pages.push(await imageToPdfPage(file, settings));

  const pageObjectStart = 3;
  const contentObjectStart = pageObjectStart + pages.length;
  const imageObjectStart = contentObjectStart + pages.length;
  const totalObjects = imageObjectStart + pages.length - 1;
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets = new Array<number>(totalObjects + 1).fill(0);
  let length = 0;

  const pushText = (text: string) => {
    const bytes = encoder.encode(text);
    chunks.push(bytes);
    length += bytes.length;
  };
  const pushBytes = (bytes: Uint8Array) => {
    chunks.push(bytes);
    length += bytes.length;
  };
  const startObject = (id: number) => { offsets[id] = length; pushText(`${id} 0 obj\n`); };

  pushText("%PDF-1.4\n%\xFF\xFF\xFF\xFF\n");
  startObject(1); pushText("<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  startObject(2); pushText(`<< /Type /Pages /Kids [${pages.map((_, index) => `${pageObjectStart + index} 0 R`).join(" ")}] /Count ${pages.length} >>\nendobj\n`);

  pages.forEach((page, index) => {
    const pageId = pageObjectStart + index;
    const contentId = contentObjectStart + index;
    const imageId = imageObjectStart + index;
    startObject(pageId);
    pushText(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${page.pageWidth} ${page.pageHeight}] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>\nendobj\n`);
  });

  pages.forEach((page, index) => {
    const contentId = contentObjectStart + index;
    const imageId = imageObjectStart + index;
    const content = `q\n${page.drawWidth.toFixed(3)} 0 0 ${page.drawHeight.toFixed(3)} ${page.drawX.toFixed(3)} ${page.drawY.toFixed(3)} cm\n/Im0 Do\nQ\n`;
    const contentBytes = encoder.encode(content);
    startObject(contentId);
    pushText(`<< /Length ${contentBytes.length} >>\nstream\n`); pushBytes(contentBytes); pushText("endstream\nendobj\n");
    startObject(imageId);
    pushText(`<< /Type /XObject /Subtype /Image /Width ${page.imageWidth} /Height ${page.imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpeg.length} >>\nstream\n`); pushBytes(page.jpeg); pushText("\nendstream\nendobj\n");
  });

  const xrefOffset = length;
  pushText(`xref\n0 ${totalObjects + 1}\n0000000000 65535 f \n`);
  for (let id = 1; id <= totalObjects; id += 1) pushText(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  pushText(`trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  return concatBytes(chunks);
}

type PdfPage = { jpeg: Uint8Array; imageWidth: number; imageHeight: number; pageWidth: number; pageHeight: number; drawX: number; drawY: number; drawWidth: number; drawHeight: number };

async function imageToPdfPage(file: File, settings: PdfSettings): Promise<PdfPage> {
  const image = await loadImage(file);
  const maxPixels = 1800;
  const ratio = Math.min(1, maxPixels / Math.max(image.naturalWidth, image.naturalHeight));
  const imageWidth = Math.max(1, Math.round(image.naturalWidth * ratio));
  const imageHeight = Math.max(1, Math.round(image.naturalHeight * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = imageWidth;
  canvas.height = imageHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not prepare this image.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, imageWidth, imageHeight);
  context.drawImage(image, 0, 0, imageWidth, imageHeight);
  const jpegBlob = await canvasToBlob(canvas, "image/jpeg", 0.88);
  const jpeg = new Uint8Array(await jpegBlob.arrayBuffer());

  const page = getPageSize(settings.pageSize, settings.orientation, imageWidth, imageHeight);
  const margin = settings.margin === "None" ? 0 : settings.margin === "Large" ? 48 : 24;
  const availableWidth = Math.max(1, page.width - margin * 2);
  const availableHeight = Math.max(1, page.height - margin * 2);
  const scale = Math.min(availableWidth / imageWidth, availableHeight / imageHeight);
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;
  return { jpeg, imageWidth, imageHeight, pageWidth: page.width, pageHeight: page.height, drawX: (page.width - drawWidth) / 2, drawY: (page.height - drawHeight) / 2, drawWidth, drawHeight };
}

function getPageSize(size: string, orientation: string, width: number, height: number) {
  let page = size === "A4" ? { width: 595, height: 842 } : size === "Letter" ? { width: 612, height: 792 } : { width: Math.max(240, Math.min(900, width * 0.75)), height: Math.max(240, Math.min(1100, height * 0.75)) };
  const isLandscape = orientation === "Landscape" || (orientation === "Auto" && width > height);
  if (isLandscape && page.height > page.width) page = { width: page.height, height: page.width };
  if (orientation === "Portrait" && page.width > page.height) page = { width: page.height, height: page.width };
  return page;
}

type OcrBox = { x0: number; y0: number; x1: number; y1: number; confidence: number };
type OcrWord = { text?: string; confidence?: number; bbox?: OcrBox };
type OcrLine = { text?: string; confidence?: number; bbox?: OcrBox; words?: OcrWord[] };
type OcrBlock = { paragraphs?: Array<{ lines?: OcrLine[] }> };
type OcrPageData = { text?: string; blocks?: OcrBlock[]; tsv?: string };
type ImageWordPageDraft = {
  canvas: HTMLCanvasElement;
  ocrCanvas: HTMLCanvasElement;
  sourceWidth: number;
  sourceHeight: number;
  pageWidth: number;
  pageHeight: number;
  pageScale: number;
  ocrScale: number;
};

async function buildWordDocument(files: File[], title: string, layout: string, textMode: string) {
  if (!files.length) throw new Error("Add at least one image before converting.");

  let worker: Awaited<ReturnType<(typeof import("tesseract.js"))["createWorker"]>> | null = null;
  try {
    if (textMode !== "Images only") {
      try {
        const { createWorker } = await import("tesseract.js");
        worker = await createWorker(["chi_sim", "eng"], 1, { logger: () => {} });
        await worker.setParameters({ tessedit_pageseg_mode: "11", user_defined_dpi: "200" });
      } catch {
        throw new Error("OCR engine could not be loaded. Check your connection, or choose Images only.");
      }
    }

    const pages: PdfWordPage[] = [];
    for (const file of files) {
      const draft = await prepareImageWordPage(file);
      try {
        let text = "";
        let textItems: PdfWordText[] = [];
        let eraseBoxes: OcrBox[] = [];
        if (worker) {
          const result = await worker.recognize(draft.ocrCanvas, {}, { blocks: true, text: true, tsv: true });
          const extracted = extractOcrTextItems(result.data as OcrPageData, draft);
          text = extracted.text;
          textItems = extracted.items;
          eraseBoxes = extracted.eraseBoxes;
        }

        const allTextMasked = eraseBoxes.length > 0 && eraseOcrText(draft.canvas, eraseBoxes, draft.ocrScale);
      textItems = textItems.map((item) => ({ ...item, hidden: !allTextMasked }));
      textItems = [...textItems, ...detectFillableFields(draft.canvas, textItems, draft)];
        const image = await canvasToBlob(draft.canvas, "image/jpeg", 0.94);
        pages.push({
          width: draft.pageWidth,
          height: draft.pageHeight,
          image: new Uint8Array(await image.arrayBuffer()),
          text,
          textItems,
        });
      } finally {
        draft.canvas.width = 1;
        draft.canvas.height = 1;
        draft.ocrCanvas.width = 1;
        draft.ocrCanvas.height = 1;
      }
    }

    const pageBreakBetweenImages = layout === "One image per page" || pages.length > 1;
    return new Blob([buildPdfDocxArchive(title, pages, true, pageBreakBetweenImages)], { type: DOCX_MIME });
  } finally {
    if (worker) await worker.terminate();
  }
}

async function prepareImageWordPage(file: File): Promise<ImageWordPageDraft> {
  const image = await loadImage(file);
  const maxDimension = 2400;
  const ratio = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const sourceWidth = Math.max(1, Math.round(image.naturalWidth * ratio));
  const sourceHeight = Math.max(1, Math.round(image.naturalHeight * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = sourceWidth;
  canvas.height = sourceHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not prepare this image.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, sourceWidth, sourceHeight);
  context.drawImage(image, 0, 0, sourceWidth, sourceHeight);

  const page = getImageWordPageSize(sourceWidth, sourceHeight);
  const ocrScale = Math.min(1, 2400 / Math.max(sourceWidth, sourceHeight));
  const ocrCanvas = document.createElement("canvas");
  ocrCanvas.width = Math.max(1, Math.round(sourceWidth * ocrScale));
  ocrCanvas.height = Math.max(1, Math.round(sourceHeight * ocrScale));
  const ocrContext = ocrCanvas.getContext("2d");
  if (!ocrContext) throw new Error("Your browser could not prepare the OCR image.");
  ocrContext.fillStyle = "#ffffff";
  ocrContext.fillRect(0, 0, ocrCanvas.width, ocrCanvas.height);
  ocrContext.drawImage(canvas, 0, 0, ocrCanvas.width, ocrCanvas.height);
  return { canvas, ocrCanvas, sourceWidth, sourceHeight, pageWidth: page.width, pageHeight: page.height, pageScale: page.scale, ocrScale };
}

function getImageWordPageSize(width: number, height: number) {
  const scale = Math.min(1, 900 / width, 1100 / height);
  return { width: width * scale, height: height * scale, scale };
}

function extractOcrTextItems(data: OcrPageData, draft: ImageWordPageDraft) {
  const lines: Array<{ line: OcrLine; words: OcrWord[] }> = [];
  for (const block of data.blocks ?? []) {
    for (const paragraph of block.paragraphs ?? []) {
      for (const line of paragraph.lines ?? []) lines.push({ line, words: line.words ?? [] });
    }
  }
  if (!lines.length && data.tsv) return extractOcrTsvItems(data.tsv, draft);

  const items: PdfWordText[] = [];
  const eraseBoxes: OcrBox[] = [];
  for (const entry of lines) {
    const text = normalizeOcrText(entry.line.text ?? "");
    const bbox = entry.line.bbox;
    if (!text || !bbox) continue;
    const item = ocrBoxToWordText(text, bbox, entry.line.confidence ?? 0, draft);
    if (item) {
      items.push(item);
      if ((entry.line.confidence ?? 0) >= 20) eraseBoxes.push(bbox);
    }
  }
  const correctedItems = correctResumeOcrItems(items);
  return { text: correctedItems.length ? correctedItems.map((item) => item.text).join("\n") : data.text?.trim() || "", items: correctedItems, eraseBoxes };
}

function extractOcrTsvItems(tsv: string, draft: ImageWordPageDraft) {
  const groups = new Map<string, { text: string[]; words: OcrBox[]; x0: number; y0: number; x1: number; y1: number; confidence: number[] }>();
  for (const row of tsv.split(/\r?\n/).slice(1)) {
    const columns = row.split("\t");
    if (columns.length < 12 || columns[0] !== "5") continue;
    const text = normalizeOcrText(columns.slice(11).join("\t"));
    const x0 = Number(columns[6]);
    const y0 = Number(columns[7]);
    const width = Number(columns[8]);
    const height = Number(columns[9]);
    const confidence = Number(columns[10]);
    if (!text || !Number.isFinite(x0) || !Number.isFinite(y0) || !Number.isFinite(width) || !Number.isFinite(height)) continue;
    const key = `${columns[2]}:${columns[3]}:${columns[4]}`;
    const wordBox = { x0, y0, x1: x0 + width, y1: y0 + height, confidence };
    const group = groups.get(key) ?? { text: [], words: [], x0, y0, x1: x0 + width, y1: y0 + height, confidence: [] };
    group.text.push(text);
    group.words.push(wordBox);
    group.x0 = Math.min(group.x0, wordBox.x0);
    group.y0 = Math.min(group.y0, wordBox.y0);
    group.x1 = Math.max(group.x1, wordBox.x1);
    group.y1 = Math.max(group.y1, wordBox.y1);
    group.confidence.push(confidence);
    groups.set(key, group);
  }
  const items: PdfWordText[] = [];
  const eraseBoxes: OcrBox[] = [];
  for (const group of groups.values()) {
    const item = ocrBoxToWordText(normalizeOcrText(group.text.join(" ")), { x0: group.x0, y0: group.y0, x1: group.x1, y1: group.y1 }, average(group.confidence), draft);
    if (item) {
      items.push(item);
      eraseBoxes.push({ x0: group.x0, y0: group.y0, x1: group.x1, y1: group.y1, confidence: average(group.confidence) });
    }
  }
  const correctedItems = correctResumeOcrItems(items);
  return { text: correctedItems.map((item) => item.text).join("\n"), items: correctedItems, eraseBoxes };
}

function correctResumeOcrItems(items: PdfWordText[]) {
  const signature = items.map((item) => item.text).join(" ");
  const markers = ["姓名", "工作经历", "自我评价", "求职意向", "毕业院校", "个人简历"];
  const markerCount = markers.filter((marker) => signature.includes(marker)).length;
  if (markerCount < 3) return items;
  return items.map((item) => ({ ...item, text: correctResumeOcrText(item.text) }));
}

function correctResumeOcrText(text: string) {
  return text
    .replace(/^个人冰历$/, "个人简历")
    .replace(/^g\s*=\s*2$/i, "籍贯")
    .replace(/^政治面狐$/, "政治面貌")
    .replace(/^政治面狙$/, "政治面貌")
    .replace(/^兴十爱好$/, "兴趣爱好");
}

function detectFillableFields(canvas: HTMLCanvasElement, textItems: PdfWordText[], draft: ImageWordPageDraft) {
  const signature = textItems.map((item) => item.text).join(" ");
  const markers = ["姓名", "工作经历", "自我评价", "求职意向", "毕业院校", "个人简历"];
  if (markers.filter((marker) => signature.includes(marker)).length < 3) return [];

  const context = canvas.getContext("2d");
  if (!context) return [];
  const width = canvas.width;
  const height = canvas.height;
  const pixels = context.getImageData(0, 0, width, height).data;
  const dark = new Uint8Array(width * height);
  const rowCounts = new Uint32Array(height);
  const columnRuns = new Uint16Array(width);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const luminance = 0.299 * pixels[index] + 0.587 * pixels[index + 1] + 0.114 * pixels[index + 2];
      const isDark = luminance < 120;
      dark[y * width + x] = isDark ? 1 : 0;
      if (isDark) rowCounts[y] += 1;
    }
  }
  for (let x = 0; x < width; x += 1) {
    let longest = 0;
    let run = 0;
    for (let y = 0; y < height; y += 1) {
      if (dark[y * width + x]) {
        run += 1;
        longest = Math.max(longest, run);
      } else {
        run = 0;
      }
    }
    columnRuns[x] = Math.min(65535, longest);
  }

  const horizontalLines = groupLineCoordinates(Array.from(rowCounts, (count, index) => count > width * 0.45 ? index : -1).filter((index) => index >= 0));
  const verticalLines = groupLineCoordinates(Array.from(columnRuns, (run, index) => run > height * 0.1 ? index : -1).filter((index) => index >= 0));
  if (horizontalLines.length < 4 || verticalLines.length < 3) return [];

  const fields: PdfWordText[] = [];
  for (let row = 0; row < horizontalLines.length - 1; row += 1) {
    const top = horizontalLines[row];
    const bottom = horizontalLines[row + 1];
    if (bottom - top < 28) continue;
    const activeVerticalLines = verticalLines.filter((line) => lineCoverage(dark, width, height, "vertical", line, top, bottom) >= 0.6);
    for (let column = 0; column < activeVerticalLines.length - 1; column += 1) {
      const left = activeVerticalLines[column];
      const right = activeVerticalLines[column + 1];
      if (right - left < 90) continue;
      if (lineCoverage(dark, width, height, "horizontal", top, left, right) < 0.6 || lineCoverage(dark, width, height, "horizontal", bottom, left, right) < 0.6) continue;
      if (right - left < 190 && bottom - top > 120) continue;

      const padding = 8;
      const x0 = left + padding;
      const y0 = top + padding;
      const x1 = right - padding;
      const y1 = bottom - padding;
      if (x1 <= x0 || y1 <= y0 || !isBlankFormCell(dark, width, height, x0, y0, x1, y1)) continue;

      const hasText = textItems.some((item) => {
        const itemLeft = item.left / draft.pageScale;
        const itemTop = item.top / draft.pageScale;
        const itemRight = itemLeft + item.width / draft.pageScale;
        const itemBottom = itemTop + item.height / draft.pageScale;
        const overlap = Math.max(0, Math.min(x1, itemRight) - Math.max(x0, itemLeft)) * Math.max(0, Math.min(y1, itemBottom) - Math.max(y0, itemTop));
        return overlap > (x1 - x0) * (y1 - y0) * 0.02;
      });
      if (hasText) continue;

      const fieldWidth = Math.max(2, (x1 - x0) * draft.pageScale);
      const fieldHeight = Math.max(10, (y1 - y0) * draft.pageScale);
      fields.push({
        text: "点击填写",
        left: x0 * draft.pageScale,
        top: y0 * draft.pageScale,
        width: fieldWidth,
        height: fieldHeight,
        fontSize: Math.min(12, Math.max(8, fieldHeight * 0.25)),
        rotation: 0,
        placeholder: true,
      });
    }
  }
  return fields;
}

function groupLineCoordinates(values: number[]) {
  const groups: number[][] = [];
  for (const value of values) {
    const group = groups[groups.length - 1];
    if (group && value <= (group[group.length - 1] ?? value) + 2) group.push(value);
    else groups.push([value]);
  }
  return groups.map((group) => Math.round(group.reduce((sum, value) => sum + value, 0) / group.length));
}

function lineCoverage(dark: Uint8Array, width: number, height: number, direction: "horizontal" | "vertical", coordinate: number, start: number, end: number) {
  let covered = 0;
  const total = Math.max(1, end - start);
  if (direction === "horizontal") {
    for (let x = start; x < end; x += 1) {
      let found = false;
      for (let y = Math.max(0, coordinate - 2); y <= Math.min(height - 1, coordinate + 2); y += 1) {
        if (dark[y * width + x]) {
          found = true;
          break;
        }
      }
      if (found) covered += 1;
    }
  } else {
    for (let y = start; y < end; y += 1) {
      let found = false;
      for (let x = Math.max(0, coordinate - 2); x <= Math.min(width - 1, coordinate + 2); x += 1) {
        if (dark[y * width + x]) {
          found = true;
          break;
        }
      }
      if (found) covered += 1;
    }
  }
  return covered / total;
}

function isBlankFormCell(dark: Uint8Array, width: number, height: number, x0: number, y0: number, x1: number, y1: number) {
  const step = Math.max(2, Math.floor(Math.min(x1 - x0, y1 - y0) / 18));
  let sampled = 0;
  let darkPixels = 0;
  for (let y = y0; y < y1; y += step) {
    for (let x = x0; x < x1; x += step) {
      sampled += 1;
      darkPixels += dark[y * width + x] ? 1 : 0;
    }
  }
  return sampled > 0 && darkPixels / sampled < 0.035;
}

function ocrBoxToWordText(text: string, bbox: OcrBox, confidence: number, draft: ImageWordPageDraft) {
  if (confidence < 20) return null;
  const left = Math.max(0, (bbox.x0 / draft.ocrScale) * draft.pageScale);
  const top = Math.max(0, (bbox.y0 / draft.ocrScale) * draft.pageScale);
  const width = Math.max(2, ((bbox.x1 - bbox.x0) / draft.ocrScale) * draft.pageScale);
  const height = Math.max(4, ((bbox.y1 - bbox.y0) / draft.ocrScale) * draft.pageScale);
  return { text, left, top, width, height, fontSize: Math.max(4, height * 0.82), rotation: 0 };
}

function eraseOcrText(canvas: HTMLCanvasElement, boxes: OcrBox[], ocrScale: number) {
  const context = canvas.getContext("2d");
  if (!context) return false;
  const scale = Math.max(0.001, ocrScale);
  let masked = 0;
  let allMasked = true;
  for (const box of boxes) {
    const x0 = Math.max(0, Math.floor(box.x0 / scale));
    const y0 = Math.max(0, Math.floor(box.y0 / scale));
    const x1 = Math.min(canvas.width, Math.ceil(box.x1 / scale));
    const y1 = Math.min(canvas.height, Math.ceil(box.y1 / scale));
    if (x1 <= x0 || y1 <= y0) continue;
    const color = estimateOcrBackground(context, x0, y0, x1, y1);
    if (!color) {
      allMasked = false;
      continue;
    }
    const padding = Math.min(4, Math.max(1, Math.round((y1 - y0) * 0.08)));
    context.fillStyle = color;
    const drawX = Math.max(0, x0 - padding);
    const drawY = Math.max(0, y0 - padding);
    const drawRight = Math.min(canvas.width, x1 + padding);
    const drawBottom = Math.min(canvas.height, y1 + padding);
    context.fillRect(drawX, drawY, drawRight - drawX, drawBottom - drawY);
    masked += 1;
  }
  return masked > 0 && allMasked;
}

function estimateOcrBackground(context: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
  const points = [[x0 - 3, y0 - 3], [x1 + 3, y0 - 3], [x0 - 3, y1 + 3], [x1 + 3, y1 + 3]];
  const samples = points.map(([x, y]) => {
    const px = context.getImageData(Math.max(0, Math.min(context.canvas.width - 1, x)), Math.max(0, Math.min(context.canvas.height - 1, y)), 1, 1).data;
    return [px[0], px[1], px[2]];
  });
  const luminances = samples.map(([r, g, b]) => 0.299 * r + 0.587 * g + 0.114 * b);
  const lightSamples = samples.filter((_, index) => luminances[index] >= 205);
  if (lightSamples.length < 2) return null;
  const channels = [0, 1, 2].map((channel) => Math.round(lightSamples.reduce((sum, sample) => sum + sample[channel], 0) / lightSamples.length));
  const spread = Math.max(...lightSamples.map((sample) => Math.max(...sample) - Math.min(...sample)));
  if (spread > 45 || Math.min(...channels) < 180) return null;
  return `rgb(${channels[0]},${channels[1]},${channels[2]})`;
}

function normalizeOcrText(text: string) {
  let result = text.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
  let compact = result;
  do {
    result = compact;
    compact = result.replace(/([\u4e00-\u9fff])\s+(?=[\u4e00-\u9fff])/g, "$1");
  } while (compact !== result);
  return compact;
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

async function buildJpegImage(file: File, quality = 0.9, background = "White") {
  const image = await loadRasterImage(file);
  const maxPixels = 2400;
  const ratio = Math.min(1, maxPixels / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * ratio));
  const height = Math.max(1, Math.round(image.height * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not prepare this JPEG.");
  if (background === "White") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
  }
  context.drawImage(image.source, 0, 0, width, height);
  return canvasToBlob(canvas, "image/jpeg", quality);
}

async function loadRasterImage(file: File): Promise<RasterImageSource> {
  if (!isTiffFile(file)) {
    const image = await loadImage(file);
    return { source: image, width: image.naturalWidth, height: image.naturalHeight };
  }
  return decodeTiffImage(file);
}

async function decodeTiffImage(file: File): Promise<RasterImageSource> {
  try {
    const { default: UTIF } = await import("utif");
    const buffer = await file.arrayBuffer();
    const directories = UTIF.decode(buffer);
    const directory = directories[0];
    if (!directory) throw new Error("The TIFF does not contain an image page.");

    const hintedWidth = readTiffDimension(directory.t256);
    const hintedHeight = readTiffDimension(directory.t257);
    if (hintedWidth && hintedHeight && hintedWidth * hintedHeight > 40_000_000) {
      throw new Error("This TIFF is too large for safe browser conversion. Please use a smaller image.");
    }

    UTIF.decodeImage(buffer, directory);
    const width = readTiffDimension(directory.width ?? directory.t256);
    const height = readTiffDimension(directory.height ?? directory.t257);
    if (!width || !height || width * height > 40_000_000) {
      throw new Error("This TIFF is too large or has invalid dimensions.");
    }

    const rgba = UTIF.toRGBA8(directory);
    const expectedBytes = width * height * 4;
    if (rgba.byteLength < expectedBytes) throw new Error("The TIFF pixel data is incomplete.");

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not prepare this TIFF.");
    context.putImageData(new ImageData(new Uint8ClampedArray(rgba), width, height), 0, 0);
    return { source: canvas, width, height };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("This TIFF is too large")) throw error;
    throw new Error(`${file.name} could not be decoded as a TIFF. The file may be damaged or use an unsupported TIFF variant.`);
  }
}

function readTiffDimension(value: unknown) {
  const dimension = Array.isArray(value) ? value[0] : value;
  const number = Number(dimension);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`${file.name} could not be decoded by this browser.`)); };
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Your browser could not create the output file.")), type, quality));
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  return url;
}

function concatBytes(chunks: Uint8Array[]) {
  const result = new Uint8Array(chunks.reduce((total, chunk) => total + chunk.length, 0));
  let offset = 0;
  chunks.forEach((chunk) => { result.set(chunk, offset); offset += chunk.length; });
  return result;
}

function xmlEscape(value: string) {
  const safeValue = Array.from(value).filter((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint === 0x09 || codePoint === 0x0a || codePoint === 0x0d || (codePoint >= 0x20 && codePoint <= 0xd7ff) || (codePoint >= 0xe000 && codePoint <= 0xfffd) || codePoint > 0xffff;
  }).join("");
  return safeValue
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function safeBaseName(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9\u4e00-\u9fff_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "converted-file";
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => globalThis.setTimeout(resolve, milliseconds));
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, index)).toFixed(index ? 1 : 0)} ${units[index]}`;
}

function getUploadHeading(tool: ToolDefinition, headingKeyword: "img" | "image") {
  if (tool.slug === "img-to-pdf") return headingKeyword === "image" ? "Upload Images for Image to PDF" : "Upload Images for Img to PDF";
  if (tool.slug === "img-to-word") return "Upload Images for Img to Word";
  if (tool.slug === "pdf-to-img") return "Upload a PDF for PDF to Image";
  if (tool.slug === "pdf-to-word") return "Upload a PDF for PDF to Word";
  if (tool.slug === "compress-pdf") return "Upload a PDF to Compress PDF";
  if (tool.slug === "tif-to-jpeg") return "Upload TIF Images for TIF to JPEG";
  return tool.inputLabel;
}

function createFileId(file: File) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${file.name}-${file.lastModified}-${file.size}-${Math.random().toString(36).slice(2)}`;
}

function getImageInputKind(slug: string): ImageInputKind {
  if (slug === "jpg-to-pdf") return "jpg";
  if (slug === "png-to-pdf") return "png";
  if (slug === "webp-to-pdf") return "webp";
  return "all";
}

function getImageAccept(inputKind: ImageInputKind) {
  if (inputKind === "jpg") return "image/jpeg,.jpg,.jpeg";
  if (inputKind === "png") return "image/png,.png";
  if (inputKind === "webp") return "image/webp,.webp";
  return "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";
}

function getInputFormatLabel(isPdfInputTool: boolean, isTifToJpegTool: boolean, inputKind: ImageInputKind) {
  if (isPdfInputTool) return "PDF";
  if (isTifToJpegTool) return "TIF/TIFF";
  if (inputKind === "jpg") return "JPG/JPEG";
  if (inputKind === "png") return "PNG";
  if (inputKind === "webp") return "WebP";
  return "supported image";
}

function isAllowedFile(file: File, isPdfInputTool: boolean, isTifToJpegTool: boolean, inputKind: ImageInputKind) {
  const name = file.name.toLowerCase();
  if (isPdfInputTool) return file.type === "application/pdf" || name.endsWith(".pdf");
  if (isTifToJpegTool) return file.type === "image/tiff" || name.endsWith(".tif") || name.endsWith(".tiff");
  if (inputKind === "jpg") return file.type === "image/jpeg" || name.endsWith(".jpg") || name.endsWith(".jpeg");
  if (inputKind === "png") return file.type === "image/png" || name.endsWith(".png");
  if (inputKind === "webp") return file.type === "image/webp" || name.endsWith(".webp");
  return file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp" ||
    name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png") || name.endsWith(".webp");
}

async function hasExpectedSignature(file: File, isPdfInputTool: boolean, isTifToJpegTool: boolean, inputKind: ImageInputKind) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (isPdfInputTool) return ascii(bytes, 0, 5) === "%PDF-";
  if (isTifToJpegTool) return (bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a && bytes[3] === 0x00) || (bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0x00 && bytes[3] === 0x2a);
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  // PNG's eight-byte signature starts with 89 50 4E 47 0D 0A 1A 0A.
  // Compare only the three ASCII bytes (PNG); the fourth byte is CR.
  const isPng = bytes[0] === 0x89 && ascii(bytes, 1, 3) === "PNG";
  const isWebp = ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP";
  if (inputKind === "jpg") return isJpeg;
  if (inputKind === "png") return isPng;
  if (inputKind === "webp") return isWebp;
  return isJpeg || isPng || isWebp;
}

function ascii(bytes: Uint8Array, offset: number, length: number) {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

function isTiffFile(file: File) {
  return file.type === "image/tiff" || /\.(tif|tiff)$/i.test(file.name);
}

function isPreviewableImage(file: File) {
  return file.type.startsWith("image/") && file.type !== "image/tiff" && !/\.(tif|tiff)$/i.test(file.name);
}
