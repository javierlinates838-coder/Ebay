"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  Save,
  Upload as UploadIcon,
} from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/layout/app-nav";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhotoUpload } from "@/components/listing/photo-upload";
import { ProductAnalysisCard } from "@/components/listing/product-analysis-card";
import { MarketResearchCard } from "@/components/listing/market-research-card";
import { ListingPreview } from "@/components/listing/listing-preview";
import { ProfitCalculator } from "@/components/listing/profit-calculator";
import { StepIndicator } from "@/components/listing/step-indicator";
import { useListingWorkflow } from "@/hooks/use-listing-workflow";
import { useInventory } from "@/hooks/use-inventory";
import { formatCurrency } from "@/lib/profit-calculator";

export default function NewListingPage() {
  const workflow = useListingWorkflow();
  const { saveListing } = useInventory();
  const { state, setStep } = workflow;

  const [shippingCost, setShippingCost] = useState(0);
  const [costOfGoods, setCostOfGoods] = useState(0);
  const [marketQuery, setMarketQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const completedSteps = [
    state.photos.length > 0 ? "photos" : null,
    state.analysis ? "analysis" : null,
    state.market ? "market" : null,
    state.generatedListing ? "listing" : null,
    state.profit ? "profit" : null,
  ].filter(Boolean) as string[];

  const handleAnalyze = async () => {
    if (state.photos.length === 0) {
      toast.error("Please upload at least one photo");
      return;
    }
    try {
      await workflow.analyzePhotos();
      toast.success("Product identified!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analysis failed");
    }
  };

  const handleMarketResearch = async () => {
    if (!state.analysis) return;
    const query =
      marketQuery.trim() ||
      `${state.analysis.brand} ${state.analysis.model} ${state.analysis.product}`.trim();

    if (!query) {
      toast.error("Enter a search term for market research");
      return;
    }

    try {
      await workflow.researchMarket(query);
      toast.success("Market research complete");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Market research failed");
    }
  };

  const handleGenerateListing = async () => {
    try {
      await workflow.generateListing();
      toast.success("Listing generated!");
    } catch {
      toast.error("Listing generation failed");
    }
  };

  const handleCalculateProfit = async () => {
    try {
      await workflow.calculateProfit({
        costOfGoods,
        listingPrice: state.listingPrice,
        shippingCost,
      });
      toast.success("Profit calculated");
    } catch {
      toast.error("Calculation failed");
    }
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await saveListing({
        title: state.generatedListing?.title || state.analysis?.product || "Untitled Listing",
        description: state.generatedListing?.description,
        status: "draft",
        product_analysis: state.analysis,
        market_research: state.market,
        generated_listing: state.generatedListing,
        pricing: state.pricing,
        profit: state.profit,
        photos: state.photos,
        enhanced_photos: state.enhancedPhotos,
        category: state.analysis?.category,
        listing_price: state.listingPrice,
        cost_of_goods: costOfGoods,
        keywords: state.generatedListing?.keywords,
        item_specifics: state.generatedListing?.itemSpecifics,
      });
      toast.success("Draft saved to inventory");
    } catch {
      toast.error("Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const handlePublishEbay = async () => {
    setPublishing(true);
    try {
      const listing = await saveListing({
        title: state.generatedListing?.title || "Untitled",
        description: state.generatedListing?.description,
        status: "draft",
        product_analysis: state.analysis,
        market_research: state.market,
        generated_listing: state.generatedListing,
        pricing: state.pricing,
        profit: state.profit,
        photos: state.photos,
        enhanced_photos: state.enhancedPhotos,
        category: state.analysis?.category,
        listing_price: state.listingPrice,
        cost_of_goods: costOfGoods,
        keywords: state.generatedListing?.keywords,
        item_specifics: state.generatedListing?.itemSpecifics,
      });

      const res = await fetch("/api/ebay/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Connect eBay account in Settings first");
        return;
      }

      toast.success("Published to eBay!");
    } catch {
      toast.error("Publish failed — connect eBay in Settings");
    } finally {
      setPublishing(false);
    }
  };

  const handleEnhanced = useCallback(
    (index: number, enhanced: string) => {
      workflow.setState((s) => {
        const photos = [...s.enhancedPhotos];
        photos[index] = enhanced;
        return { ...s, enhancedPhotos: photos };
      });
      toast.success("Photo enhanced");
    },
    [workflow]
  );

  return (
    <>
      <AppHeader title="New Listing" />
      <main className="flex-1 p-4 sm:p-6">
        <div className="mx-auto max-w-3xl">
          <StepIndicator currentStep={state.step} completedSteps={completedSteps} />

          {state.error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <motion.div
            key={state.step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
          >
            {state.step === "photos" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Upload Photos</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add 1-10 photos. AI will identify your product automatically.
                  </p>
                </div>
                <PhotoUpload
                  photos={state.photos}
                  enhancedPhotos={state.enhancedPhotos}
                  onAdd={workflow.addPhotos}
                  onRemove={workflow.removePhoto}
                  onEnhanced={handleEnhanced}
                />
                <Button
                  className="w-full rounded-xl sm:w-auto"
                  size="lg"
                  disabled={state.photos.length === 0 || state.loading}
                  onClick={handleAnalyze}
                >
                  {state.loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <UploadIcon className="mr-2 h-4 w-4" />
                  )}
                  Analyze with AI
                </Button>
              </div>
            )}

            {state.step === "analysis" && state.analysis && (
              <div className="space-y-6">
                <ProductAnalysisCard analysis={state.analysis} />
                <div className="space-y-2">
                  <Label htmlFor="market-query">Market search term</Label>
                  <Input
                    id="market-query"
                    placeholder={`e.g. ${state.analysis.brand} ${state.analysis.model}`}
                    value={marketQuery}
                    onChange={(e) => setMarketQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleMarketResearch();
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Search eBay sold comps. Works in demo mode without API keys.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep("photos")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handleMarketResearch} disabled={state.loading}>
                    {state.loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="mr-2 h-4 w-4" />
                    )}
                    Research Market
                  </Button>
                </div>
              </div>
            )}

            {state.step === "market" && state.market && state.pricing && (
              <div className="space-y-6">
                <MarketResearchCard market={state.market} pricing={state.pricing} />
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep("analysis")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handleGenerateListing} disabled={state.loading}>
                    {state.loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="mr-2 h-4 w-4" />
                    )}
                    Generate Listing
                  </Button>
                </div>
              </div>
            )}

            {state.step === "listing" && state.generatedListing && (
              <div className="space-y-6">
                <ListingPreview listing={state.generatedListing} />
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep("market")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={() => setStep("profit")}>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Calculate Profit
                  </Button>
                </div>
              </div>
            )}

            {state.step === "profit" && (
              <div className="space-y-6">
                <ProfitCalculator
                  profit={state.profit}
                  salePrice={state.listingPrice}
                  costOfGoods={costOfGoods}
                  shippingCost={shippingCost || state.generatedListing?.shippingSuggestions.estimatedCost || 0}
                  onSalePriceChange={workflow.updateListingPrice}
                  onCostChange={setCostOfGoods}
                  onShippingChange={setShippingCost}
                  onCalculate={handleCalculateProfit}
                  loading={state.loading}
                />
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep("listing")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={() => setStep("review")} disabled={!state.profit}>
                    Review & Publish
                  </Button>
                </div>
              </div>
            )}

            {state.step === "review" && (
              <div className="space-y-6">
                <div className="rounded-2xl border bg-card p-6 shadow-lg">
                  <h2 className="text-xl font-semibold">Ready to List</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Review your listing before saving or publishing to eBay.
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-muted/50 p-4">
                      <p className="text-xs text-muted-foreground">Title</p>
                      <p className="mt-1 font-medium">{state.generatedListing?.title}</p>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-4">
                      <p className="text-xs text-muted-foreground">List Price</p>
                      <p className="mt-1 text-xl font-bold">{formatCurrency(state.listingPrice)}</p>
                    </div>
                    {state.profit && (
                      <div className="rounded-xl bg-green-500/10 p-4 sm:col-span-2">
                        <p className="text-xs text-muted-foreground">Expected Net Profit</p>
                        <p className="mt-1 text-xl font-bold text-green-600">
                          {formatCurrency(state.profit.netProfit)} ({state.profit.roiPercentage}% ROI)
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl"
                      onClick={handleSaveDraft}
                      disabled={saving}
                    >
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Draft
                    </Button>
                    <Button
                      className="flex-1 rounded-xl"
                      onClick={handlePublishEbay}
                      disabled={publishing}
                    >
                      {publishing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <UploadIcon className="mr-2 h-4 w-4" />
                      )}
                      Publish to eBay
                    </Button>
                  </div>
                </div>

                <Button variant="ghost" onClick={() => setStep("profit")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Profit
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </>
  );
}
