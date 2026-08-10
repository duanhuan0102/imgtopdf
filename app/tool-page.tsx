import type { Metadata } from "next";
import Link from "./components/SiteLink";
import { notFound } from "next/navigation";
import { ToolWorkspace } from "./components/ToolWorkspace";
import { getPublicToolPath, getPublicToolSlug, getTool, getToolSlugFromPath, toolDefinitions, type ToolDefinition } from "./tool-data";

const guideSteps = [
  { title: "Add your source files", text: "Drag files into the upload box or choose them from your device." },
  { title: "Arrange and set options", text: "Reorder pages and choose the layout, quality, or page range you need." },
  { title: "Start the conversion", text: "Click the main button once. The workspace shows progress while it prepares the result." },
  { title: "Download and continue", text: "Your file downloads automatically, with a related tool ready for the next step." },
];

type ToolSeo = {
  title: string;
  label: string;
  keyword: string;
  description: string;
  benefitsTitle: string;
  guideTitle: string;
  detailTitle: string;
  faqTitle: string;
  metaTitle?: string;
  metaDescription?: string;
};

export function generateStaticParams() {
  return [
    ...toolDefinitions.map((tool) => ({ slug: getPublicToolSlug(tool.slug) })),
    { slug: "imec-to-pdf" },
  ];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (slug === "img-to-pdf") return { robots: { index: false, follow: false } };
  const tool = getTool(getToolSlugFromPath(slug));
  if (!tool) return {};
  const seo = getToolSeo(tool, slug);
  const publicPath = slug === "imec-to-pdf" ? "/imec-to-pdf" : getPublicToolPath(tool.slug);
  const pageTitle = seo.metaTitle ?? `${seo.title} | Free Online Tool`;
  const pageDescription = seo.metaDescription ?? `${seo.description} Free to use with no login required.`;
  return {
    title: pageTitle,
    description: pageDescription,
    alternates: { canonical: `https://imgtopdf.org${publicPath}` },
    openGraph: {
      title: `${seo.metaTitle ?? seo.title} | imgtopdf.org`,
      description: pageDescription,
      url: `https://imgtopdf.org${publicPath}`,
      type: "website",
      images: [{ url: "https://imgtopdf.org/og.png", width: 1536, height: 1024, alt: "imgtopdf.org | IMG TO PDF" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${seo.metaTitle ?? seo.title} | imgtopdf.org`,
      description: pageDescription,
      images: ["https://imgtopdf.org/og.png"],
    },
  };
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug === "img-to-pdf") notFound();
  const tool = getTool(getToolSlugFromPath(slug));
  if (!tool) notFound();

  const relatedTools = tool.related.map((relatedSlug) => getTool(relatedSlug)).filter(Boolean);
  const seo = getToolSeo(tool, slug);
  const faqs = getToolFaqs(tool, slug);
  const guideStepsForTool = getGuideSteps();
  const browserReady = true;
  const structuredData = buildStructuredData(tool, seo.keyword, faqs, slug, guideStepsForTool);

  return (
    <main>
      <ToolHeader />

      <section className={`tool-page-hero tool-page-hero-${tool.tone}`}>
        <div className="container">
          <div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><Link href="/#tools">Tools</Link><span>/</span><strong>{seo.label}</strong></div>

          <div className="tool-intro-centered">
            <span className="eyebrow"><span className="eyebrow-dot" /> {tool.eyebrow}</span>
            <h1>{seo.title}</h1>
            <p>{seo.description}</p>
            <div className="tool-free-points" aria-label="Free tool benefits">
              <span><b>✓</b> Free to use</span>
              <span><b>✓</b> No login required</span>
              <span><b>✓</b> {browserReady ? "Download when ready" : "Worker status shown clearly"}</span>
            </div>
          </div>

          <ToolWorkspace key={tool.slug} tool={tool} headingKeyword={seo.keyword === "image to pdf" || seo.keyword === "imec to pdf" ? "image" : "img"} />
          <p className="tool-workspace-note"><span>✓</span> {browserReady ? "Start instantly in your browser. No account, subscription, or software installation is needed." : "This page is ready for the production worker; no placeholder file is created while server-side conversion is offline."}</p>
        </div>
      </section>

      <section className="tool-benefits-section">
        <div className="container">
          <div className="section-heading section-heading-centered"><span className="section-kicker">A simpler way to work</span><h2>{seo.benefitsTitle}</h2><p>Keep the important choices visible, then move from source file to finished download without extra steps.</p></div>
          <div className="tool-benefit-grid">
            <Benefit icon="✓" title="Free from the first click" text={tool.slug === "jpg-to-pdf" ? "Convert your files without a paid plan, trial countdown, or hidden sign-up screen." : tool.slug === "img-to-word" ? "Create an editable Word document without a paid plan, trial countdown, or hidden sign-up screen." : tool.slug === "pdf-to-img" ? "Export PDF pages without a paid plan, trial countdown, or hidden sign-up screen." : tool.slug === "pdf-to-word" ? "Convert your PDF without a paid plan, trial countdown, or hidden sign-up screen." : tool.slug === "tif-to-jpeg" ? "Convert a TIF or TIFF file without a paid plan, trial countdown, or hidden sign-up screen." : `Use ${seo.keyword} without a paid plan, trial countdown, or hidden sign-up screen.`} />
            <Benefit icon="✓" title="No account required" text="Open the page, add your file, and start working immediately. Your workflow does not depend on a profile." />
            <Benefit icon="✓" title="Clear controls" text={`Adjust ${tool.options.slice(0, 2).join(" and ").toLowerCase()} before you create the ${tool.outputLabel.toLowerCase()}.`} />
            <Benefit icon="✓" title="A clear finish" text={browserReady ? "The result is prepared in the workspace and the browser starts the download when conversion completes." : "The workspace explains the worker requirement instead of presenting an unverified result."} />
          </div>
        </div>
      </section>

      <section className="tool-guide-section" id="how-to-use">
        <div className="container tool-guide-grid">
          <div className="tool-guide-copy"><span className="section-kicker">How to use this tool</span><h2>{seo.guideTitle}</h2><p>{browserReady ? getGuideIntro(tool) : "The page documents the intended workflow and keeps conversion disabled until the production worker can process files safely."}</p><div className="tool-guide-steps">{guideStepsForTool.map((step, index) => <div className="tool-guide-step" key={step.title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{step.title}</h3><p>{step.text}</p></div></div>)}</div></div>
          <GuideVisual tool={tool} />
        </div>
      </section>

      <section className="tool-detail-section">
        <div className="container tool-detail-grid">
          <article>
            <span className="section-kicker">Learn before you convert</span>
            <h2>{seo.detailTitle}</h2>
            {tool.slug === "jpg-to-pdf" ? <JpgDetailContent /> : tool.slug === "img-to-pdf" ? <ImageToPdfDetailContent /> : tool.slug === "img-to-word" ? <ImgToWordDetailContent /> : tool.slug === "pdf-to-word" ? <PdfToWordDetailContent /> : tool.slug === "png-to-pdf" ? <PngToPdfDetailContent /> : tool.slug === "pdf-to-img" ? <PdfToImgDetailContent /> : tool.slug === "tif-to-jpeg" ? <TifToJpegDetailContent /> : tool.slug === "compress-pdf" ? <CompressPdfDetailContent /> : <>
              <p>{seo.description} This free online workflow keeps the source files, ordering, and output settings in one focused place so you can finish the job without installing a desktop app.</p>
              <p>It is designed for quick everyday tasks: documents from a phone camera, screenshots, scans, receipts, presentations, and files that need one more format before they can be shared.</p>
            </>}
            <div className="detail-points">{tool.options.map((option, index) => <div key={option}><span>0{index + 1}</span><div><strong>{option}</strong><p>{getOptionDetail(tool, option)}</p></div></div>)}</div>
          </article>
          <aside className="privacy-card tool-facts-card"><span className="privacy-icon">✓</span><span className="section-kicker">At a glance</span><h3>Simple, free, and ready to try</h3><dl><div><dt>Input</dt><dd>{tool.acceptedLabel}</dd></div><div><dt>Output</dt><dd>{tool.outputLabel}</dd></div><div><dt>Account</dt><dd>Not required</dd></div><div><dt>Download</dt><dd>{browserReady ? "Starts automatically" : "Available when worker is connected"}</dd></div></dl><Link href="/privacy" className="text-link">Read the privacy promise <span>→</span></Link></aside>
        </div>
      </section>

      <section className="faq-section tool-faq" id="faq">
        <div className="container faq-layout">
          <div><span className="section-kicker">FAQ</span><h2>{seo.faqTitle}</h2><p>Answers are visible on the page so people can understand the workflow before they upload.</p></div>
          <div className="faq-list">{faqs.map((faq, index) => <details key={faq.question} open={index === 0}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div>
        </div>
      </section>

      <section className="related-section">
          <div className="container">
          <div className="section-heading split-heading"><div><span className="section-kicker">Continue your workflow</span><h2>{`Related ${seo.label} tools, one click away.`}</h2></div><p>{tool.slug === "compress-pdf" ? "After making a smaller file, continue with page images or an editable Word document when the next destination calls for it." : "Move naturally from images to documents, or from a PDF to the next format you need."}</p></div>
          <div className="related-grid">{relatedTools.map((related) => related ? <Link href={getPublicToolPath(related.slug)} className="related-card" key={related.slug}><span className={`tool-card-icon ${related.tone}`}>{related.icon}</span><div><strong>{related.title}</strong><small>{related.cardDescription}</small></div><span>→</span></Link> : null)}</div>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <SiteFooter />
    </main>
  );
}

function Benefit({ icon, title, text }: { icon: string; title: string; text: string }) {
  return <article className="tool-benefit-card"><span className="tool-benefit-icon">{icon}</span><h3>{title}</h3><p>{text}</p></article>;
}

function GuideVisual({ tool }: { tool: ToolDefinition }) {
  return <div className="tool-guide-visual" aria-label="Four-step conversion preview"><div className="guide-visual-topline"><span>imgtopdf.org</span><b>FREE TOOL</b></div><div className="guide-visual-window"><div className={`guide-visual-file ${tool.tone}`}><span>{tool.icon}</span></div><strong>Upload → arrange → download</strong><small>No login · no installation</small><div className="guide-visual-progress"><i /><i /><i /><i /></div><div className="guide-visual-result"><span>✓</span><div><b>{tool.outputLabel}</b><small>Ready to download</small></div></div></div><div className="guide-visual-bottom"><span>FREE</span><span>PRIVATE</span><span>AUTO DOWNLOAD</span></div></div>;
}

function getToolSeo(tool: ToolDefinition, routeSlug = getPublicToolSlug(tool.slug)): ToolSeo {
  if (routeSlug === "imec-to-pdf") {
    return {
      title: "IMEC to PDF Converter Online",
      label: "IMEC to PDF",
      keyword: "imec to pdf",
      description: 'Looking for "imec to pdf"? Convert JPG, PNG, and WebP images to PDF online free with no login.',
      benefitsTitle: "IMEC to PDF features",
      guideTitle: "How to Convert Images to PDF",
      detailTitle: "What Does IMEC to PDF Mean?",
      faqTitle: "IMEC to PDF FAQ",
    };
  }

  if (routeSlug === "tif-to-jpeg") {
    return {
      title: "TIF to JPEG Converter Online",
      label: "TIF to JPEG",
      keyword: "tif to jpeg",
      metaTitle: "TIF to JPEG Converter | Free, No Login",
      metaDescription: "Convert TIF to JPEG online for free. Turn TIF or TIFF files into shareable JPG images with quality, color, and resolution controls. No account required.",
      description: "Convert TIF and TIFF images to JPEG in your browser. Create shareable JPG files for websites, uploads, and everyday use, with quality and color controls before downloading.",
      benefitsTitle: "TIF to JPEG features",
      guideTitle: "How to Convert TIF to JPEG",
      detailTitle: "What Is TIF to JPEG?",
      faqTitle: "TIF to JPEG FAQ",
    };
  }

  if (tool.slug === "jpg-to-pdf") {
    return {
      title: "JPG to PDF Converter Online",
      label: "JPG to PDF",
      keyword: "jpg to pdf",
      metaTitle: "JPG to PDF Converter | Free, No Login",
      metaDescription: "Convert JPG to PDF online for free. Combine JPG or JPEG files, reorder pages, choose size and margins, then download a clean document without an account.",
      description: "Convert JPG and JPEG images to PDF online in seconds. Combine photos, scans, receipts, or forms, then reorder pages and choose a layout before downloading.",
      benefitsTitle: "JPG to PDF features",
      guideTitle: "How to Convert JPG to PDF",
      detailTitle: "What Is JPG to PDF?",
      faqTitle: "JPG to PDF FAQ",
    };
  }

  if (tool.slug === "img-to-pdf") {
    return {
      title: "Image to PDF Converter Online",
      label: "Image to PDF",
      keyword: "image to pdf",
      metaTitle: "Image to PDF Converter | Free, No Login",
      metaDescription: "Convert image to PDF online for free. Combine JPG, PNG, and WebP files, reorder pages, choose a layout, and download a clean document without an account.",
      description: "Convert images to PDF online in seconds. Combine JPG, PNG, and WebP files, reorder pages, and choose a layout before downloading.",
      benefitsTitle: "Image to PDF features",
      guideTitle: "How to Convert Image to PDF",
      detailTitle: "What Is Image to PDF?",
      faqTitle: "Image to PDF FAQ",
    };
  }

  if (tool.slug === "img-to-word") {
    return {
      title: "Convert Img to Word Online",
      label: "Image to Word",
      keyword: "img to word",
      metaTitle: "Img to Word Converter | Free, No Login",
      metaDescription: "Convert img to word online for free. Turn screenshots, scans, and photos into editable DOCX files with OCR, then download without an account.",
      description: "Img to Word turns screenshots, scans, and photos into editable DOCX files with OCR while keeping the original image as a visual layer.",
      benefitsTitle: "Img to Word features",
      guideTitle: "How to Convert Img to Word",
      detailTitle: "What Is Img to Word?",
      faqTitle: "Img to Word FAQ",
    };
  }

  if (tool.slug === "pdf-to-word") {
    return {
      title: "PDF to Word Converter Online",
      label: "PDF to Word",
      keyword: "pdf to word",
      metaTitle: "PDF to Word Converter Online | Free DOCX Tool",
      metaDescription: "Convert PDF to Word online for free. Create editable DOCX files with selectable text and preserved graphics. Scanned PDFs may need OCR. No login required.",
      description: "Convert PDF to Word in your browser and create a real DOCX with selectable text, visible graphics, and a readable page structure. Scanned PDFs may need OCR.",
      benefitsTitle: "PDF to Word features",
      guideTitle: "How to Convert PDF to Word",
      detailTitle: "What Is PDF to Word?",
      faqTitle: "PDF to Word FAQ",
    };
  }

  if (tool.slug === "png-to-pdf") {
    return {
      title: "PNG to PDF Converter",
      label: "PNG to PDF",
      keyword: "png to pdf",
      metaTitle: "PNG to PDF Converter | Free, No Login",
      metaDescription: "Convert PNG to PDF for free. Combine screenshots and graphics, place transparent pixels on a white page, choose a layout, and download without an account.",
      description: "PNG to PDF turns screenshots, diagrams, and transparent graphics into a clean PDF. Combine pages, choose a page size, and set margins before downloading.",
      benefitsTitle: "PNG to PDF features",
      guideTitle: "How to Convert PNG to PDF",
      detailTitle: "What Is PNG to PDF?",
      faqTitle: "PNG to PDF FAQ",
    };
  }

  if (tool.slug === "pdf-to-img") {
    return {
      title: "Convert PDF to Img Online",
      label: "PDF to Img",
      keyword: "pdf to img",
      metaTitle: "PDF to Img Converter | Free, No Login",
      metaDescription: "Convert PDF to img online for free. Export pages as JPG or PNG, choose resolution and page range, then download image files without an account.",
      description: "PDF to Img converts PDF pages into JPG or PNG files for previews, sharing, and web uploads. Choose the output format, resolution, and page range before downloading.",
      benefitsTitle: "PDF to Img features",
      guideTitle: "How to Convert PDF to Img",
      detailTitle: "What Is PDF to Img?",
      faqTitle: "PDF to Img FAQ",
    };
  }

  if (tool.slug === "compress-pdf") {
    return {
      title: "Compress PDF Files Online",
      label: "Compress PDF",
      keyword: "compress pdf",
      metaTitle: "Compress PDF Online Free | Reduce File Size",
      metaDescription: "Compress PDF files online for free in your browser. Reduce the file size for email, uploads, and sharing while keeping text readable. No account required.",
      description: "Reduce a PDF for email, uploads, or sharing in your browser. Choose a compression level, manage metadata, and download a rewritten file without an account.",
      benefitsTitle: "Compress PDF features",
      guideTitle: "How to Compress PDF Online",
      detailTitle: "What Does Compress PDF Do?",
      faqTitle: "Compress PDF FAQ",
    };
  }

  const keyword = tool.shortTitle.toLowerCase();
  return {
    title: tool.title,
    label: tool.shortTitle,
    keyword,
    description: tool.description,
    benefitsTitle: `${tool.shortTitle} features`,
    guideTitle: tool.slug === "compress-pdf" ? "How to Compress PDF Online" : `How to Convert ${tool.shortTitle}`,
    detailTitle: tool.slug === "compress-pdf" ? "What Does Compress PDF Do?" : `What Is ${tool.shortTitle}?`,
    faqTitle: `${tool.shortTitle} FAQ`,
  };
}

function getToolFaqs(tool: ToolDefinition, routeSlug: string) {
  if (routeSlug !== "imec-to-pdf") return tool.faqs;
  return [
    { question: "What does imec to PDF mean?", answer: '"imec to PDF" is commonly used as a misspelled search for image to PDF. This page converts JPG, PNG, and WebP image files into a PDF document.' },
    ...tool.faqs,
  ];
}

function getGuideSteps() {
  return guideSteps;
}

function getGuideIntro(tool: ToolDefinition) {
  if (tool.slug === "compress-pdf") {
    return "When a PDF is too large for an email or upload limit, choose a profile that fits the destination, review the result, and keep the original until the smaller copy has passed your checks.";
  }
  if (tool.slug === "pdf-to-word") {
    return "Choose a text-based PDF, select a layout and page range, then review the DOCX before sharing. The browser keeps the source on your device while it prepares the editable file.";
  }
  return "Whether you are converting one photo or a full set of pages, the flow stays the same. You can see what is happening before the file leaves the workspace.";
}

function TifToJpegDetailContent() {
  return <>
    <p>TIF and TIFF files are common in scanning, publishing, archives, design work, and document exchange. They can preserve large, detailed images, but many websites, forms, and everyday apps expect a JPG instead. This browser workflow reads the first image page, converts it to a JPEG, and gives you practical controls for quality, color handling, and output size before the download.</p>
    <h3>When a JPEG copy is more useful</h3>
    <p>Use the converter when an upload form rejects a TIFF, a website needs a familiar image extension, or a colleague wants a file that opens easily on a phone. JPG is widely supported by browsers, messaging apps, content systems, and office tools. It is a convenient delivery format for photographs, scans, product images, reference pages, and other visual material that does not need to remain in an archival container.</p>
    <p>The original TIF or TIFF can remain your high-quality source while the JPEG serves as a lighter sharing copy. Keep both when the image may need to be edited, printed at a large size, or preserved for long-term records. A JPEG is best treated as an access version: easier to send and upload, but not a replacement for the original master file.</p>
    <p>This page accepts one source file at a time. That keeps the workflow predictable for large scans and lets you compare the exported image with its source before starting another conversion. If a TIFF contains several pages, the browser uses the first page for the JPEG output; separate pages should be exported individually when each one is needed.</p>
    <h3>What happens during the conversion</h3>
    <p>The file is decoded in the browser and drawn onto a canvas at the chosen dimensions. The result is then encoded as a standard JPG file with a new filename based on the source. The layout and visible pixels are preserved as an image, but the output is not an editable document and it does not retain the original TIFF layers, tags, or multi-page structure.</p>
    <p>Because JPEG uses lossy compression, tiny details may change when the file is saved. This is usually acceptable for web uploads and ordinary sharing, but it matters for technical drawings, small labels, fine line art, or evidence that must remain pixel-accurate. Compare a few important areas at full size before you discard or overwrite anything.</p>
    <h3>Balance quality and file size</h3>
    <p>High quality is the best starting point for small text, detailed scans, signatures, and images that may be reviewed closely. Balanced quality is useful when the output needs to travel by email or fit within a portal limit. Small file reduces the download size for quick previews and web use, but stronger compression can create blocky edges or soften fine contrast.</p>
    <p>The right setting depends on the destination rather than on a single universal number. A product photo for a webpage can usually use a smaller file, while a scanned receipt or diagram benefits from more detail. If the first result looks soft around letters or lines, try the higher setting and compare the file size with the visual improvement.</p>
    <h3>Choose color handling for the source</h3>
    <p>White is a safe choice when the source includes transparent or empty areas and the image will be viewed on a white page. JPEG does not preserve transparency, so a background must be flattened when the file is exported. Original keeps the source colors closer to what you see in the decoded image, which can be useful for photographs and artwork with a deliberate background.</p>
    <p>Check light text, pale borders, logos, and transparent edges against the expected destination. A design that looks clear over a dark webpage may lose contrast on a white background, while a document scan may look more natural with a clean white field. If the background is important to the artwork, add it to the source before conversion and then review the result once more.</p>
    <h3>Use the resolution setting wisely</h3>
    <p>Source keeps the available dimensions when they are within the browser&apos;s safe working range. The 2400 px max option limits the longest edge for a more manageable output, which can help with very large scans or files that need to upload quickly. Downscaling does not improve missing detail, but it can make a large image easier to open and share.</p>
    <p>Start with the original scan whenever possible. Repeated screenshots, pasted copies, and heavily compressed exports may already have softened text before this workflow begins. Very large or unusual TIFF files can also require more browser memory, so close unnecessary tabs and use a smaller source if the device cannot prepare the image reliably.</p>
    <h3>Review the first-page result</h3>
    <p>After downloading, open the JPG at full size and inspect the first, middle, and outer edges of the source image. Check that the orientation is correct, important content is not clipped, and small text or thin lines remain readable. Compare the file in the application or upload form where it will actually be used; some services resize images again after upload.</p>
    <p>Use a clear filename that keeps the source identity and makes the format obvious. For example, a name such as <em>invoice-2026-08-preview.jpg</em> is easier to find than a generic download name. Keep the original TIFF until the JPEG has passed the visual check, especially when the file is part of an archive, a client handoff, or a record with compliance requirements.</p>
    <h3>A private, simple browser workflow</h3>
    <p>Choose one TIF or TIFF file, select the quality, color mode, and resolution, then start the conversion. The browser prepares the JPG on your device and starts the download when it is ready. No account or desktop installation is required, so the process works well for a one-off upload as well as a quick check of a larger scan.</p>
    <p>The privacy page explains the site&apos;s file-handling practices. For important documents, use a trusted device, remove pages or files you do not need, and confirm the downloaded image before sharing it. These small checks keep the format change focused: the JPEG is ready for the website, form, message, or app that could not accept the original TIF/TIFF file.</p>
  </>;
}

function JpgDetailContent() {
  return <>
    <p>JPG and JPEG files are convenient for photos because they are compact and widely supported. A PDF is often a better final format when several images need to be printed, emailed, archived, or uploaded as one document. This converter turns each selected image into a separate page and keeps the order you choose.</p>
    <h3>When to turn JPG images into a PDF</h3>
    <p>Use this page for receipts, invoices, signed forms, ID scans, travel documents, homework, menus, or photo handouts. Upload one picture for a one-page document or select a group for a multi-page file. The queue lets you add a missing page, remove an image, or move a page up or down before export.</p>
    <p>A single document is useful when a website accepts PDF but not a group of photos. It gives the recipient one predictable download, makes paperwork easier to store, and reduces the chance that pages arrive separately or in the wrong sequence.</p>
    <h3>Choose page settings for a clean result</h3>
    <p>Page settings help the result match its destination. A4 is a practical choice for many office workflows, while Letter fits common US and Canadian print layouts. Portrait works well for documents and receipts; landscape suits wide photos and screenshots. Small margins give the image more room, while larger margins leave space for notes and printing.</p>
    <p>For mixed image dimensions, Auto is a safe starting point. When every page must line up for printing, choose a fixed size and confirm the orientation. Original files usually produce a clearer result than screenshots or copies compressed several times.</p>
    <h3>A simple multi-page workflow</h3>
    <p>Add the source files, review their order, set the page size, orientation, margins, and quality, then create the document. The browser shows the working queue before conversion, so you can catch a duplicate or an out-of-order page early.</p>
    <p>JPG and JPEG are the same image family and both are accepted. JPG is usually a good fit for photographs and scans with many colors. For screenshots, diagrams, or transparent graphics, the PNG converter may be a better choice; WebP files have their own dedicated page.</p>
    <p>No desktop installation or account is required. Select the images, confirm the settings, create the PDF, and download it when the browser finishes. The privacy page explains the site&apos;s file-handling and download practices. For documents with small text, start with a sharp original scan and review the downloaded file before sending it.</p>
    <p>If you are preparing a batch for printing, keep the original files until you have checked the final document. Open a few pages at full size, confirm that the first page and orientation are correct, and make sure the file name is clear before sharing it with a client, school, office, or travel provider.</p>
  </>;
}

function ImageToPdfDetailContent() {
  return <>
    <p>Images are quick to capture and share, but a PDF is often a better final format when several pictures need to be printed, emailed, archived, or uploaded as one document. This browser workflow turns each selected image into a separate page and keeps the order you choose, so the finished file is easier to review and reuse.</p>
    <h3>When an image collection belongs in one document</h3>
    <p>Use this workflow for receipts, invoices, signed forms, class notes, screenshots, menus, travel records, and photo handouts. Add one file for a one-page document or place a group in the queue for a multi-page file. The queue order becomes the page order, so you can add a missing scan, remove a duplicate, or move a page before creating the final file.</p>
    <p>Putting several pictures into one document also makes sharing easier. A portal may accept one PDF but reject a folder of images, while a client, teacher, or office team can review one attachment without opening files one at a time. A numbered sequence is easier to print, archive, and search later.</p>
    <p>If the source comes from a phone, keep the original files until the document has been checked. That gives you a clean fallback when one page needs to be rotated, replaced, or added again. It also avoids taking another screenshot of an image that has already lost detail.</p>
    <h3>Choose a page layout that fits the source</h3>
    <p>Auto is a useful starting point when the source images have different dimensions. Choose A4 or Letter when the file will be printed or uploaded to a form with a standard page size. Portrait suits receipts, letters, and scans; landscape gives wide photos and screenshots more room. Small margins maximize the picture, while larger margins leave printer-safe space around the edges.</p>
    <p>Check the preview before you export. If an image contains small type, begin with a sharp original and a higher quality setting. For ordinary photos, a balanced setting can keep the document easy to send without making the download unnecessarily large. When pages come from different devices, review their orientation and order together instead of correcting them after the file is shared.</p>
    <p>Layout choices are especially useful for mixed collections. A document may contain a tall receipt, a landscape screenshot, and a standard portrait scan. Matching the page size and orientation to the destination keeps the result predictable, while sensible margins prevent important edges from sitting too close to a printer&apos;s trim area.</p>
    <h3>JPG, PNG, and WebP in one workflow</h3>
    <p>JPG is a practical choice for photographs and scans with many colors. PNG works well for screenshots, diagrams, logos, and text-heavy graphics because it keeps crisp edges and can carry transparency. WebP is common for images saved from modern websites. Combining these formats is useful when a project includes camera photos alongside web assets or screenshots.</p>
    <p>The converter is designed for short browser workflows: select the files, arrange the pages, choose the settings, and download the result. No account or desktop installation is needed. The privacy page explains how the site handles files, and keeping the originals until you have reviewed the downloaded document gives you a safe fallback if a page needs to be adjusted.</p>
    <p>For a clean final document, open several pages at full size, confirm the first page, check that text remains readable, and use a clear filename before sending it. If a service has its own size or orientation requirement, match that requirement in the page settings first; the right layout usually prevents more problems than editing the PDF afterward.</p>
    <p>When the file is ready for an office, school, client, or travel provider, review it once more on the device where it will be submitted. Confirm that the page count is correct, the first page is in the expected position, and the download opens normally. These quick checks help the document stay useful after it leaves the browser.</p>
  </>;
}

function ImgToWordDetailContent() {
  return <>
    <p>Images often contain useful information, but retyping a screenshot or scan into a document takes time and can introduce mistakes. This browser workflow combines the original visual layer with OCR text, so you can keep the page as a reference while making important words easier to select, correct, and reuse in a DOCX file.</p>
    <h3>Turn screenshots and scans into an editable document</h3>
    <p>Use the converter for phone photos, receipts, invoices, signed forms, class notes, menus, reports, and screenshots that need to become part of a Word document. Add one source for a single-page file or select a group for a multi-page document. The queue follows the order of the files you add, which makes it simple to assemble a packet before export.</p>
    <p>A Word file is useful when the final reader needs to add a heading, correct a name, insert a note, or copy information into another system. The source image remains visible in the document, giving you a reliable visual reference while you review the recognized text. This is especially helpful for forms and paperwork where spacing, stamps, signatures, or checkboxes matter.</p>
    <p>OCR can turn printed words into text that is easier to search and edit, but recognition is not a substitute for proofreading. Check names, numbers, dates, punctuation, and unusual spellings after the download. A quick comparison with the original page is worthwhile when the source is blurry, angled, handwritten, or photographed in uneven light.</p>
    <h3>How OCR and the visual layer work together</h3>
    <p>The default text mode uses Chinese and English OCR for common mixed-language documents. Recognized text is placed in editable controls while the original page stays available as a visual layer. This combination preserves the appearance of the source without making every small correction require a full retype.</p>
    <p>OCR works best with a sharp, upright image, strong contrast, and text that is large enough to read at normal zoom. Start with the original scan or camera file instead of a compressed screenshot when possible. If a page includes several scripts, keep the source clear and review each language separately; short labels and dense tables deserve extra attention.</p>
    <p>Choose Images only when the appearance of the original page matters more than text extraction. That mode creates a Word document built around the source images, which can be useful for a visual archive, a handout, or a record that should not be reflowed. Choose OCR text when you expect to edit, search, or copy the page content.</p>
    <h3>Choose a layout for the way you will edit</h3>
    <p>The Keep page order option follows the upload sequence, making it a practical choice for packets, receipts, and notes collected in a specific order. One image per page gives every source a separate page and makes page breaks predictable. For a mixed set, arrange the files first, then choose the layout that matches how the document will be reviewed or printed.</p>
    <p>Fit page keeps the source within the available Word page area, while Original gives the image more room when its dimensions should stay closer to the source. Use the visual layer as a reference for alignment, then edit the OCR text only where it adds value. A consistent layout makes the resulting DOCX easier to pass to a colleague or continue editing later.</p>
    <p>Before exporting, review the queue from top to bottom. Remove duplicate images, replace an unreadable scan, and move a page if the sequence is wrong. Doing that before conversion is faster than repairing page order after the document has already been attached to an email, uploaded to a portal, or shared with a client.</p>
    <h3>Prepare a reliable source before conversion</h3>
    <p>Use the highest-quality source available, keep pages upright, and avoid heavy compression. JPG is convenient for photographs, PNG is often clearer for screenshots and diagrams, and WebP is common for images saved from modern websites. The workflow accepts these everyday formats, so a project can include camera photos alongside screen captures.</p>
    <p>No account or desktop installation is required. Select the files, choose the text mode and layout, create the DOCX, and review the downloaded file in a compatible Word editor. The privacy page explains the site&apos;s file-handling practices. Keep the originals until you have confirmed that the page count, visual layer, and recognized text all meet your needs.</p>
    <p>For a final quality check, open several pages at full size and search for a word that should have been recognized. Compare a few names and numbers against the source, make sure the first page is correct, and use a clear filename before sending the document. These small checks make the converted file more dependable for school, office, finance, or travel paperwork.</p>
  </>;
}

function PdfToWordDetailContent() {
  return <>
    <p>PDF files are made for consistent viewing, while Word documents are made for editing. When a report, form, invoice, resume, or set of notes needs a correction, a browser-based DOCX workflow is more useful than retyping the whole page. This converter reads the text layer that already exists in a text-based PDF, keeps important visible graphics, and prepares a Word file you can inspect before sharing.</p>
    <h3>When an editable Word document helps</h3>
    <p>Use the workflow when you need to correct a name, update a date, reuse a paragraph, add a comment, or copy information into another system. It is also useful for turning a finished report into a working draft, moving a contract into a review process, or preparing a document for a colleague who needs to add a heading or make a small change.</p>
    <p>The result is not intended to replace the original PDF as a visual master. Keep the source file for reference, especially when it includes signatures, stamps, page numbers, columns, tables, or carefully positioned artwork. The editable file is a practical working copy: it gives text a useful next step while preserving enough of the page appearance to compare the two versions.</p>
    <h3>What a text-based PDF can preserve</h3>
    <p>A text-based PDF contains selectable characters in addition to its page graphics. The browser can read that text layer and place the words into editable controls in the DOCX. With Preserve layout selected, the rendered page graphics remain behind those controls, so logos, charts, shaded areas, illustrations, and other visual details stay visible while the recognized text can be corrected.</p>
    <p>PDF and Word use different layout models, so a perfect one-to-one reconstruction is not possible for every file. Embedded fonts, complex tables, multi-column sections, footnotes, unusual line spacing, and transparency effects can behave differently after conversion. Treat the first download as an editable starting point, then compare a few representative pages with the source before making extensive changes.</p>
    <h3>When OCR is necessary</h3>
    <p>A scanned PDF is usually a collection of page images rather than a document with selectable text. If you cannot drag across a sentence or copy a word in a PDF viewer, there may be no text layer for the browser to extract. The visible scan can still be carried into the document, but the words will not automatically become editable just because the file has a .pdf extension.</p>
    <p>Scanned pages need optical character recognition (OCR) to turn pixels into words. OCR is especially sensitive to blur, skew, low contrast, handwriting, decorative type, and dense tables. If the source is a scan, use the clearest original, keep pages upright, and plan to check names, numbers, dates, punctuation, and short labels after recognition. A converted document should be proofread before it becomes an official or final copy.</p>
    <h3>Choose Preserve layout or Flowing text</h3>
    <p>Preserve layout is the better starting point for forms, invoices, certificates, resumes, presentations, and pages where location matters. It keeps the page-sized visual layer and positions editable text boxes over the source. Flowing text is better when the main goal is to rework paragraphs, combine content from several pages, or create a simpler draft that behaves more like an ordinary Word document.</p>
    <p>The Page range control is useful for a quick sample or a long document. Choose First page to check the conversion style before processing the complete file, or choose All pages when the whole document is ready. Current browser conversion supports PDFs with up to 100 pages; a smaller range can also make the first review faster.</p>
    <h3>Prepare and review the source file</h3>
    <p>Start with the original PDF rather than a screenshot or a copy that has been compressed several times. Remove passwords when you are authorized to do so, confirm that the file opens normally, and check a page with text, a page with graphics, and a page with a table if the document contains all three. Encrypted, damaged, or unusually complex PDFs may need to be repaired or opened in a desktop editor before they can be read reliably.</p>
    <p>After the download, open the DOCX in a compatible Word editor and compare the first, middle, and last pages. Search for a word that should be present, inspect the text boxes around headings and labels, confirm that graphics are visible, and check the page count. If the document will be submitted to a portal or sent to a client, also use a clear filename and keep the original until the editable copy passes that check.</p>
    <h3>A private, browser-based workflow</h3>
    <p>No account or desktop installation is required. Select one PDF, choose the text source, layout, and page range, start the conversion, and download the DOCX when it is ready. The current browser workflow processes the file on your device instead of uploading it to the site. For sensitive paperwork, use a trusted device, clear the queue when finished, and read the privacy page for the current file-handling limits.</p>
  </>;
}

function PngToPdfDetailContent() {
  return <>
    <p>PNG files are a strong source format for screenshots, diagrams, interface mockups, logos, charts, and text-heavy graphics. A PDF is often easier to print, submit, archive, or share as one predictable document. This browser workflow turns each selected PNG into a page, keeps the upload order, and lets you review the document settings before downloading.</p>
    <h3>When PNG belongs in a PDF</h3>
    <p>Use this page for software screenshots, scanned forms, classroom notes, product diagrams, transparent logos, receipts, and images that need to travel with a report. PNG uses lossless compression, so sharp lines and small characters usually start with fewer artifacts than a repeatedly saved photo. Add one file for a one-page document or select a group to make a multi-page handout.</p>
    <p>Combining several graphics into one file also helps when a portal accepts PDF but not a folder of images. A single attachment is easier for a client, teacher, reviewer, or office team to open, print, and archive. The queue lets you add a missing page, remove a duplicate, and move pages into the order readers should follow.</p>
    <p>For long screenshots or diagrams, check the page sequence before export. A useful first page can explain the rest of the document, while a clear filename makes the download easier to identify after it has been saved or uploaded.</p>
    <h3>How transparent PNG pixels appear in a PDF</h3>
    <p>PNG can store transparent pixels around a logo, icon, or graphic. A PDF page needs a visible surface, so this browser conversion places transparent areas on a clean white background. That makes the result predictable on white paper and in common document viewers, but it may look different from a web preview that shows a checkerboard or a colored page behind the artwork.</p>
    <p>Preview graphics with thin strokes, white text, or pale edges before sharing them. If the design depends on a dark or colored background, add that background to the source artwork first so the intended contrast is part of the image. Keep important labels away from the outer edge; a sensible margin gives the page more room for printing and review.</p>
    <h3>Choose page size, orientation, and fit</h3>
    <p>Auto is a practical starting point when source images have different dimensions. Choose A4 for many office and school workflows, or Letter for common US and Canadian print layouts. Portrait fits most documents and vertical screenshots, while landscape gives wide diagrams, dashboards, and presentations more space.</p>
    <p>The page fit keeps the complete image inside the available area instead of cropping its edges. Small margins maximize the graphic, while larger margins leave a safer boundary for printers and handwritten notes. If every page must look consistent, use one fixed page size and review the orientation before creating the file.</p>
    <p>Mixed collections deserve a quick preview. One page may be a tall form, another a wide product screen, and a third a square logo. Matching the layout to the destination keeps the PDF readable without forcing every source into the wrong proportions.</p>
    <h3>Keep screenshots and small text readable</h3>
    <p>Start with the original PNG rather than a compressed copy pasted through several apps. Use a clear capture at the largest practical resolution, and avoid enlarging a small screenshot before conversion. Small text can become difficult to read when the source is scaled down to fit a standard page, so check a few pages at full size after the download.</p>
    <p>PNG is particularly useful for crisp edges, but a PDF workflow still has to place the image on a document page. Review thin lines, table borders, annotations, and high-contrast labels after export. If a graphic is meant for a presentation rather than printing, compare the PDF view with the original to make sure no important detail is hidden by the page margins.</p>
    <h3>A simple multi-page workflow</h3>
    <p>Add the PNG files, confirm their order, choose the page size and orientation, check the margins, and create the document. No account or desktop installation is required. The privacy page explains the site&apos;s file-handling practices, and the browser prepares the download on the device so you can keep the original sources until the result has been checked.</p>
    <p>Before sending the file, open several pages, confirm the first page and total count, inspect transparent artwork against the white page, and use a clear filename. These small checks make the final document more dependable for a print job, online form, project handout, or archived set of graphics.</p>
  </>;
}

function PdfToImgDetailContent() {
  return <>
    <p>PDF is a dependable format for documents, but individual pages are often easier to preview, upload, or reuse as images. This browser workflow renders each selected page as a JPG or PNG file, keeps the page number in the filename, and lets you choose the output format, resolution, and page range before downloading.</p>
    <h3>When to export PDF pages as images</h3>
    <p>Use this workflow for document previews, web uploads, slide decks, support tickets, social posts, product listings, and pages that need to be shared without opening a PDF viewer. It also helps when a form accepts JPG or PNG but does not accept a multi-page document. Select the first page for a quick cover image, or render every page when the whole file needs to be reviewed as a set.</p>
    <p>A single selected page downloads as an image file. When several pages are selected, the browser packs the numbered images into a ZIP archive so one download can contain the complete set. This keeps a long document organized without asking you to save each page manually.</p>
    <p>Before converting, confirm that the source PDF contains the pages you want to publish. A cover, signature page, or appendix can be useful in one context and unnecessary in another. Choosing the page range first makes the final download easier to send and less likely to include private or unrelated material.</p>
    <h3>Choose JPG or PNG for the destination</h3>
    <p>JPG is a practical choice for photographs, scanned pages, and web previews where a smaller file matters. PNG is usually better for screenshots, diagrams, tables, and text-heavy pages because it keeps crisp edges and avoids additional lossy compression. If the page contains small type or thin lines, start with PNG and inspect the result before switching to a smaller format.</p>
    <p>The output is a rendered image of the page, not a text extraction. Fonts, vector drawings, page backgrounds, and layout are captured as they appear in the PDF. That makes the result useful for visual sharing, but it also means the exported file is not intended for editing individual words. Keep the original document when searchable text or selectable content is still needed.</p>
    <h3>Set resolution and page range</h3>
    <p>Use 150 DPI for ordinary previews, messaging, and web use. Choose 300 DPI when small text, fine lines, or print detail needs more room. Higher resolution creates larger images, so the best setting depends on whether the file will be viewed on a screen, attached to a form, or sent to a printer.</p>
    <p>All pages is useful for a complete archive or a multi-page review. First page is a quick way to create a cover, thumbnail, or representative preview. For a large document, rendering only the pages you need can reduce the download size and shorten the wait before the images are ready.</p>
    <p>Resolution cannot restore detail that was already missing from a low-quality source. If the original PDF contains a blurry scan, use the clearest source available and compare a few small labels after conversion. A higher DPI can make the pixels larger without making the underlying text more accurate.</p>
    <h3>Keep page order and filenames clear</h3>
    <p>Page numbers are included in the generated filenames, which makes a multi-page set easier to sort after it is unpacked. Keep the source PDF name recognizable, and use the output format that matches the service where the images will be uploaded. A consistent naming pattern helps colleagues identify page 001, page 002, and later pages without opening every file.</p>
    <p>For visual documents, review the first, middle, and last pages before sharing. Check that no important edge is clipped, that rotated pages still read correctly, and that the output opens in the app or browser where it will be used. If the document includes private information, remove unnecessary pages before creating the image set.</p>
    <h3>A simple browser-based workflow</h3>
    <p>Choose the PDF, select JPG or PNG, set the resolution, choose all pages or the first page, and start the conversion. No account or desktop installation is required. The privacy page explains the site&apos;s file-handling practices, and the browser prepares the output on the device before the download begins.</p>
    <p>Keep the original PDF until the image files have been checked. Open a few outputs at full size, confirm the page count, compare small text with the source, and use a clear filename or archive name before sending the result to a client, portal, support team, or website.</p>
  </>;
}

function CompressPdfDetailContent() {
  return <>
    <p>PDF files can become difficult to email or upload when they contain large images, repeated metadata, or more detail than the destination needs. This browser workflow rewrites the document locally with a quality profile, so you can create a smaller copy while keeping the original available for comparison.</p>
    <h3>What browser compression changes</h3>
    <p>Light, Balanced, and Strong profiles reduce image payloads at different levels. Text and vector content should remain crisp, while photographs and scans may be resized or recompressed. Removing metadata can also reduce unnecessary document information, but it does not restore detail that was already missing from the source.</p>
    <h3>Choose a profile for the destination</h3>
    <p>Use Light when visual quality matters most, Balanced for ordinary email and sharing, and Strong when an upload limit is the priority. If the source is already optimized, the output may be similar in size or even slightly larger because the PDF has to be rewritten.</p>
    <h3>Review the smaller file</h3>
    <p>Open the downloaded PDF before sending it. Check small text, photographs, page count, transparency, and any signatures or fine lines that matter. Keep the original until the compressed copy opens correctly and meets the size and readability requirements of the service where it will be used.</p>
  </>;
}

function getOptionDetail(tool: ToolDefinition, option: string) {
  if (tool.slug === "tif-to-jpeg") {
    const details: Record<string, string> = {
      "JPEG quality": "Use High for small text and detailed scans, Balanced for everyday sharing, or Small file when upload size matters most.",
      "Color mode": "Choose White for predictable transparent areas, or Original when the source background and colors should stay closer to the decoded image.",
      Resolution: "Use Source to keep available dimensions, or 2400 px max to make a very large scan easier to open and upload.",
    };
    return details[option] ?? "Choose the setting that matches the image detail, background, and destination file size you need.";
  }
  if (tool.slug === "jpg-to-pdf") {
    const details: Record<string, string> = {
      "Page size": "Choose Auto for mixed source dimensions, or select A4 or Letter when the document must match a print standard.",
      Orientation: "Use portrait for forms and receipts, or landscape for wide photos and screenshots.",
      Margins: "Keep small margins for larger images, or choose more space when the printed document needs room for notes.",
      Quality: "Use a higher setting for small text and detailed scans, then balance file size against readability before sharing.",
    };
    return details[option] ?? "Choose the setting that best matches the way you plan to print or share the document.";
  }
  if (tool.slug === "img-to-pdf") {
    const details: Record<string, string> = {
      "Page size": "Use Auto for mixed dimensions, or choose A4 or Letter when the document must match a print standard.",
      Orientation: "Choose portrait for forms and receipts, or landscape for wide photos and screenshots.",
      Margins: "Keep small margins for larger images, or add more space for notes and printer-safe edges.",
      "Image quality": "Use a higher setting for small text and detailed scans, then balance clarity against file size.",
    };
    return details[option] ?? "Choose the setting that best matches the way you plan to share or print the document.";
  }
  if (tool.slug === "img-to-word") {
    const details: Record<string, string> = {
      Language: "Use Chinese + English OCR for mixed-language pages, and start with a sharp, upright source for better recognition.",
      Layout: "Keep the upload order for a continuous packet, or use one image per page when every source needs a predictable page break.",
      "Keep images": "Preserve the original visual layer when page appearance, signatures, stamps, or form alignment matters.",
      "Text mode": "Choose OCR text for searchable, editable content, or Images only when the original page appearance is the priority.",
    };
    return details[option] ?? "Choose the setting that matches whether you need editable text, visual fidelity, or both.";
  }
  if (tool.slug === "png-to-pdf") {
    const details: Record<string, string> = {
      "Page size": "Use Auto for mixed dimensions, or choose A4 or Letter when the PDF must match a print standard.",
      Background: "Transparent PNG pixels are placed on a white PDF page for predictable viewing and printing.",
      Margins: "Use small margins for larger graphics, or choose more space when the page needs printer-safe edges or notes.",
      Fit: "The complete image is scaled inside the page area so important edges stay visible instead of being cropped.",
    };
    return details[option] ?? "Choose the setting that best matches the way you plan to view, print, or share the PDF.";
  }
  if (tool.slug === "pdf-to-img") {
    const details: Record<string, string> = {
      "Output format": "Choose JPG for smaller photo pages and web previews, or PNG for screenshots, diagrams, and small text.",
      DPI: "Use 150 DPI for everyday previews, or 300 DPI when fine detail and print readability matter more than file size.",
      "Page range": "Select All pages for a complete set, or First page for a cover, thumbnail, or quick preview.",
      Quality: "Compare the rendered page at full size and keep the original PDF when the source scan is already blurry.",
    };
    return details[option] ?? "Choose the setting that matches the destination, detail level, and number of pages you need.";
  }
  if (tool.slug === "pdf-to-word") {
    const details: Record<string, string> = {
      "Selectable text": "Best for PDFs with a text layer. The browser extracts those words into editable DOCX controls; scanned pages still need OCR.",
      Layout: "Preserve layout keeps page graphics behind editable text boxes, while Flowing text creates simpler paragraphs for substantial rewriting.",
      "Page range": "Choose All pages for the complete file, or First page to test a long document before downloading the full result.",
    };
    return details[option] ?? "Choose the setting that matches the source PDF and how much editing the Word document needs.";
  }
  return `Select ${option.toLowerCase()} based on the format, readability, or sharing requirements of the finished file.`;
}

function buildStructuredData(tool: ToolDefinition, keyword: string, faqs = tool.faqs, routeSlug = getPublicToolSlug(tool.slug), steps = getGuideSteps()) {
  const publicPath = routeSlug === "imec-to-pdf" ? "/imec-to-pdf" : getPublicToolPath(tool.slug);
  const url = `https://imgtopdf.org${publicPath}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: tool.title,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Web",
        url,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://imgtopdf.org/" },
          { "@type": "ListItem", position: 2, name: "Tools", item: "https://imgtopdf.org/#tools" },
          { "@type": "ListItem", position: 3, name: tool.shortTitle, item: url },
        ],
      },
      { "@type": "HowTo", name: `How to use ${keyword}`, step: steps.map((step) => ({ "@type": "HowToStep", name: step.title, text: step.text })) },
      { "@type": "FAQPage", mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) },
    ],
  };
}

