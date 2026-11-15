/* oxlint-disable shadcn/no-unknown-classes -- These website classes are defined in styles/marketing.css, outside the shared UI registry theme. */
import Link from "next/link";

import { Brand, SECTION_LINKS } from "@/components/marketing/brand";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="marketing-container">
        <div className="footer-main">
          <div>
            <Brand />
            <p>For the people behind the football.</p>
          </div>
          <nav aria-label="Footer navigation">
            {SECTION_LINKS.map(({ href, label }) => (
              <Link key={href} href={href}>
                {label}
              </Link>
            ))}
          </nav>
          <div>
            <span className="eyebrow">On your side</span>
            <a href="mailto:support@huddlekit.com">support@huddlekit.com</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© Huddlekit. All rights reserved.</span>
          <span>Your game. Your people.</span>
        </div>
      </div>
    </footer>
  );
}
