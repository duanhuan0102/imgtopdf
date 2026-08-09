import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Read the current terms for using imgtopdf.org free browser-based image and PDF tools.",
  alternates: { canonical: "https://imgtopdf.org/terms" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Terms of Use | imgtopdf.org",
    description: "Current terms for using the free browser-based converters at imgtopdf.org.",
    url: "https://imgtopdf.org/terms",
    type: "website",
  },
  twitter: { card: "summary", title: "Terms of Use | imgtopdf.org", description: "Current terms for using imgtopdf.org tools." },
};

export default function TermsPage() {
  return (
    <main className="simple-page">
      <header className="site-header"><div className="container header-inner"><Link href="/" className="brand"><span className="brand-mark"><i /><i /><i /></span><span>imgtopdf<span className="brand-dot">.</span>org</span></Link><Link href="/" className="button button-small">Back home <span>→</span></Link></div></header>
      <div className="container simple-content">
        <span className="section-kicker">Terms</span>
        <h1>Terms of Use for imgtopdf.org</h1>
        <p>imgtopdf.org provides free, no-login file conversion tools. By using the site, you confirm that you own or are authorised to process the files you select and that your use follows applicable law.</p>
        <div className="simple-card"><h2>Browser tools and limitations</h2><p>Current image and PDF downloads are generated in the browser. Browser support, file size limits, selectable text, and output quality can vary. PDF-to-Word does not perform OCR on scanned pages, and compression may not reduce a PDF that is already optimized.</p></div>
        <div className="simple-card"><h2>Responsible use</h2><p>Do not upload malware, unlawful content, or files you have no right to process. We may change supported formats, limits, or UI behavior as the service develops. Production server processing, retention, and support terms will be added before that service accepts uploads.</p></div>
        <Link href="/" className="text-link">Return to imgtopdf.org <span>→</span></Link>
      </div>
    </main>
  );
}
