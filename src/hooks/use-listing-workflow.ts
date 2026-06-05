"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { dataUrlToBlob } from "@/lib/data-url";
import type {
  GeneratedListing,
  Listing,
  MarketResearch,
  PricingRecommendation,
  ProductAnalysis,
  ProfitBreakdown,
} from "@/types";

export type MarketResearchSource = "ebay-live" | "ai-estimate" | "demo";

export type ListingStep = "photos" | "analysis" | "market" | "listing" | "profit" | "review";

export interface ListingWorkflowState {
  step: ListingStep;
  photos: string[];
  enhancedPhotos: string[];
  analysis: ProductAnalysis | null;
  analysisSource: "gemini" | "openai" | "demo" | null;
  analysisWarning: string | null;
  marketSource: MarketResearchSource | null;
  market: MarketResearch | null;
  pricing: PricingRecommendation | null;
  generatedListing: GeneratedListing | null;
  profit: ProfitBreakdown | null;
  costOfGoods: number;
  shippingCost: number;
  savedDraftId: string | null;
  listingPrice: number;
  loading: boolean;
  error: string | null;
}

const initialState: ListingWorkflowState = {
  step: "photos",
  photos: [],
  enhancedPhotos: [],
  analysis: null,
  analysisSource: null,
  analysisWarning: null,
  marketSource: null,
  market: null,
  pricing: null,
  generatedListing: null,
  profit: null,
  costOfGoods: 0,
  shippingCost: 0,
  savedDraftId: null,
  listingPrice: 0,
  loading: false,
  error: null,
};

