"use client";

import { useState } from "react";
import { Copy, Check, Download, Package, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildListingExportText, downloadPhotosAsZip } from "@/lib/export-listing";
import { formatCurrency } from "@/lib/profit-calculator";
import type { GeneratedListing, ProductAnalysis, ProfitBreakdown } from "@/types";

interface CopyToEbayKitProps {
  listing: GeneratedListing;
  analysis?: ProductAnalysis | null;
  photos: string[];
  enhancedPhotos: string[];
  price: number;
  profit?: ProfitBreakdown | null;
}

export function CopyToEbayKit({
  listing,
  analysis,
  photos,
  enhancedPhotos,
  price,
  profit,
}: CopyToEbayKitProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const displayPhotos = enhancedPhotos.filter(Boolean).length
    ? photos.map((p, i) => enhancedPhotos[i] || p)
    : photos;

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied — paste into eBay`);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCopyAll = () => {
    copy(
      buildListingExportText({ listing, analysis, price }),
      "Full listing kit"
    );
  };

  const handleDownloadPhotos = async () => {
    try {
      await downloadPhotosAsZip(displayPhotos);
      toast.success("Photos downloaded — upload them to your eBay listing");
    } catch {
      toast.error("Could not download photos");
    }
  };

  return (
    <Card className="border-2 border-[#0064D2]/20 bg-gradient-to-br from-[#0064D2]/5 to-transparent shadow-lg">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-[#0064D2]" />
            <CardTitle className="text-lg">Copy to eBay Kit</CardTitle>
          </div>
          <Badge className="bg-[#0064D2]">No eBay API needed</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Copy each piece below and paste directly into eBay&apos;s listing form.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <CopyBlock
            label="Title"
            value={listing.title}
            copied={copied === "Title"}
            onCopy={() => copy(listing.title, "Title")}
          />
          <CopyBlock
            label="Price"
            value={formatCurrency(price)}
            copied={copied === "Price"}
            onCopy={() => copy(price.toFixed(2), "Price")}
          />
        </div>

        <CopyBlock
          label="Description"
          value={listing.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}
          copied={copied === "Description"}
          onCopy={() => copy(listing.description, "Description")}
          multiline
        />

        <CopyBlock
          label="Keywords"
          value={listing.keywords.join(", ")}
          copied={copied === "Keywords"}
          onCopy={() => copy(listing.keywords.join(", "), "Keywords")}
        />

        {profit && (
          <div className="rounded-xl bg-green-500/10 p-4 text-sm">
            <p className="font-medium text-green-700 dark:text-green-400">
              Expected profit at this price: {formatCurrency(profit.netProfit)} ({profit.roiPercentage}% ROI)
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1 rounded-xl bg-[#0064D2] hover:bg-[#0053b3]" onClick={handleCopyAll}>
            {copied === "Full listing kit" ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            Copy Everything
          </Button>
          {displayPhotos.length > 0 && (
            <Button variant="outline" className="flex-1 rounded-xl" onClick={handleDownloadPhotos}>
              <Download className="mr-2 h-4 w-4" />
              Download Photos ({displayPhotos.length})
            </Button>
          )}
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#0064D2]" />
          <p>
            Open eBay → Sell → Create listing → paste your title, description, and item specifics.
            Upload the downloaded photos and set your price. Done in under 2 minutes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function CopyBlock({
  label,
  value,
  copied,
  onCopy,
  multiline,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
  multiline?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-background p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={onCopy}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
      <p className={`text-sm font-medium ${multiline ? "line-clamp-4" : "truncate"}`}>{value}</p>
    </div>
  );
}
