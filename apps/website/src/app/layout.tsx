import { cn } from "@alice/ui/lib/utils";
import { Geist_Mono, Geist } from "next/font/google";

import "../styles/globals.css";
import "../styles/football-intro.css";
import { INTRO_BOOTSTRAP } from "@/components/football-intro/gate";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const geistTypeset = Geist({
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
        geist.variable,
        geistTypeset.variable,
        geistMono.variable
      )}
    >
      <head>
        {/* oxlint-disable-next-line react-doctor/nextjs-no-native-script -- This tiny inline eligibility check must run before paint to avoid flashing the homepage. */}
        <script id="huddlekit-intro-bootstrap">{INTRO_BOOTSTRAP}</script>
      </head>
      <body className="flex min-h-svh flex-col">
        <ThemeProvider>
          <div id="website-content" className="flex min-h-svh flex-1 flex-col">
            <SiteHeader />
            {children}
            <SiteFooter />
          </div>
          <div id="football-intro-root" />
        </ThemeProvider>
      </body>
    </html>
  );
}
