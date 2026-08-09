import Link from "next/link";
import { ToolWorkspace } from "./components/ToolWorkspace";
import { getPublicToolPath, toolDefinitions, toolGroups } from "./tool-data";

const featuredTools = toolDefinitions.filter((tool) => tool.featured);

export default function Home() {
  return (
    <main>
      <SiteHeader />

      <section className="hero-section">
        <div className="container hero-tool-layout">
          <div className="hero-center-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> Convert img to PDF online</div>
            <h1>Free Img to PDF Converter Online</h1>
            <p>Convert photos, screenshots, and scans into a clean PDF online. Free to use, no login required, and ready in your browser.</p>
          </div>

          <div className="hero-tool-panel" id="image-to-pdf-tool" aria-labelledby="homepage-tool-heading">
            <h2 id="homepage-tool-heading" className="sr-only">Upload Images and Create a PDF</h2>
            <ToolWorkspace tool={toolDefinitions[0]} />
          </div>

          <div className="hero-summary-grid">
            <div className="hero-summary-copy"><p>Combine one image or a full set into a shareable PDF. Arrange pages, choose a layout, and download the result without a complicated workflow.</p><div className="hero-proof" aria-label="Product benefits"><span><b>01</b> Free to use</span><span><b>02</b> No login required</span><span><b>03</b> Download automatically</span></div></div>
            <ul className="hero-summary-list"><li><span>✓</span><strong>Simple image to PDF converter</strong></li><li><span>✓</span><strong>Works with JPG, PNG, and WebP</strong></li><li><span>✓</span><strong>Use on desktop or mobile browser</strong></li></ul>
          </div>
        </div>
      </section>

      <section className="tool-hub-section" id="tools">
        <div className="container">
          <div className="section-heading split-heading">
            <div><span className="section-kicker">More image and PDF tools</span><h2>Image and PDF Conversion Tools</h2></div>
            <p>Start with img to PDF, then move from images to Word or from PDF to images and documents. Each tool has a focused page and a clear next step.</p>
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
          <div className="steps-intro"><span className="section-kicker">How to use img to PDF</span><h2>How to Convert Img to PDF Online</h2><p>Convert your images in four clear steps. No software download, no account, and no mystery about what happens next.</p><div className="guide-promise"><span>✓</span><div><strong>Free and login-free</strong><small>Use the tool immediately, then download your result.</small></div></div><Link className="text-link" href="/image-to-pdf">See the full img to PDF guide <span>→</span></Link></div>
          <div className="steps-list">
            <Step number="01" title="Select Images for Img to PDF" text="Drag files in, choose them from your device, or add more as you go." />
            <Step number="02" title="Arrange Img to PDF Pages" text="Move pages up or down so the first image becomes page one." />
            <Step number="03" title="Choose Img to PDF Layout" text="Set the page size, orientation, and margins before converting." />
            <Step number="04" title="Download Your PDF" text="Click convert once and your finished PDF downloads when it is ready." />
          </div>
        </div>
      </section>

      <section className="content-section" id="guides">
        <div className="container content-grid">
          <div><span className="section-kicker">Built for the next click</span><h2>Related Image to PDF and PDF Tools</h2><p>Search visitors rarely stop at one conversion. Help them move naturally between image conversion, document conversion, and PDF cleanup with descriptive internal links.</p></div>
          <div className="content-links">
            <Link href="/img-to-word"><span>Image to Word</span><small>Turn image text into an editable document</small><b>↗</b></Link>
            <Link href="/pdf-to-img"><span>PDF to Image</span><small>Export PDF pages as shareable images</small><b>↗</b></Link>
            <Link href="/compress-pdf"><span>Compress PDF</span><small>Make a heavy document easier to send</small><b>↗</b></Link>
            <Link href="/pdf-to-word"><span>PDF to Word</span><small>Move document content into an editable file</small><b>↗</b></Link>
          </div>
        </div>
      </section>

      <section className="faq-section">
        <div className="container faq-layout">
          <div><span className="section-kicker">Good to know</span><h2>Img to PDF FAQ</h2><p>These answers are short on purpose. The tool is here when you are ready.</p></div>
          <div className="faq-list">
            <details open><summary>What is img to PDF?</summary><p>Img to PDF means converting one or more image files—such as JPG, PNG, or WebP—into a PDF document. A multi-page PDF is useful for sharing, printing, or uploading images as one file.</p></details>
            <details><summary>Can I combine multiple images into one PDF?</summary><p>Yes. Add multiple images, drag them into the order you want, then convert. The first image becomes page one.</p></details>
            <details><summary>Do I need to install software?</summary><p>No installation is needed for the web workflow. This first version keeps the interface ready for a secure upload and conversion API.</p></details>
            <details><summary>What else can I do with my files?</summary><p>Use <Link href="/img-to-word">image to Word</Link> for editable documents, <Link href="/pdf-to-img">PDF to image</Link> for page exports, or <Link href="/compress-pdf">compress PDF</Link> before sending a large file.</p></details>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function SiteHeader() {
  return <header className="site-header"><div className="container header-inner"><Link href="/" className="brand" aria-label="imgtopdf.org home"><span className="brand-mark"><i /><i /><i /></span><span>imgtopdf<span className="brand-dot">.</span>org</span></Link><nav className="desktop-nav" aria-label="Primary navigation"><Link href="/image-to-pdf">Image to PDF</Link><Link href="/img-to-word">Img to Word</Link><Link href="/pdf-to-img">PDF to Image</Link><Link href="#tools">All tools</Link></nav><div className="header-actions"><Link href="#how-to-use" className="header-text-link">How it works</Link><Link href="/image-to-pdf" className="button button-small">Open tool <span>↗</span></Link></div></div></header>;
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
