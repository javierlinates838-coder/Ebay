"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { dataUrlToBlob } from "@/lib/data-url";
import { prepareImageForAnalysis } from "@/lib/image-compress";
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
  const stateRef = useRef(state);

  useEffect(() => {
    photosRef.current = state.photos;
    stateRef.current = state;
  }, [state]);

  const setStep = useCallback((step: ListingStep) => {
    setState((s) => ({ ...s, step, error: null }));
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
      const prepared = await Promise.all(
        photos.slice(0, 4).map((photo) => prepareImageForAnalysis(photo))
      );

      const formData = new FormData();
      for (const [index, photo] of prepared.entries()) {
        formData.append("images", dataUrlToBlob(photo), `photo-${index + 1}.jpg`);
      }

      const res = await fetch("/api/ai/analyze-photos", {
        method: "POST",
        body: formData,
      });

      let data: {
        analysis?: ProductAnalysis;
        source?: string;
        warning?: string;
        error?: string;
      };

      try {
        data = await res.json();
      } catch {
        throw new Error("Server returned an invalid response. Try again.");
      }

      if (!res.ok && !data.analysis) {
        throw new Error(data.error || "Analysis failed");
      }

      if (!data.analysis) {
        throw new Error(data.error || "No analysis returned");
      }

      setState((s) => ({
        ...s,
        analysis: data.analysis!,
        analysisSource: (data.source as ListingWorkflowState["analysisSource"]) ?? null,
        analysisWarning: data.warning ?? null,
        step: "analysis",
        loading: false,
        error: null,
      }));

      return {
        analysis: data.analysis,
        source: data.source,
        warning: data.warning,
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
      if (!res.ok || !data.market) {
        throw new Error(data.error || "Market research failed");
      }

      setState((s) => ({
        ...s,
        market: data.market,
        pricing: data.pricing,
        marketSource: data.source ?? "demo",
        listingPrice: data.market.suggestedListingPrice,
        step: "market",
        loading: false,
        error: null,
      }));
      return { market: data.market, pricing: data.pricing, source: data.source };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Market research failed";
      setState((s) => ({ ...s, loading: false, error: message }));
      throw err;
    }
  }, []);

  const generateListing = useCallback(async () => {
    const current = stateRef.current;
    if (!current.analysis) {
      setState((s) => ({ ...s, error: "Complete product analysis first" }));
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const res = await fetch("/api/ai/generate-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis: current.analysis,
          marketPrice: current.listingPrice,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.listing) {
        throw new Error(data.error || "Listing generation failed");
      }

      setState((s) => ({
        ...s,
        generatedListing: data.listing,
        step: "listing",
        loading: false,
        error: null,
      }));
      return data.listing as GeneratedListing;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Listing generation failed";
      setState((s) => ({ ...s, loading: false, error: message }));
      throw err;
    }
  }, []);

  const calculateProfit = useCallback(
    async (params: { costOfGoods: number; listingPrice: number; shippingCost?: number }) => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const shippingCost =
          params.shippingCost ??
          state.generatedListing?.shippingSuggestions.estimatedCost ??
          0;
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
        if (!res.ok || !data.profit) {
          throw new Error(data.error || "Profit calculation failed");
        }

        setState((s) => ({
          ...s,
          profit: data.profit,
          costOfGoods: params.costOfGoods,
          listingPrice: params.listingPrice,
          step: "profit",
          loading: false,
          error: null,
        }));
        return data.profit as ProfitBreakdown;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Profit calculation failed";
        setState((s) => ({ ...s, loading: false, error: message }));
        throw err;
      }
    },
    [state.generatedListing]
  );

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
      step: listing.generated_listing
        ? "review"
        : listing.market_research
          ? "market"
          : listing.product_analysis
            ? "analysis"
            : "photos",
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
