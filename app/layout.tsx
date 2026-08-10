import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://imgtopdf.org"),
  title: {
    default: "Img to PDF Online — Free Image Converter | imgtopdf.org",
    template: "%s | imgtopdf.org",
  },
  description:
    "Use this free img to PDF converter to combine JPG, PNG, and WebP images, reorder pages, choose a layout, and download a clean PDF online without an account.",
  applicationName: "imgtopdf.org",
  generator: "Next.js",
  keywords: ["img to pdf", "image to pdf", "jpg to pdf", "pdf tools"],
  alternates: {
    canonical: "https://imgtopdf.org/",
  },
  openGraph: {
    type: "website",
    url: "https://imgtopdf.org/",
    siteName: "imgtopdf.org",
    title: "Img to PDF Online — Free Image Converter",
    description:
      "Convert images to PDF online for free. Fast, private, and built for multi-page documents.",
    images: [{ url: "https://imgtopdf.org/og.png", width: 1536, height: 1024, alt: "imgtopdf.org — IMG TO PDF" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Img to PDF Online — Free Image Converter",
    description:
      "Turn JPG, PNG and WebP images into a clean PDF in a few clicks.",
    images: ["https://imgtopdf.org/og.png"],
  },
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-5ETJ81EJBC" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-5ETJ81EJBC');
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
