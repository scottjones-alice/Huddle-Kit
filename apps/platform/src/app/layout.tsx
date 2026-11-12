import { Toaster } from "@alice/ui/components/sonner";
import { cn } from "@alice/ui/lib/utils";

import "../styles/globals.css";
import { Geist, Geist_Mono, Inter } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable,
        geist.variable,
        geistMono.variable
      )}
    >
      <body>
        <ThemeProvider>
          {children}
          <Toaster closeButton expand position="bottom-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
