/* oxlint-disable shadcn/no-unknown-classes -- These website classes are defined in styles/marketing.css, outside the shared UI registry theme. */
import Image from "next/image";
import Link from "next/link";

export const SECTION_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
] as const;

export function Brand() {
  return (
    <Link href="/" aria-label="Huddlekit home" className="brand-lockup">
      <span className="brand-mark">
        <Image src="/huddlekit/mark-lime.svg" alt="" width={25} height={25} />
      </span>
      <span>
        huddlekit<span className="brand-period">.</span>
      </span>
    </Link>
  );
}
