"use client";

import { Button } from "@alice/ui/components/button";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerTitle,
} from "@alice/ui/components/drawer";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@alice/ui/components/navigation-menu";
import { Skeleton } from "@alice/ui/components/skeleton";
import { Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { keys } from "@/lib/keys";

const resources = [
  { href: "/blog", title: "Blog" },
  { href: "/documentation", title: "Documentation" },
  { href: "/support", title: "Support" },
  { href: "/api-reference", title: "API Reference" },
];

function NavLink({ href, children }: { href: string; children: string }) {
  return (
    <NavigationMenuLink
      asChild
      className="group/navigation-menu-trigger hover:bg-muted focus:bg-muted focus-visible:ring-ring/50 inline-flex h-9 w-max items-center justify-center rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:outline-1"
    >
      <Link href={href}>{children}</Link>
    </NavigationMenuLink>
  );
}

interface AuthActionsProps {
  mobile?: boolean;
  onNavigate?: () => void;
}

/** Sign in / dashboard buttons, shared by the desktop bar and the mobile drawer. */
function AuthActions({ mobile = false, onNavigate }: AuthActionsProps) {
  const { NEXT_PUBLIC_PLATFORM_URL } = keys();
  const { data: session, isPending } = authClient.useSession();
  const size = mobile ? "default" : "sm";

  if (isPending) {
    return <Skeleton className={mobile ? "h-9 w-full" : "h-8 w-24"} />;
  }

  if (session) {
    return (
      <Button size={size} asChild>
        <Link href={`${NEXT_PUBLIC_PLATFORM_URL}/`} onClick={onNavigate}>
          Dashboard
        </Link>
      </Button>
    );
  }

  return (
    <>
      <Button variant="outline" size={size} asChild>
        <Link href={`${NEXT_PUBLIC_PLATFORM_URL}/signin`} onClick={onNavigate}>
          Sign In
        </Link>
      </Button>
      <Button size={size} asChild>
        <Link href={`${NEXT_PUBLIC_PLATFORM_URL}/signup`} onClick={onNavigate}>
          Get Started
        </Link>
      </Button>
    </>
  );
}

export default function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="border-b">
      <nav className="container mx-auto flex h-16 w-full items-center justify-between p-4">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="text-foreground text-xl font-bold">
            Logo
          </Link>
        </div>

        {/* Desktop Navigation - Center */}
        <div className="hidden md:flex">
          <NavigationMenu viewport={false}>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavLink href="/features">Features</NavLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavLink href="/pricing">Pricing</NavLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavLink href="/about">About</NavLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-55 gap-1">
                    {resources.map((item) => (
                      <li key={item.title}>
                        <NavigationMenuLink asChild>
                          <Link href={item.href}>{item.title}</Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Desktop Buttons */}
        <div className="hidden items-center space-x-3 md:flex">
          <AuthActions />
        </div>

        {/* Mobile Menu Button */}
        <Drawer direction="right" open={isOpen} onOpenChange={setIsOpen}>
          <DrawerTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </DrawerTrigger>
          <DrawerContent className="p-6">
            <DrawerTitle className="sr-only">Menu</DrawerTitle>
            <Link href="/" className="text-foreground block text-xl font-bold">
              Logo
            </Link>

            <div className="grow space-y-6 overflow-y-auto">
              <div className="flex flex-col">
                <Link
                  href="/features"
                  className="py-2"
                  onClick={() => {
                    setIsOpen(false);
                  }}
                >
                  Features
                </Link>
                <Link
                  href="/pricing"
                  className="py-2"
                  onClick={() => {
                    setIsOpen(false);
                  }}
                >
                  Pricing
                </Link>
                <Link
                  href="/about"
                  className="py-2"
                  onClick={() => {
                    setIsOpen(false);
                  }}
                >
                  About
                </Link>
              </div>

              <div className="flex flex-col space-y-2">
                <span className="text-muted-foreground py-2 font-medium">
                  Resources
                </span>
                <div className="flex flex-col">
                  {resources.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="py-2"
                      onClick={() => {
                        setIsOpen(false);
                      }}
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-col space-y-3">
              <AuthActions
                mobile
                onNavigate={() => {
                  setIsOpen(false);
                }}
              />
            </div>
          </DrawerContent>
        </Drawer>
      </nav>
    </header>
  );
}
