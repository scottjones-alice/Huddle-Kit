/* oxlint-disable shadcn/no-unknown-classes -- These website classes are defined in styles/marketing.css, outside the shared UI registry theme. */
"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {
  // Hydration is the only snapshot transition; there is no external subscription.
};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function ThemeControl() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  );
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(event.target.value);
  };
  const selected = mounted ? (theme ?? "system") : "system";
  let Icon = Monitor;
  if (selected === "light") {
    Icon = Sun;
  }
  if (selected === "dark") {
    Icon = Moon;
  }

  return (
    <label className="theme-control">
      <Icon aria-hidden="true" size={17} />
      <span className="sr-only">Colour theme</span>
      <select
        aria-label="Colour theme"
        value={selected}
        onChange={handleChange}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  );
}
