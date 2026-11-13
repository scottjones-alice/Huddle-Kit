"use client";

import { Button } from "@alice/user-interface/components/button";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

// Both icons are rendered and CSS shows the right one, so the server and
// client HTML always match and no mounted check is needed.
export default function ThemeSwitch() {
  const { resolvedTheme, setTheme } = useTheme();

  const handleClick = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <Button
      size="icon-sm"
      variant="ghost"
      className="relative"
      onClick={handleClick}
    >
      <SunIcon className="hidden dark:block" />
      <MoonIcon className="block dark:hidden" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
