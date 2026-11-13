import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { PitchLines } from "@/components/pitch";
import { Logo } from "@/components/shared/logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dark bg-background text-foreground grid min-h-svh lg:grid-cols-2">
      <div className="relative flex flex-col gap-4 overflow-hidden p-6 md:p-10">
        <PitchLines className="text-primary/6 absolute inset-0 h-full w-full mask-[radial-gradient(ellipse_80%_60%_at_50%_100%,black_20%,transparent_100%)]" />
        <div className="relative flex items-center justify-between">
          <Link href="/" className="text-[22px]" aria-label="HuddleKit home">
            <Logo />
          </Link>
          <Link
            href="/"
            className="text-muted-foreground hover:text-primary flex items-center gap-1.5 text-sm transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back to site
          </Link>
        </div>
        <div className="relative flex flex-1 flex-col [&_h1]:text-[40px] [&_h1]:leading-none [&_h1]:font-extrabold">
          {children}
        </div>
      </div>

      <div className="bg-muted relative hidden overflow-hidden lg:block">
        <Image
          sizes="(max-width: 1200px) 50vw, 33vw"
          fill
          src="/images/auth/freekick.jpg"
          alt="Person with a foot on a football"
          className="absolute inset-0 object-cover"
          loading="eager"
        />
        <div
          aria-hidden
          className="from-background via-background/60 absolute inset-0 bg-linear-to-t to-transparent"
        />
        <div
          aria-hidden
          className="bg-primary/10 absolute inset-0 mix-blend-overlay"
        />
        <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col gap-6 p-10 xl:p-14">
          <div className="flex flex-col gap-3">
            <span className="text-primary text-[13px] font-semibold tracking-[0.12em] uppercase">
              Matchday ready
            </span>
            <h2 className="font-heading text-foreground max-w-115 text-[48px] leading-[0.95] xl:text-[60px]">
              Fewer messages. More matchdays.
            </h2>
            <p className="max-w-105 text-[15px] leading-6">
              Fixtures, RSVPs, lineups and match fees for your whole squad, all
              in one place.
            </p>
          </div>
          <p className="text-muted-foreground text-xs">
            Photo by{" "}
            <a
              href="https://unsplash.com/@concoyne?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText"
              className="hover:text-foreground underline transition-colors"
            >
              Connor Coyne
            </a>
            {" on "}
            <a
              href="https://unsplash.com/photos/white-and-blue-soccer-ball-on-green-grass-field-OgqWLzWRSaI?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText"
              className="hover:text-foreground underline transition-colors"
            >
              Unsplash
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
