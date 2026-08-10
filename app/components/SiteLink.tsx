import type { AnchorHTMLAttributes, ReactNode } from "react";

type SiteLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children: ReactNode;
};

/**
 * Internal navigation link that keeps the browser's native anchor behavior.
 *
 * The app is built with vinext, whose client-side next/link bundle currently
 * loses the navigation module export in production. Native anchors keep every
 * route reachable while the browser conversion controls remain client-side.
 */
export default function SiteLink({ href, children, ...props }: SiteLinkProps) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}