function ToolHeader() {
  return <header className="site-header"><div className="container header-inner"><Link href="/" className="brand" aria-label="imgtopdf.org home"><span className="brand-mark"><i /><i /><i /></span><span>imgtopdf<span className="brand-dot">.</span>org</span></Link><nav className="desktop-nav" aria-label="Primary navigation"><Link href="/image-to-pdf">Image to PDF</Link><Link href="/img-to-word">Img to Word</Link><Link href="/pdf-to-img">PDF to Img</Link><Link href="#how-to-use">How it works</Link></nav><div className="header-actions"><Link href="#faq" className="header-text-link">FAQ</Link><Link href="/#tools" className="button button-small">All tools <span>→</span></Link></div></div></header>;
}

function SiteFooter() {
  return <footer className="site-footer"><div className="container footer-main"><div className="footer-brand"><Link href="/" className="brand"><span className="brand-mark"><i /><i /><i /></span><span>imgtopdf<span className="brand-dot">.</span>org</span></Link><p>Free, focused file tools for everyday work. No account required.</p></div><div className="footer-links"><div><strong>Convert</strong><Link href="/image-to-pdf">Image to PDF</Link><Link href="/img-to-word">Img to Word</Link><Link href="/pdf-to-img">PDF to Img</Link></div><div><strong>PDF tools</strong><Link href="/compress-pdf">Compress PDF</Link><Link href="/pdf-to-word">PDF to Word</Link><Link href="/jpg-to-pdf">JPG to PDF</Link></div><div><strong>Learn</strong><Link href="#how-to-use">How it works</Link><Link href="#faq">FAQ</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div></div></div><div className="container footer-bottom"><span>© 2026 imgtopdf.org</span><span>Free tools. No login. Clear file workflows.</span></div></footer>;
}
