export type ToolDefinition = {
  slug: string;
  title: string;
  shortTitle: string;
  eyebrow: string;
  description: string;
  cardDescription: string;
  inputLabel: string;
  acceptedLabel: string;
  outputLabel: string;
  icon: string;
  tone: "teal" | "coral" | "blue" | "gold";
  group: "from-images" | "from-pdf" | "polish";
  featured: boolean;
  options: string[];
  related: string[];
  faqs: { question: string; answer: string }[];
};

export const toolDefinitions: ToolDefinition[] = [
  {
    slug: "img-to-pdf",
    title: "Convert Img to PDF Online",
    shortTitle: "Img to PDF",
    eyebrow: "Image → PDF",
    description:
      "Img to PDF conversion turns JPG, PNG, and WebP images into a polished PDF. Add multiple pages, arrange them in order, and choose a layout before you download.",
    cardDescription: "Combine images into one PDF",
    inputLabel: "Drop images here",
    acceptedLabel: "JPG, PNG, WebP · up to 20 files",
    outputLabel: "PDF document",
    icon: "IMG",
    tone: "teal",
    group: "from-images",
    featured: true,
    options: ["Page size", "Orientation", "Margins", "Image quality"],
    related: ["img-to-word", "jpg-to-pdf", "png-to-pdf", "webp-to-pdf", "tif-to-jpeg"],
    faqs: [
      { question: "Can I put multiple images into one PDF?", answer: "Yes. Add as many supported images as you need, reorder the thumbnails, and the first image becomes the first PDF page." },
      { question: "Which image formats are supported?", answer: "This browser workflow accepts JPG, PNG, and WebP. HEIC, GIF, BMP, and TIFF can be added when dedicated conversion workers are enabled." },
      { question: "Can I choose A4 or Letter pages?", answer: "Yes. The workspace includes page size, orientation, margins, fit, and quality controls ready for the conversion API." },
    ],
  },
  {
    slug: "img-to-word",
    title: "Convert Img to Word Online",
    shortTitle: "Img to Word",
    eyebrow: "Image → Word",
    description: "Img to Word converts screenshots, scans, and photos into a real DOCX with the original image visual layer and editable OCR text.",
    cardDescription: "Convert images to editable Word text",
    inputLabel: "Drop images here",
    acceptedLabel: "JPG, PNG, WebP · Word-compatible output",
    outputLabel: "Word document",
    icon: "DOC",
    tone: "coral",
    group: "from-images",
    featured: true,
    options: ["Language", "Layout", "Keep images", "Text mode"],
    related: ["img-to-pdf", "jpg-to-pdf", "png-to-pdf", "webp-to-pdf", "tif-to-jpeg"],
    faqs: [
      { question: "What does Img to Word do?", answer: "It keeps the original image as the visual layer and adds OCR text controls that can be replaced in Word." },
      { question: "Does Img to Word include OCR?", answer: "Yes. The browser loads Chinese and English OCR on demand. The first OCR conversion needs an internet connection to load the recognition engine and language data." },
    ],
  },
  {
    slug: "jpg-to-pdf",
    title: "JPG to PDF Converter",
    shortTitle: "JPG to PDF",
    eyebrow: "JPG → PDF",
    description: "JPG to PDF converts photos, scans, and multi-page image sets online.",
    cardDescription: "Convert JPG photos fast",
    inputLabel: "Drop JPG files here",
    acceptedLabel: "JPG, JPEG · multi-page",
    outputLabel: "PDF document",
    icon: "JPG",
    tone: "gold",
    group: "from-images",
    featured: true,
    options: ["Page size", "Orientation", "Margins", "Quality"],
    related: ["img-to-pdf", "png-to-pdf", "webp-to-pdf", "tif-to-jpeg", "compress-pdf"],
    faqs: [
      { question: "Can I convert several JPGs at once?", answer: "Yes. Upload multiple JPG files, order them, and create a single PDF document." },
      { question: "Will my images keep their order?", answer: "Yes. Review the queue before exporting and move any page up or down until the document follows the sequence you need." },
      { question: "Which page size should I choose?", answer: "Choose Auto when the source images have different dimensions. A4 is a practical default for many offices, while Letter is useful for common US and Canadian print workflows." },
      { question: "Are JPG and JPEG both supported?", answer: "Yes. JPG and JPEG are two common filename extensions for the same image family, and both can be selected in this tool." },
      { question: "Can I create the document without an account?", answer: "Yes. The browser workflow does not require registration or a subscription. Add your images, set the page options, and download the result when it is ready." },
      { question: "Is JPG to PDF different from Image to PDF?", answer: "JPG to PDF is the format-specific landing page. Image to PDF is the broader workflow for several image formats." },
    ],
  },
  {
    slug: "png-to-pdf",
    title: "PNG to PDF Converter",
    shortTitle: "PNG to PDF",
    eyebrow: "PNG → PDF",
    description: "PNG to PDF converts graphics, screenshots, and transparent assets into a shareable PDF online.",
    cardDescription: "Turn PNG files into PDF",
    inputLabel: "Drop PNG files here",
    acceptedLabel: "PNG · transparency supported",
    outputLabel: "PDF document",
    icon: "PNG",
    tone: "blue",
    group: "from-images",
    featured: true,
    options: ["Page size", "Background", "Margins", "Fit"],
    related: ["img-to-pdf", "jpg-to-pdf", "webp-to-pdf", "tif-to-jpeg", "compress-pdf"],
    faqs: [
      { question: "Will transparent PNGs keep their transparency?", answer: "The output page can use a configurable background. The conversion worker will make this choice explicit instead of silently changing the asset." },
      { question: "Can I add more than one PNG?", answer: "Yes. Use the same multi-page queue as the main Image to PDF tool." },
    ],
  },
  {
    slug: "webp-to-pdf",
    title: "WebP to PDF Converter",
    shortTitle: "WebP to PDF",
    eyebrow: "WebP → PDF",
    description: "WebP to PDF converts modern WebP images into a PDF for printing, sharing, and uploads.",
    cardDescription: "Convert modern web images",
    inputLabel: "Drop WebP files here",
    acceptedLabel: "WebP · single or multi-page",
    outputLabel: "PDF document",
    icon: "WEB",
    tone: "teal",
    group: "from-images",
    featured: true,
    options: ["Page size", "Orientation", "Margins", "Quality"],
    related: ["img-to-pdf", "jpg-to-pdf", "png-to-pdf", "tif-to-jpeg", "compress-pdf"],
    faqs: [
      { question: "Why convert WebP to PDF?", answer: "PDF is easier to print and is accepted by more document portals. This tool keeps the WebP-to-document step focused." },
    ],
  },
  {
    slug: "pdf-to-img",
    title: "Convert PDF to Image Online",
    shortTitle: "PDF to Image",
    eyebrow: "PDF → Image",
    description: "PDF to Image renders PDF pages as JPG or PNG online for sharing, previews, and web uploads.",
    cardDescription: "Export pages as images",
    inputLabel: "Drop a PDF here",
    acceptedLabel: "PDF · choose JPG or PNG output",
    outputLabel: "Image files",
    icon: "PDF",
    tone: "coral",
    group: "from-pdf",
    featured: true,
    options: ["Output format", "DPI", "Page range", "Quality"],
    related: ["pdf-to-word", "compress-pdf"],
    faqs: [
      { question: "Can I export just one PDF page?", answer: "Yes. Choose First page to export only the first page, or keep All pages to download every rendered page." },
      { question: "Should I choose JPG or PNG?", answer: "JPG is smaller for photos. PNG is a better fit for screenshots, diagrams, and text-heavy pages." },
    ],
  },
  {
    slug: "tif-to-jpeg",
    title: "Convert TIF to JPEG Online",
    shortTitle: "TIF to JPEG",
    eyebrow: "TIF → JPEG",
    description: "Convert TIF and TIFF images to JPEG online for free. Turn archival or high-resolution TIFF files into shareable JPG images for websites, uploads, and everyday use.",
    cardDescription: "Turn TIFF images into JPG",
    inputLabel: "Drop TIF files here",
    acceptedLabel: "One TIF or TIFF · JPEG output",
    outputLabel: "JPEG image",
    icon: "TIF",
    tone: "gold",
    group: "from-images",
    featured: true,
    options: ["JPEG quality", "Color mode", "Background", "Resolution"],
    related: ["img-to-pdf", "jpg-to-pdf", "png-to-pdf", "webp-to-pdf"],
    faqs: [
      { question: "What is TIF to JPEG conversion?", answer: "It changes a TIF or TIFF image into a JPEG image that is easier to share, upload, and use on websites or apps." },
      { question: "Are TIF and TIFF the same type of file?", answer: "TIF and TIFF are two filename extensions commonly used for the same Tagged Image File Format." },
      { question: "Will JPEG be smaller than the original TIFF?", answer: "Usually yes. JPEG uses lossy compression, so the output is often much smaller while keeping suitable quality for everyday sharing. This tool converts the first page of a TIFF in your browser." },
    ],
  },
  {
    slug: "pdf-to-word",
    title: "Convert PDF to Word Online",
    shortTitle: "PDF to Word",
    eyebrow: "PDF → Word",
    description: "PDF to Word creates a real DOCX with visible PDF graphics and editable text boxes when the source provides selectable text. Scanned PDFs still need OCR.",
    cardDescription: "Preserve layout with editable text",
    inputLabel: "Drop a PDF here",
    acceptedLabel: "PDF · text and scanned pages",
    outputLabel: "Word document",
    icon: "DOC",
    tone: "blue",
    group: "from-pdf",
    featured: true,
    options: ["Selectable text", "Layout", "Page range", "Keep headings"],
    related: ["pdf-to-img", "compress-pdf"],
    faqs: [
      { question: "Can scanned PDFs become editable?", answer: "Scanned pages need OCR. The tool page is structured to expose OCR language and layout choices when the worker is connected." },
    ],
  },
  {
    slug: "compress-pdf",
    title: "Compress PDF Online",
    shortTitle: "Compress PDF",
    eyebrow: "PDF → Smaller PDF",
    description: "Compress PDF online by rewriting its structure in your browser before email or sharing.",
    cardDescription: "Make a PDF easier to send",
    inputLabel: "Drop a PDF here",
    acceptedLabel: "PDF · quality presets",
    outputLabel: "Smaller PDF",
    icon: "ZIP",
    tone: "gold",
    group: "polish",
    featured: true,
    options: ["Compression level", "Object streams", "Metadata"],
    related: ["pdf-to-img", "pdf-to-word"],
    faqs: [
      { question: "Will compression make text blurry?", answer: "The output should use a quality preset rather than silently over-compressing. Text and vector content should stay crisp." },
    ],
  },
];

export const toolGroups = [
  { key: "from-images" as const, title: "Img to PDF and Image Tools", eyebrow: "Convert images into documents", icon: "↗" },
  { key: "from-pdf" as const, title: "PDF to Image and PDF Tools", eyebrow: "Extract and edit PDF files", icon: "↙" },
  { key: "polish" as const, title: "Compress PDF Files", eyebrow: "Optimize your PDF output", icon: "✦" },
];

export function getTool(slug: string) {
  return toolDefinitions.find((tool) => tool.slug === slug);
}

/**
 * Keep the internal tool id stable for component logic while exposing the
 * keyword-focused public URL to search engines and users.
 */
export function getToolSlugFromPath(slug: string) {
  return slug === "image-to-pdf" || slug === "imec-to-pdf" ? "img-to-pdf" : slug;
}

export function getPublicToolSlug(slug: string) {
  return slug === "img-to-pdf" ? "image-to-pdf" : slug;
}

export function getPublicToolPath(slug: string) {
  return `/${getPublicToolSlug(slug)}`;
}
