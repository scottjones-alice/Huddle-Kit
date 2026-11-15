/* oxlint-disable shadcn/no-unknown-classes -- These website classes are defined in styles/marketing.css, outside the shared UI registry theme. */
"use client";

import { Button } from "@alice/ui/components/button";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@alice/ui/components/drawer";
import { ArrowUpRight, Menu, X } from "lucide-react";
import Link from "next/link";

import { Brand, SECTION_LINKS } from "@/components/marketing/brand";
import { ThemeControl } from "@/components/marketing/theme-control";
import { authClient } from "@/lib/auth-client";
import { keys } from "@/lib/keys";

function AccountLink() {
  const { data: session } = authClient.useSession();
  const { NEXT_PUBLIC_PLATFORM_URL } = keys();
  return (
    <Link
      className="account-link"
      href={NEXT_PUBLIC_PLATFORM_URL + (session ? "/" : "/login")}
    >
      {session ? "Your club" : "Sign in"}
    </Link>
  );
}

export default function SiteHeader() {
  const { NEXT_PUBLIC_PLATFORM_URL } = keys();
  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="marketing-container header-inner">
        <Brand />
        <nav aria-label="Main navigation" className="desktop-navigation">
          {SECTION_LINKS.map(({ href, label }) => (
            <Link href={href} key={href}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <ThemeControl />
          <div className="desktop-account">
            <AccountLink />
          </div>
          <Button asChild className="header-signup rounded-full">
            <Link href={`${NEXT_PUBLIC_PLATFORM_URL}/signup`}>
              Create your club <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
          <Drawer direction="right">
            <DrawerTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="mobile-menu"
                aria-label="Open menu"
              >
                <Menu />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="p-6">
              <div className="flex items-center justify-between">
                <Brand />
                <DrawerClose asChild>
                  <Button variant="ghost" size="icon" aria-label="Close menu">
                    <X />
                  </Button>
                </DrawerClose>
              </div>
              <DrawerTitle className="mt-8">Your club starts here.</DrawerTitle>
              <DrawerDescription>Explore Huddlekit.</DrawerDescription>
              <nav
                aria-label="Mobile navigation"
                className="my-8 flex flex-col gap-6"
              >
                {SECTION_LINKS.map(({ href, label }) => (
                  <DrawerClose asChild key={href}>
                    <Link href={href}>{label}</Link>
                  </DrawerClose>
                ))}
                <DrawerClose asChild>
                  <Link href={`${NEXT_PUBLIC_PLATFORM_URL}/login`}>
                    Sign in
                  </Link>
                </DrawerClose>
              </nav>
              <Button asChild className="rounded-full">
                <Link href={`${NEXT_PUBLIC_PLATFORM_URL}/signup`}>
                  Create your club <ArrowUpRight aria-hidden="true" />
                </Link>
              </Button>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </header>
  );
}
