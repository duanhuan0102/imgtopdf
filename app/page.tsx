import Link from "./components/SiteLink";
import { ToolWorkspace } from "./components/ToolWorkspace";
import { getPublicToolPath, toolDefinitions, toolGroups } from "./tool-data";

const featuredTools = toolDefinitions.filter((tool) => tool.featured);

const homeStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://imgtopdf.org/#website",
      url: "https://imgtopdf.org/",
      name: "imgtopdf.org",
      description: "Free browser-based Img to PDF and document conversion tools.",
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://imgtopdf.org/#img-to-pdf",
      name: "Img to PDF Converter",
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Web",
      url: "https://imgtopdf.org/",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@type": "HowTo",
      name: "How to Convert Img to PDF Online",
      step: [
        { "@type": "HowToStep", name: "Add images to the workspace", text: "Choose JPG, PNG, or WebP images from your device or drag them into the workspace." },
        { "@type": "HowToStep", name: "Arrange the PDF pages", text: "Review the queue and move pages until the document is in the order you need." },
        { "@type": "HowToStep", name: "Choose page settings", text: "Set the page size, orientation, margins, and image quality before converting." },
        { "@type": "HowToStep", name: "Download the PDF", text: "Start the conversion and download the finished document when it is ready." },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: "What is img to PDF?", acceptedAnswer: { "@type": "Answer", text: "Img to PDF means converting one or more image files—such as JPG, PNG, or WebP—into a PDF document. A multi-page PDF is useful for sharing, printing, or uploading images as one file." } },
        { "@type": "Question", name: "Can I combine multiple images into one PDF?", acceptedAnswer: { "@type": "Answer", text: "Yes. Add multiple images, drag them into the order you want, then convert. The first image becomes page one." } },
        { "@type": "Question", name: "Do I need to install software?", acceptedAnswer: { "@type": "Answer", text: "No installation is needed for the web workflow. The browser-based converter is ready to use without an account." } },
        { "@type": "Question", name: "What else can I do with my files?", acceptedAnswer: { "@type": "Answer", text: "Use the Img to Word tool for editable documents, PDF to Image for page exports, or Compress PDF before sending a large file." } },
      ],
    },
  ],
};

