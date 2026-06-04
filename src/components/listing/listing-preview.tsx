"use client";

import { motion } from "framer-motion";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { GeneratedListing } from "@/types";
import { toast } from "sonner";

interface ListingPreviewProps {
  listing: GeneratedListing;
  onTitleChange?: (title: string) => void;
  onDescriptionChange?: (description: string) => void;
}

export function ListingPreview({ listing, onTitleChange, onDescriptionChange }: ListingPreviewProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied`);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Generated Listing</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copy(listing.title, "Title")}
            >
              {copied === "Title" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              Title ({listing.title.length}/80)
            </p>
            <input
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-medium"
              value={listing.title}
              maxLength={80}
              onChange={(e) => onTitleChange?.(e.target.value)}
            />
          </div>

          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Description</p>
            <Textarea
              value={listing.description}
              rows={8}
              className="font-mono text-sm"
              onChange={(e) => onDescriptionChange?.(e.target.value)}
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Keywords</p>
            <div className="flex flex-wrap gap-1.5">
              {listing.keywords.map((kw) => (
                <Badge key={kw} variant="secondary" className="text-xs">
                  {kw}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Item Specifics</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries(listing.itemSpecifics).map(([key, value]) => (
                <div key={key} className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">{key}:</span> {value}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
              Shipping Suggestions
            </p>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <p><span className="text-muted-foreground">Weight:</span> {listing.shippingSuggestions.weight}</p>
              <p><span className="text-muted-foreground">Dimensions:</span> {listing.shippingSuggestions.dimensions}</p>
              <p><span className="text-muted-foreground">Service:</span> {listing.shippingSuggestions.recommendedService}</p>
              <p><span className="text-muted-foreground">Est. Cost:</span> ${listing.shippingSuggestions.estimatedCost.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
