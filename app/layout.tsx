import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://imgtopdf.org"),
  title: {
    default: "Image to PDF Online — Free Image Converter | imgtopdf.org",
    template: "%s | imgtopdf.org",
  },
  description:
    "Convert images to PDF online for free. Combine JPG, PNG and WebP files, reorder pages, and turn your images into useful documents in seconds.",
  applicationName: "imgtopdf.org",
  generator: "Next.js",
  keywords: ["image to pdf", "img to pdf", "jpg to pdf", "pdf tools"],
  alternates: {
    canonical: "https://imgtopdf.org/",
  },
  openGraph: {
    type: "website",
    url: "https://imgtopdf.org/",
    siteName: "imgtopdf.org",
    title: "Image to PDF Online — Free Image Converter",
    description:
      "Convert images to PDF online for free. Fast, private, and built for multi-page documents.",
    images: [{ url: "https://imgtopdf.org/og.png", width: 1536, height: 1024, alt: "imgtopdf.org — IMAGE TO PDF" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Image to PDF Online — Free Image Converter",
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
      <body>{children}</body>
    </html>
  );
}
