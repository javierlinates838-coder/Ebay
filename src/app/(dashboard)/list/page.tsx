"use client";

import { Suspense, useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  Save,
  Upload as UploadIcon,
  CheckCircle2,
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
import { CopyToEbayKit } from "@/components/listing/copy-to-ebay-kit";
import { StepIndicator } from "@/components/listing/step-indicator";
import { useListingWorkflow } from "@/hooks/use-listing-workflow";
import { useInventory } from "@/hooks/use-inventory";
import { formatCurrency } from "@/lib/profit-calculator";

export default function NewListingPage() {
  return (
    <Suspense fallback={<AppHeader title="New Listing" />}>
      <NewListingContent />
    </Suspense>
  );
}

function NewListingContent() {
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draft");

  const workflow = useListingWorkflow();
  const { saveListing, listings } = useInventory();
  const { state, setStep } = workflow;

  const [marketQuery, setMarketQuery] = useState("");
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [ebayConfigured, setEbayConfigured] = useState(false);
  const loadedDraftRef = useRef<string | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((c) => setEbayConfigured(c.ebayConfigured ?? false))
      .catch(() => setEbayConfigured(false));
  }, []);

  useEffect(() => {
    if (!draftId || !listings.length) return;
    if (loadedDraftRef.current === draftId) return;
    const draft = listings.find((l) => l.id === draftId);
    if (!draft) return;
    loadedDraftRef.current = draftId;
    workflow.loadFromListing(draft);
    toast.info("Draft loaded — continue where you left off");
  }, [draftId, listings, workflow]);

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
      const result = await workflow.analyzePhotos(state.photos);
      if (result.analysis.searchQuery) {
        setMarketQuery(result.analysis.searchQuery);
      }
      if (result.warning) {
        toast.warning(result.warning);
      } else if (result.source === "demo") {
        toast.info("Demo mode — add GEMINI_API_KEY in Vercel for real AI identification.");
      } else if (result.analysis.confidence >= 80) {
        toast.success("Product identified with high confidence!");
      } else {
        toast.success("Product identified — verify details below.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analysis failed");
    }
  };

  const handleMarketResearch = async () => {
    if (!state.analysis) return;
    const query =
      marketQuery.trim() ||
      state.analysis.searchQuery?.trim() ||
      `${state.analysis.brand} ${state.analysis.model} ${state.analysis.product}`.trim();

    if (!query) {
      toast.error("Enter a search term for market research");
      return;
    }

    try {
      await workflow.researchMarket(query, state.analysis);
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
        costOfGoods: state.costOfGoods,
        listingPrice: state.listingPrice,
        shippingCost: state.shippingCost,
      });
      toast.success("Profit calculated");
    } catch {
      toast.error("Calculation failed");
    }
  };

  const buildListingPayload = useCallback(
    (status: "draft" | "listed" = "draft") => ({
      id: state.savedDraftId ?? undefined,
      title: state.generatedListing?.title || state.analysis?.product || "Untitled Listing",
      description: state.generatedListing?.description,
      status,
      product_analysis: state.analysis,
      market_research: state.market,
      generated_listing: state.generatedListing,
      pricing: state.pricing,
      profit: state.profit,
      photos: state.photos,
      enhanced_photos: state.enhancedPhotos,
      category: state.analysis?.category,
      listing_price: state.listingPrice,
      cost_of_goods: state.costOfGoods,
      keywords: state.generatedListing?.keywords,
      item_specifics: state.generatedListing?.itemSpecifics,
    }),
    [state]
  );

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const saved = await saveListing(buildListingPayload("draft"));
      workflow.setSavedDraftId(saved.id);
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
      const listing = await saveListing(buildListingPayload("draft"));

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

  const handleSelectPrice = (price: number) => {
    workflow.updateListingPrice(price);
    toast.success(`Price set to ${formatCurrency(price)}`);
  };

  const handleGoToReview = async () => {
    if (!state.profit && state.listingPrice) {
      await handleCalculateProfit();
    }
    setStep("review");
  };

  return (
    <>
      <AppHeader title={draftId ? "Resume Listing" : "New Listing"} />
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
                    Add 1-10 photos. Include the brand tag, care label, and model number for best accuracy.
                  </p>
                </div>
                <PhotoUpload
                  photos={state.photos}
                  enhancedPhotos={state.enhancedPhotos}
                  onAdd={workflow.addPhotos}
                  onRemove={workflow.removePhoto}
                  onEnhanced={handleEnhanced}
                  onProcessingChange={setUploadingPhotos}
                />
                <Button
                  className="w-full rounded-xl bg-[#0064D2] hover:bg-[#0053b3] sm:w-auto"
                  size="lg"
                  disabled={state.photos.length === 0 || state.loading || uploadingPhotos}
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
                <ProductAnalysisCard
                  analysis={state.analysis}
                  editable
                  source={state.analysisSource ?? undefined}
                  warning={state.analysisWarning ?? undefined}
                  onChange={workflow.updateAnalysis}
                />
                <div className="space-y-2">
                  <Label htmlFor="market-query">Market search term</Label>
                  <Input
                    id="market-query"
                    placeholder={
                      state.analysis.searchQuery ||
                      `e.g. ${state.analysis.brand} ${state.analysis.model}`
                    }
                    value={marketQuery}
                    onChange={(e) => setMarketQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleMarketResearch();
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    {ebayConfigured
                      ? "Search live eBay sold comps for pricing."
                      : "AI will estimate pricing based on your product — no eBay keys needed."}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep("photos")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    className="bg-[#0064D2] hover:bg-[#0053b3]"
                    onClick={handleMarketResearch}
                    disabled={state.loading}
                  >
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
                <MarketResearchCard
                  market={state.market}
                  pricing={state.pricing}
                  source={state.marketSource ?? "demo"}
                  selectedPrice={state.listingPrice}
                  onSelectPrice={handleSelectPrice}
                />
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep("analysis")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    className="bg-[#0064D2] hover:bg-[#0053b3]"
                    onClick={handleGenerateListing}
                    disabled={state.loading}
                  >
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
                <ListingPreview
                  listing={state.generatedListing}
                  onTitleChange={(title) => workflow.updateGeneratedListing({ title })}
                  onDescriptionChange={(description) =>
                    workflow.updateGeneratedListing({ description })
                  }
                />
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep("market")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button className="bg-[#0064D2] hover:bg-[#0053b3]" onClick={() => setStep("profit")}>
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
                  costOfGoods={state.costOfGoods}
                  shippingCost={
                    state.shippingCost || state.generatedListing?.shippingSuggestions.estimatedCost || 0
                  }
                  onSalePriceChange={workflow.updateListingPrice}
                  onCostChange={workflow.updateCostOfGoods}
                  onShippingChange={workflow.updateShippingCost}
                  onCalculate={handleCalculateProfit}
                  loading={state.loading}
                />
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep("listing")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    className="bg-[#0064D2] hover:bg-[#0053b3]"
                    onClick={handleGoToReview}
                    disabled={state.loading}
                  >
                    Review & Finish
                  </Button>
                </div>
              </div>
            )}

            {state.step === "review" && (
              <div className="space-y-6">
                <CopyToEbayKit
                  listing={state.generatedListing!}
                  analysis={state.analysis}
                  photos={state.photos}
                  enhancedPhotos={state.enhancedPhotos}
                  price={state.listingPrice}
                  profit={state.profit}
                />

                <div className="rounded-2xl border bg-card p-6 shadow-lg">
                  <h2 className="text-xl font-semibold">Summary</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Save to inventory or publish directly if eBay is connected.
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
                      {saving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save to Inventory
                    </Button>
                    {ebayConfigured ? (
                      <Button
                        className="flex-1 rounded-xl bg-[#0064D2] hover:bg-[#0053b3]"
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
                    ) : (
                      <Button
                        className="flex-1 rounded-xl bg-green-600 hover:bg-green-700"
                        onClick={async () => {
                          await handleSaveDraft();
                          toast.success(
                            "Saved! Use the Copy to eBay Kit above to list manually.",
                            { icon: <CheckCircle2 className="h-4 w-4" /> }
                          );
                        }}
                        disabled={saving}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Mark Ready to List
                      </Button>
                    )}
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
