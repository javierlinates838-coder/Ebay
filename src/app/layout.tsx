import type { Metadata } from "next";
import { Geist, Geist_Mono, Lora } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AppToaster } from "@/components/providers/app-toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-scripture",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "Logos — Advanced Bible Study",
    template: "%s · Logos Bible",
  },
  description:
    "Read, search, and study all 66 books of the Bible with word-by-word Greek & Hebrew lexicon, translation comparison, reading plans, memorization trainer, quizzes, highlights, and notes.",
  keywords: [
    "Bible",
    "Bible study",
    "Scripture",
    "reading plan",
    "Greek",
    "Hebrew",
    "Strong's concordance",
    "memorize Bible verses",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <TooltipProvider>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
            <AppToaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
