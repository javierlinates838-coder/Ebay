"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Sparkles, Database, ShoppingBag, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AppConfig {
  ai: boolean;
  gemini: boolean;
  supabaseStorage: boolean;
  ebay: boolean;
  demoMode: boolean;
}

export function SetupChecklist() {
  const [config, setConfig] = useState<AppConfig | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => setConfig(null));
  }, []);

  if (!config) return null;

  const steps = [
    {
      id: "ai",
      done: config.ai,
      icon: Sparkles,
      title: "Connect AI (Gemini)",
      desc: "Add GEMINI_API_KEY in Vercel for real photo identification",
      href: "/settings",
    },
    {
      id: "supabase",
      done: config.supabaseStorage,
      icon: Database,
      title: "Cloud inventory (optional)",
      desc: "Add Supabase keys to sync inventory across devices",
      href: "/settings",
    },
    {
      id: "ebay",
      done: config.ebay,
      icon: ShoppingBag,
      title: "eBay API (optional)",
      desc: "Skip this — use Copy to eBay Kit for manual listing",
      href: "/settings",
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  if (completed === steps.length) return null;

  return (
    <Card className="border-[#0064D2]/20 bg-gradient-to-br from-[#0064D2]/5 to-transparent shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Setup Checklist</CardTitle>
          <span className="text-xs text-muted-foreground">
            {completed}/{steps.length} complete
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-[#0064D2] transition-all"
            style={{ width: `${(completed / steps.length) * 100}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {steps.map(({ id, done, icon: Icon, title, desc, href }) => (
          <Link
            key={id}
            href={href}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/50",
              done && "opacity-60"
            )}
          >
            {done ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
            ) : (
              <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5 text-[#0064D2]" />
                <p className="text-sm font-medium">{title}</p>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
            </div>
          </Link>
        ))}
        <Link href="/list">
          <Button className="mt-2 w-full rounded-xl bg-[#0064D2] hover:bg-[#0053b3]">
            Start Your First Listing
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
