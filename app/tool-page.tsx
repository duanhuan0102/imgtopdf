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

          <h2 className="sr-only">{`Use the ${seo.label} converter`}</h2>
          <ToolWorkspace key={tool.slug} tool={tool} headingKeyword={seo.keyword === "image to pdf" || seo.keyword === "imec to pdf" ? "image" : "img"} />
          <p className="tool-workspace-note"><span>✓</span> {browserReady ? "Start instantly in your browser. No account, subscription, or software installation is needed." : "This page is ready for the production worker; no placeholder file is created while server-side conversion is offline."}</p>
        </div>
      </section>

      <section className="tool-benefits-section">
        <div className="container">
          <div className="section-heading section-heading-centered"><span className="section-kicker">A simpler way to work</span><h2>{seo.benefitsTitle}</h2><p>Keep the important choices visible, then move from source file to finished download without extra steps.</p></div>
          <div className="tool-benefit-grid">
            <Benefit icon="✓" title="Free from the first click" text={tool.slug === "jpg-to-pdf" ? "Convert your files without a paid plan, trial countdown, or hidden sign-up screen." : `Use ${seo.keyword} without a paid plan, trial countdown, or hidden sign-up screen.`} />
            <Benefit icon="✓" title="No account required" text="Open the page, add your file, and start working immediately. Your workflow does not depend on a profile." />
            <Benefit icon="✓" title="Clear controls" text={`Adjust ${tool.options.slice(0, 2).join(" and ").toLowerCase()} before you create the ${tool.outputLabel.toLowerCase()}.`} />
            <Benefit icon="✓" title="A clear finish" text={browserReady ? "The result is prepared in the workspace and the browser starts the download when conversion completes." : "The workspace explains the worker requirement instead of presenting an unverified result."} />
          </div>
        </div>
      </section>

      <section className="tool-guide-section" id="how-to-use">
        <div className="container tool-guide-grid">
          <div className="tool-guide-copy"><span className="section-kicker">How to use this tool</span><h2>{seo.guideTitle}</h2><p>{browserReady ? "Whether you are converting one photo or a full set of pages, the flow stays the same. You can see what is happening before the file leaves the workspace." : "The page documents the intended workflow and keeps conversion disabled until the production worker can process files safely."}</p><div className="tool-guide-steps">{guideStepsForTool.map((step, index) => <div className="tool-guide-step" key={step.title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{step.title}</h3><p>{step.text}</p></div></div>)}</div></div>
          <GuideVisual tool={tool} />
        </div>
      </section>

      <section className="tool-detail-section">
        <div className="container tool-detail-grid">
          <article>
            <span className="section-kicker">Learn before you convert</span>
            <h2>{seo.detailTitle}</h2>
            {tool.slug === "jpg-to-pdf" ? <JpgDetailContent /> : <>
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
          <div className="section-heading split-heading"><div><span className="section-kicker">Continue your workflow</span><h2>{`Related ${seo.label} tools, one click away.`}</h2></div><p>Move naturally from images to documents, or from a PDF to the next format you need.</p></div>
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
      description: "Convert TIF and TIFF images to JPEG online for free. Create shareable JPG files for websites, uploads, and everyday use.",
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
      description: "Convert image to PDF online for free. Combine JPG, PNG, and WebP files, reorder pages, and download a clean PDF.",
      benefitsTitle: "Image to PDF features",
      guideTitle: "How to Convert Image to PDF",
      detailTitle: "What Is Image to PDF?",
      faqTitle: "Image to PDF FAQ",
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

function getOptionDetail(tool: ToolDefinition, option: string) {
  if (tool.slug === "jpg-to-pdf") {
    const details: Record<string, string> = {
      "Page size": "Choose Auto for mixed source dimensions, or select A4 or Letter when the document must match a print standard.",
      Orientation: "Use portrait for forms and receipts, or landscape for wide photos and screenshots.",
      Margins: "Keep small margins for larger images, or choose more space when the printed document needs room for notes.",
      Quality: "Use a higher setting for small text and detailed scans, then balance file size against readability before sharing.",
    };
    return details[option] ?? "Choose the setting that best matches the way you plan to print or share the document.";
  }
  return "Use a visible control when the output needs this adjustment.";
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
