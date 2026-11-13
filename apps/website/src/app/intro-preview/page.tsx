import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { IntroPreview } from "@/components/football-intro/intro-preview";

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: "Football intro · Huddlekit",
};

export default function IntroPreviewPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }
  return <IntroPreview />;
}