export default function Home() {
  return (
    <main>
      <SiteHeader />

      <section className="hero-section">
        <div className="container hero-tool-layout">
          <div className="hero-center-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> Free browser converter for photos and scans</div>
            <h1>Free Img to PDF Converter Online</h1>
            <p>Use this free img to PDF converter to combine JPG, PNG, and WebP images into one clean document. It works in a desktop or mobile browser, requires no account, and starts the download when your PDF is ready.</p>
          </div>

          <div className="hero-tool-panel" id="image-to-pdf-tool" aria-labelledby="homepage-tool-heading">
            <h2 id="homepage-tool-heading" className="sr-only">Upload Images and Create a PDF</h2>
            <ToolWorkspace tool={toolDefinitions[0]} />
          </div>

          <div className="hero-summary-grid">
            <div className="hero-summary-copy"><p>Combine one image or a full set into a shareable PDF. Arrange pages, choose a layout, and download the result without a complicated workflow.</p><div className="hero-proof" aria-label="Product benefits"><span><b>01</b> Free to use</span><span><b>02</b> No login required</span><span><b>03</b> Download automatically</span></div></div>
            <ul className="hero-summary-list"><li><span>✓</span><strong>Simple image converter</strong></li><li><span>✓</span><strong>Works with JPG, PNG, and WebP</strong></li><li><span>✓</span><strong>Use on desktop or mobile browser</strong></li></ul>
          </div>
        </div>
      </section>

      <section className="tool-hub-section" id="tools">
        <div className="container">
          <div className="section-heading split-heading">
            <div><span className="section-kicker">More image and PDF tools</span><h2>Image and PDF Conversion Tools</h2></div>
            <p>Start with the main converter, then move from images to Word or from PDF to images and documents. Each tool has a focused page and a clear next step.</p>
          </div>
          <div className="tool-groups">
            {toolGroups.map((group) => (
              <div className="tool-group" key={group.title}>
                <div className="tool-group-title"><span className="group-icon">{group.icon}</span><div><span>{group.eyebrow}</span><h3>{group.title}</h3></div></div>
                <div className="tool-card-grid">
                  {featuredTools.filter((tool) => tool.group === group.key).map((tool) => (
                    <ToolCard key={tool.slug} tool={tool} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="steps-section" id="how-to-use">
        <div className="container steps-layout">
          <div className="steps-intro"><span className="section-kicker">How the converter works</span><h2>How to Convert Img to PDF Online</h2><p>Convert your images in four clear steps. No software download, no account, and no mystery about what happens next.</p><div className="guide-promise"><span>✓</span><div><strong>Free and login-free</strong><small>Use the tool immediately, then download your result.</small></div></div><Link className="text-link" href="/image-to-pdf">See the full image conversion guide <span>→</span></Link></div>
          <div className="steps-list">
            <Step number="01" title="Add images to the workspace" text="Choose JPG, PNG, or WebP files from your device or drag them into the workspace." />
            <Step number="02" title="Arrange the PDF pages" text="Review the queue and move pages until the document is in the order you need." />
            <Step number="03" title="Choose page settings" text="Set the page size, orientation, margins, and image quality before converting." />
            <Step number="04" title="Download the PDF" text="Start the conversion and download the finished document when it is ready." />
          </div>
        </div>
      </section>

      <section className="content-section" id="guides">
        <div className="container content-grid">
          <div><span className="section-kicker">Built for the next click</span><h2>Related Img to PDF and PDF Tools</h2><p>Search visitors rarely stop at one conversion. Move naturally from a picture workflow to documents, page exports, or PDF cleanup with descriptive internal links.</p></div>
          <div className="content-links">
            <Link href="/img-to-word"><span>Image to Word</span><small>Turn image text into an editable document</small><b>↗</b></Link>
            <Link href="/pdf-to-img"><span>PDF to Image</span><small>Export PDF pages as shareable images</small><b>↗</b></Link>
            <Link href="/compress-pdf"><span>Compress PDF</span><small>Make a heavy document easier to send</small><b>↗</b></Link>
            <Link href="/pdf-to-word"><span>PDF to Word</span><small>Move document content into an editable file</small><b>↗</b></Link>
          </div>
        </div>
      </section>

      <section className="content-section" id="img-to-pdf-guide">
        <div className="container">
          <div className="section-heading split-heading">
            <div><span className="section-kicker">A practical image conversion guide</span><h2>Why convert images to PDF?</h2></div>
            <p>Turn a group of everyday images into one organized document for sharing, printing, archiving, or uploading.</p>
          </div>
          <div className="content-grid">
            <article>
              <h3>Turn a set of images into one file</h3>
              <p>A browser-based image workflow is useful when photos, screenshots, scans, or receipts need to travel together. Instead of attaching several files and asking someone to open them one at a time, create one document with a predictable page sequence. The first selected image becomes page one, and every additional image becomes its own page.</p>
              <p>This is practical for invoices, signed forms, school assignments, travel paperwork, menus, product photos, and notes captured on a phone. Upload one image for a single-page document or add a full set for a multi-page PDF. The queue gives you a chance to remove duplicates and fix the order before the file is created.</p>
              <h3>Arrange pages before you download</h3>
              <p>Page order matters when a PDF represents a process, a form, or a set of numbered photos. Move pages up or down until the document reads naturally. A quick review also helps catch a sideways photo, a missing scan, or an image that should be placed at the end.</p>
            </article>
            <article>
              <h3>Choose a layout that prints well</h3>
              <p>Use Auto when your source images have different dimensions and you want the fastest path to a readable result. Choose A4 or Letter when the final document must fit a familiar office or print standard. Portrait is usually best for receipts and forms, while landscape gives wide photos and screenshots more room.</p>
              <p>Margins control how much space surrounds each image. Small margins make the picture larger on the page; larger margins leave room for notes or printer-safe edges. If the source set mixes portrait and landscape images, check the preview settings before converting so the exported pages feel consistent.</p>
              <h3>Use the right source format</h3>
              <p>JPG is a good choice for photos and scans with many colors. PNG is often better for screenshots, diagrams, or graphics where sharp edges matter, while WebP is useful for modern web images. The homepage accepts the common formats together, so you can choose the workflow that matches the files already on your device.</p>
              <p>The browser-based process keeps the task simple: select images, review the queue, choose page options, and download the result. No desktop installation or account is needed. Keep the originals until you have opened the finished PDF and confirmed that the pages, orientation, and small text look correct.</p>
              <p>For office paperwork, a single document is easier to name, store, and send than a folder of separate pictures. It also gives the recipient a clear starting page and a reliable sequence, which is helpful when each scan belongs to the same form, application, or report.</p>
              <p>For personal projects, the same workflow can turn a phone photo set into a printable handout or a shareable record. Use the page controls to give every image enough space, then check a few pages at full size before sending the finished file.</p>
              <p>When a source image contains small text, use the sharpest original available and avoid repeatedly recompressing it before upload. For photographs, balance clarity and file size so the document remains easy to download without making faces, signatures, or fine details difficult to read.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="faq-section">
        <div className="container faq-layout">
          <div><span className="section-kicker">Good to know</span><h2>Img to PDF FAQ</h2><p>These answers are short on purpose. The tool is here when you are ready.</p></div>
          <div className="faq-list">
            <details open><summary>What is img to PDF?</summary><p>Img to PDF means converting one or more image files—such as JPG, PNG, or WebP—into a PDF document. A multi-page PDF is useful for sharing, printing, or uploading images as one file.</p></details>
            <details><summary>Can I combine multiple images into one PDF?</summary><p>Yes. Add multiple images, drag them into the order you want, then convert. The first image becomes page one.</p></details>
            <details><summary>Do I need to install software?</summary><p>No installation is needed for the web workflow. The browser-based converter is ready to use without an account.</p></details>
            <details><summary>What else can I do with my files?</summary><p>Use the <Link href="/img-to-word">Img to Word</Link> tool for editable documents, <Link href="/pdf-to-img">PDF to Image</Link> for page exports, or <Link href="/compress-pdf">Compress PDF</Link> before sending a large file.</p></details>
          </div>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeStructuredData).replace(/</g, "\\u003c") }} />
      <SiteFooter />
    </main>
  );
}

function SiteHeader() {
  return <header className="site-header"><div className="container header-inner"><Link href="/" className="brand" aria-label="imgtopdf.org home"><span className="brand-mark"><i /><i /><i /></span><span>imgtopdf<span className="brand-dot">.</span>org</span></Link><nav className="desktop-nav" aria-label="Primary navigation"><Link href="/image-to-pdf">Img to PDF</Link><Link href="/img-to-word">Img to Word</Link><Link href="/pdf-to-img">PDF to Image</Link><Link href="#tools">All tools</Link></nav><div className="header-actions"><Link href="#how-to-use" className="header-text-link">How it works</Link><Link href="/image-to-pdf" className="button button-small">Open tool <span>↗</span></Link></div></div></header>;
}

function SiteFooter() {
  return <footer className="site-footer"><div className="container footer-main"><div className="footer-brand"><Link href="/" className="brand"><span className="brand-mark"><i /><i /><i /></span><span>imgtopdf<span className="brand-dot">.</span>org</span></Link><p>Small, focused file tools for everyday work.</p></div><div className="footer-links"><div><strong>Convert</strong><Link href="/image-to-pdf">Img to PDF</Link><Link href="/img-to-word">Img to Word</Link><Link href="/pdf-to-img">PDF to Image</Link></div><div><strong>PDF tools</strong><Link href="/compress-pdf">Compress PDF</Link><Link href="/pdf-to-word">PDF to Word</Link><Link href="/jpg-to-pdf">JPG to PDF</Link></div><div><strong>Company</strong><Link href="#guides">Guides</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div></div></div><div className="container footer-bottom"><span>© 2026 imgtopdf.org</span><span>Built for clear file workflows.</span></div></footer>;
}

function ToolCard({ tool }: { tool: (typeof toolDefinitions)[number] }) {
  return <Link className="tool-card" href={getPublicToolPath(tool.slug)}><span className={`tool-card-icon ${tool.tone}`}>{tool.icon}</span><span className="tool-card-copy"><strong>{tool.shortTitle}</strong><small>{tool.cardDescription}</small></span><span className="tool-card-arrow">↗</span></Link>;
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return <div className="step-item"><span className="step-number">{number}</span><div><h3>{title}</h3><p>{text}</p></div></div>;
}
