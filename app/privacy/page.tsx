import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how imgtopdf.org handles files, downloads, and privacy when you use our free browser-based converters.",
  alternates: { canonical: "https://imgtopdf.org/privacy" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Privacy Policy | imgtopdf.org",
    description: "Learn how imgtopdf.org handles files and downloads in the current browser-based tools.",
    url: "https://imgtopdf.org/privacy",
    type: "website",
  },
  twitter: { card: "summary", title: "Privacy Policy | imgtopdf.org", description: "How imgtopdf.org handles files and downloads." },
};

export default function PrivacyPage() {
  return (
    <main className="simple-page">
      <header className="site-header"><div className="container header-inner"><Link href="/" className="brand"><span className="brand-mark"><i /><i /><i /></span><span>imgtopdf<span className="brand-dot">.</span>org</span></Link><Link href="/" className="button button-small">Back home <span>→</span></Link></div></header>
      <div className="container simple-content">
        <span className="section-kicker">Trust &amp; privacy</span>
        <h1>Privacy Policy for imgtopdf.org</h1>
        <p>The currently live image-to-PDF and image-to-Word workflows run in your browser. Files are selected from your device, processed locally, and downloaded back to your device; this prototype does not require an account or upload files to our server.</p>
        <div className="simple-card"><h2>What we collect</h2><p>We do not ask for a name, email address, or login to use the browser tools. Temporary preview data stays in the page session. Clearing the queue or closing the page removes the local references; your browser controls the downloaded file.</p></div>
        <div className="simple-card"><h2>Important limits</h2><p>Current conversions run in the browser and are limited by your device, the 25 MB per-file limit, and supported PDF features. Scanned PDFs still need OCR, and encrypted or damaged PDFs may fail without sending your file to a server.</p></div>
        <Link href="/" className="text-link">Return to imgtopdf.org <span>→</span></Link>
      </div>
    </main>
  );
}