export function useListingWorkflow() {
  const [state, setState] = useState<ListingWorkflowState>(initialState);
  const photosRef = useRef<string[]>([]);

  useEffect(() => {
    photosRef.current = state.photos;
  }, [state.photos]);

  const setStep = useCallback((step: ListingStep) => {
    setState((s) => ({ ...s, step }));
  }, []);

  const addPhotos = useCallback((photos: string[]) => {
    setState((s) => ({
      ...s,
      photos: [...s.photos, ...photos].slice(0, 10),
    }));
  }, []);

  const removePhoto = useCallback((index: number) => {
    setState((s) => ({
      ...s,
      photos: s.photos.filter((_, i) => i !== index),
      enhancedPhotos: s.enhancedPhotos.filter((_, i) => i !== index),
    }));
  }, []);

  const analyzePhotos = useCallback(async (photosOverride?: string[]) => {
    const photos = (photosOverride ?? photosRef.current).filter(Boolean);

    if (!photos.length) {
      throw new Error("Please upload at least one photo");
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const formData = new FormData();
      for (const [index, photo] of photos.slice(0, 5).entries()) {
        formData.append("images", dataUrlToBlob(photo), `photo-${index + 1}.jpg`);
      }

      const res = await fetch("/api/ai/analyze-photos", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");

      setState((s) => ({
        ...s,
        analysis: data.analysis,
        analysisSource: data.source ?? null,
        analysisWarning: data.warning ?? null,
        step: "analysis",
        loading: false,
      }));
      return {
        analysis: data.analysis as ProductAnalysis,
        source: data.source,
        warning: data.warning as string | undefined,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      setState((s) => ({ ...s, loading: false, error: message }));
      throw err;
    }
  }, []);

  const researchMarket = useCallback(async (query: string, analysis?: ProductAnalysis | null) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch("/api/ebay/market-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, analysis }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Market research failed");

      setState((s) => ({
        ...s,
        market: data.market,
        pricing: data.pricing,
        marketSource: data.source ?? "demo",
        listingPrice: data.market.suggestedListingPrice,
        step: "market",
        loading: false,
      }));
      return { market: data.market, pricing: data.pricing, source: data.source };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Market research failed";
      setState((s) => ({ ...s, loading: false, error: message }));
      throw err;
    }
  }, []);

  const generateListing = useCallback(async () => {
    if (!state.analysis) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch("/api/ai/generate-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis: state.analysis,
          marketPrice: state.listingPrice,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Listing generation failed");

      setState((s) => ({
        ...s,
        generatedListing: data.listing,
        step: "listing",
        loading: false,
      }));
      return data.listing as GeneratedListing;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Listing generation failed";
      setState((s) => ({ ...s, loading: false, error: message }));
      throw err;
    }
  }, [state.analysis, state.listingPrice]);

  const calculateProfit = useCallback(async (params: { costOfGoods: number; listingPrice: number; shippingCost?: number }) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const shippingCost = params.shippingCost ?? state.generatedListing?.shippingSuggestions.estimatedCost ?? 0;
      const res = await fetch("/api/profit/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salePrice: params.listingPrice,
          shippingCost,
          costOfGoods: params.costOfGoods,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Profit calculation failed");

      setState((s) => ({
        ...s,
        profit: data.profit,
        costOfGoods: params.costOfGoods,
        listingPrice: params.listingPrice,
        step: "profit",
        loading: false,
      }));
      return data.profit as ProfitBreakdown;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Profit calculation failed";
      setState((s) => ({ ...s, loading: false, error: message }));
      throw err;
    }
  }, [state.generatedListing]);

  const enhancePhoto = useCallback(async (index: number) => {
    const photo = state.photos[index];
    if (!photo) return;

    try {
      const res = await fetch("/api/photos/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: photo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setState((s) => {
        const enhanced = [...s.enhancedPhotos];
        enhanced[index] = data.enhancedImage;
        return { ...s, enhancedPhotos: enhanced };
      });
    } catch {
      // Client-side fallback handled in component
    }
  }, [state.photos]);

  const updateAnalysis = useCallback((analysis: ProductAnalysis) => {
    setState((s) => ({ ...s, analysis }));
  }, []);

  const updateGeneratedListing = useCallback((updates: Partial<GeneratedListing>) => {
    setState((s) =>
      s.generatedListing
        ? { ...s, generatedListing: { ...s.generatedListing, ...updates } }
        : s
    );
  }, []);

  const loadFromListing = useCallback((listing: Listing) => {
    setState({
      step: listing.generated_listing ? "review" : listing.market_research ? "market" : listing.product_analysis ? "analysis" : "photos",
      photos: listing.photos || [],
      enhancedPhotos: listing.enhanced_photos || [],
      analysis: listing.product_analysis,
      analysisSource: null,
      analysisWarning: null,
      marketSource: null,
      market: listing.market_research,
      pricing: listing.pricing,
      generatedListing: listing.generated_listing,
      profit: listing.profit,
      costOfGoods: listing.cost_of_goods || 0,
      shippingCost: listing.generated_listing?.shippingSuggestions.estimatedCost || 0,
      savedDraftId: listing.id,
      listingPrice: listing.listing_price || listing.market_research?.suggestedListingPrice || 0,
      loading: false,
      error: null,
    });
  }, []);

  const reset = useCallback(() => setState(initialState), []);

  const updateListingPrice = useCallback((price: number) => {
    setState((s) => ({ ...s, listingPrice: price }));
  }, []);

  const updateCostOfGoods = useCallback((costOfGoods: number) => {
    setState((s) => ({ ...s, costOfGoods }));
  }, []);

  const updateShippingCost = useCallback((shippingCost: number) => {
    setState((s) => ({ ...s, shippingCost }));
  }, []);

  const setSavedDraftId = useCallback((savedDraftId: string | null) => {
    setState((s) => ({ ...s, savedDraftId }));
  }, []);

  return {
    state,
    setStep,
    addPhotos,
    removePhoto,
    analyzePhotos,
    researchMarket,
    generateListing,
    calculateProfit,
    enhancePhoto,
    updateAnalysis,
    updateGeneratedListing,
    loadFromListing,
    reset,
    updateListingPrice,
    updateCostOfGoods,
    updateShippingCost,
    setSavedDraftId,
    setState,
  };
}
