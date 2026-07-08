import type { Metadata } from "next";
import { Geist, Geist_Mono, Lora } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AppToaster } from "@/components/providers/app-toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { getSiteUrl } from "@/lib/site";
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
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Logos — Advanced Bible Study",
    template: "%s · Logos Bible",
  },
  description:
    "Read, listen to, search, and study all 66 books of the Bible in 29 translations across 18 languages — with word-by-word Greek & Hebrew lexicon, translation comparison, reading plans, memorization trainer, quizzes, highlights, and notes.",
  keywords: [
    "Bible",
    "Bible study",
    "Scripture",
    "audio Bible",
    "reading plan",
    "Greek",
    "Hebrew",
    "Strong's concordance",
    "memorize Bible verses",
    "Biblia",
    "Bibel",
    "聖經",
    "Библия",
  ],
  applicationName: "Logos Bible",
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Logos — Advanced Bible Study",
  url: getSiteUrl(),
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  description:
    "Read, listen to, search, and study the Bible in 29 translations across 18 languages with Greek & Hebrew word study, reading plans, memorization, and quizzes.",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
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
