"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Sparkles,
  Database,
  ShoppingBag,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AIHealthResult } from "@/lib/ai/health-check";
import { SUCCESS_CHECKLIST } from "@/lib/ai/health-check";

interface AppConfig {
  ai: boolean;
  gemini: boolean;
  supabaseStorage: boolean;
  ebay: boolean;
  demoMode: boolean;
}

export function SetupChecklist() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [health, setHealth] = useState<AIHealthResult | null>(null);
  const [testing, setTesting] = useState(false);

  const runHealthCheck = useCallback(async () => {
    setTesting(true);
    try {
      const res = await fetch("/api/ai/health");
      const data: AIHealthResult = await res.json();
      setHealth(data);
      if (data.ok && data.googleSearch) {
        toast.success("AI ready — Gemini + Google Search working");
      } else if (data.ok) {
        toast.warning("Gemini works but Google Search grounding is off — IDs may be less accurate");
      } else {
        toast.error(data.fix || data.error || "AI connection failed");
      }
    } catch {
      toast.error("Could not reach AI health check");
    } finally {
      setTesting(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((c) => {
        setConfig(c);
        if (c.ai) runHealthCheck();
      })
      .catch(() => setConfig(null));
  }, [runHealthCheck]);

  if (!config) return null;

  const aiVerified = health?.ok && health.textPing;
  const aiFullPower = health?.ok && health.googleSearch;

  const steps = [
    {
      id: "ai",
      done: aiVerified,
      icon: Sparkles,
      title: aiFullPower
        ? "AI ready (Google Search + Vision)"
        : aiVerified
          ? "AI connected (vision only)"
          : config.gemini
            ? "AI key set — test connection"
            : "Connect AI (Gemini)",
      desc: aiFullPower
        ? "Lens-style identification is active"
        : config.gemini
          ? "Run test in Settings or click Test below"
          : "Add GEMINI_API_KEY in Vercel, redeploy, then test",
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

  const requiredDone = aiVerified;
  const completed = steps.filter((s) => s.done).length;

  if (requiredDone && completed === steps.length) return null;

  return (
    <Card className="border-[#0064D2]/20 bg-gradient-to-br from-[#0064D2]/5 to-transparent shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Get analysis working</CardTitle>
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
      <CardContent className="space-y-4">
        <ol className="space-y-1.5 text-xs text-muted-foreground">
          {SUCCESS_CHECKLIST.map(({ step, title, detail }) => (
            <li key={step} className="flex gap-2">
              <span className="font-medium text-foreground">{step}.</span>
              <span>
                <strong className="text-foreground">{title}</strong> — {detail}
              </span>
            </li>
          ))}
        </ol>

        {steps.map(({ id, done, icon: Icon, title, desc, href }) => (
          <Link
            key={id}
            href={href}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/50",
              done && "border-green-500/30 bg-green-500/5"
            )}
          >
            {done ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
            ) : id === "ai" && health && !health.ok ? (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            ) : (
              <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5 text-[#0064D2]" />
                <p className="text-sm font-medium">{title}</p>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
              {id === "ai" && health?.fix && !health.ok && (
                <p className="mt-1 text-xs text-destructive">{health.fix}</p>
              )}
            </div>
          </Link>
        ))}

        {config.gemini && (
          <Button
            variant="outline"
            className="w-full rounded-xl"
            disabled={testing}
            onClick={runHealthCheck}
          >
            {testing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Test AI connection
          </Button>
        )}

        <Link href="/list">
          <Button
            className="w-full rounded-xl bg-[#0064D2] hover:bg-[#0053b3]"
            disabled={!aiVerified}
          >
            {aiVerified ? "Start Your First Listing" : "Fix AI first, then list"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
