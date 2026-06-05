"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  Camera,
  TrendingUp,
  FileText,
  Calculator,
  Copy,
  ArrowRight,
  Package,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Camera,
    title: "AI Photo Analysis",
    desc: "Upload photos — Gemini identifies product, brand, model, and condition instantly.",
  },
  {
    icon: TrendingUp,
    title: "Smart Pricing",
    desc: "AI price estimates when you don't have eBay keys. Live sold comps when you do.",
  },
  {
    icon: FileText,
    title: "SEO Listings",
    desc: "Generate optimized titles, descriptions, and item specifics in seconds.",
  },
  {
    icon: Calculator,
    title: "Profit Calculator",
    desc: "Calculate net profit, eBay fees, and ROI before you list.",
  },
  {
    icon: Copy,
    title: "Copy to eBay Kit",
    desc: "No eBay developer account? Copy title, description, keywords, and download photos.",
  },
  {
    icon: Package,
    title: "Inventory Tracking",
    desc: "Save drafts, resume later, mark items sold, and track your profits.",
  },
];

const steps = [
  { step: "1", title: "Snap photos", desc: "Upload 1-10 product photos from your phone" },
  { step: "2", title: "AI identifies", desc: "Gemini analyzes brand, model, condition & category" },
  { step: "3", title: "Get pricing", desc: "AI estimates market value and suggests list price" },
  { step: "4", title: "Copy to eBay", desc: "Paste your listing kit directly into eBay — done in 2 min" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0064D2] text-white text-sm font-bold">
              R
            </div>
            <span className="font-semibold">ResellAI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className={cn(buttonVariants({ variant: "ghost" }))}>
              Dashboard
            </Link>
            <Link
              href="/list"
              className={cn(buttonVariants(), "rounded-xl bg-[#0064D2] hover:bg-[#0053b3]")}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0064D2]/5 to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative mx-auto max-w-3xl text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm">
            <Sparkles className="h-4 w-4 text-[#0064D2]" />
            Works with just a Gemini API key — no eBay developer account needed
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            List faster.
            <br />
            <span className="text-[#0064D2]">Sell smarter.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            The AI assistant that helps eBay resellers identify products, research pricing,
            generate listings, and copy everything to eBay — in minutes, not hours.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/list"
              className={cn(
                buttonVariants({ size: "lg" }),
                "rounded-xl bg-[#0064D2] px-8 hover:bg-[#0053b3]"
              )}
            >
              Start Listing Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ size: "lg", variant: "outline" }), "rounded-xl")}
            >
              View Dashboard
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="border-t bg-muted/30 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold tracking-tight">How it works</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ step, title, desc }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#0064D2] text-sm font-bold text-white">
                  {step}
                </div>
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Everything you need to resell on eBay
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            Built for resellers who want AI power without the complexity of eBay developer APIs.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#0064D2]/10">
                  <Icon className="h-5 w-5 text-[#0064D2]" />
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t bg-[#0064D2]/5 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold">Ready to list your first item?</h2>
          <p className="mt-3 text-muted-foreground">
            Add your Gemini API key in Vercel, upload a photo, and get a complete eBay listing kit in under 5 minutes.
          </p>
          <Link
            href="/list"
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-6 rounded-xl bg-[#0064D2] px-8 hover:bg-[#0053b3]"
            )}
          >
            Create Your First Listing
          </Link>
        </div>
      </section>

      <footer className="border-t px-4 py-8 text-center text-sm text-muted-foreground">
        <p>ResellAI — AI-Powered eBay Reseller Assistant</p>
      </footer>
    </div>
  );
}
