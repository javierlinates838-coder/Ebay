"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ExternalLink, Link2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/layout/app-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AppConfig {
  ai: boolean;
  aiProvider: "gemini" | "openai" | null;
  gemini: boolean;
  openai: boolean;
  ebay: boolean;
  ebayBrowse: boolean;
  photoroom: boolean;
  supabase: boolean;
  supabaseStorage: boolean;
  demoMode: boolean;
  ebayConfigured: boolean;
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<AppHeader title="Settings" />}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [config, setConfig] = useState<AppConfig | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then(setConfig)
      .catch(() => setConfig(null));
  }, []);

  useEffect(() => {
    const ebayConnected = searchParams.get("ebay_connected");
    const ebayError = searchParams.get("ebay_error");

    if (ebayConnected === "true") {
      setConnected(true);
      toast.success("eBay account connected");
    }

    if (ebayError) {
      toast.error(`eBay connection failed: ${ebayError.replace(/_/g, " ")}`);
    }
  }, [searchParams]);

  const handleConnectEbay = async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/ebay/oauth");
      const data = await res.json();

      if (data.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
        toast.info("Complete authorization in the eBay window");
      } else {
        toast.error(
          data.error ||
            "eBay OAuth not configured. Add EBAY_CLIENT_ID, EBAY_CLIENT_SECRET, EBAY_ENV, and EBAY_REDIRECT_URI in Vercel."
        );
      }
    } catch {
      toast.error("Failed to start eBay connection");
    } finally {
      setConnecting(false);
    }
  };

  const envStatus = [
    { name: "Google Gemini", key: "GEMINI_API_KEY", configured: config?.gemini ?? false },
    {
      name: "Gemini Vision Model (optional)",
      key: "GEMINI_VISION_MODEL (default: gemini-2.5-flash)",
      configured: config?.gemini ?? false,
    },
    { name: "OpenAI (optional)", key: "OPENAI_API_KEY", configured: config?.openai ?? false },
    {
      name: "Supabase URL + Anon Key",
      key: "NEXT_PUBLIC_SUPABASE_URL + ANON_KEY",
      configured: config?.supabase ?? false,
    },
    {
      name: "Supabase Service Role (inventory)",
      key: "SUPABASE_SERVICE_ROLE_KEY",
      configured: config?.supabaseStorage ?? false,
    },
    { name: "eBay OAuth (optional)", key: "EBAY_CLIENT_ID + REDIRECT_URI", configured: config?.ebay ?? false },
    { name: "eBay Market Search (optional)", key: "EBAY_CLIENT_ID + SECRET", configured: config?.ebayBrowse ?? false },
    { name: "PhotoRoom (optional)", key: "PHOTOROOM_API_KEY", configured: config?.photoroom ?? false },
  ];

  return (
    <>
      <AppHeader title="Settings" />
      <main className="flex-1 p-4 sm:p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {config?.demoMode && (
            <Alert className="border-[#0064D2]/20 bg-[#0064D2]/5">
              <AlertDescription>
                eBay API is not configured — that&apos;s fine! Use the{" "}
                <strong>Copy to eBay Kit</strong> on the review step to paste listings manually.
                {config.ai
                  ? " AI photo analysis and pricing estimates are active."
                  : " Add GEMINI_API_KEY for real AI identification and pricing."}
              </AlertDescription>
            </Alert>
          )}

          {!config?.demoMode && config?.ebayConfigured && (
            <Alert>
              <AlertDescription>
                eBay API is connected — live market research and one-click publish are available.
              </AlertDescription>
            </Alert>
          )}

          {config?.ai && config.aiProvider && (
            <Alert>
              <AlertDescription>
                AI is active via {config.aiProvider === "gemini" ? "Google Gemini" : "OpenAI"}.
              </AlertDescription>
            </Alert>
          )}

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>eBay Account</CardTitle>
              <CardDescription>
                Connect your eBay seller account to publish listings with one click.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0064D2]/10 text-[#0064D2] font-bold text-sm">
                    eBay
                  </div>
                  <div>
                    <p className="font-medium">Seller Account</p>
                    <p className="text-sm text-muted-foreground">
                      {connected ? "Connected" : "Not connected"}
                    </p>
                  </div>
                </div>
                {connected ? (
                  <Badge variant="outline" className="text-green-600">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Connected
                  </Badge>
                ) : (
                  <Button onClick={handleConnectEbay} disabled={connecting} className="rounded-xl">
                    <Link2 className="mr-2 h-4 w-4" />
                    Connect
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Requires eBay Developer Program credentials.{" "}
                <a
                  href="https://developer.ebay.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Get API keys <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                All keys are optional. The app works without them in demo mode.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {envStatus.map(({ name, key, configured }) => (
                  <div key={key} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{key}</p>
                    </div>
                    {configured ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <p className="text-xs text-muted-foreground">
                No eBay developer account? Skip the eBay keys entirely — use Copy to eBay Kit for manual listing.
                For Supabase, run both SQL migrations in your project SQL editor after adding the keys.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">About ResellAI</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Version 2.0.0</p>
              <p className="mt-2">
                AI-powered eBay reseller assistant. Built with Next.js, Gemini, and Supabase.
                Works without eBay developer keys via Copy to eBay Kit.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
