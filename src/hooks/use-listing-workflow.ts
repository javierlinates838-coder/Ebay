"use client";

import { useCallback, useState } from "react";
import type {
  GeneratedListing,
  MarketResearch,
  PricingRecommendation,
  ProductAnalysis,
  ProfitBreakdown,
} from "@/types";

export type ListingStep = "photos" | "analysis" | "market" | "listing" | "profit" | "review";

export interface ListingWorkflowState {
  step: ListingStep;
  photos: string[];
  enhancedPhotos: string[];
  analysis: ProductAnalysis | null;
  market: MarketResearch | null;
  pricing: PricingRecommendation | null;
  generatedListing: GeneratedListing | null;
  profit: ProfitBreakdown | null;
  costOfGoods: number;
  listingPrice: number;
  loading: boolean;
  error: string | null;
}

const initialState: ListingWorkflowState = {
  step: "photos",
  photos: [],
  enhancedPhotos: [],
  analysis: null,
  market: null,
  pricing: null,
  generatedListing: null,
  profit: null,
  costOfGoods: 0,
  listingPrice: 0,
  loading: false,
  error: null,
};

export function useListingWorkflow() {
  const [state, setState] = useState<ListingWorkflowState>(initialState);

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

  const analyzePhotos = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      let photos: string[] = [];
      setState((s) => {
        photos = s.photos;
        return s;
      });

      const res = await fetch("/api/ai/analyze-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrls: photos }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");

      setState((s) => ({
        ...s,
        analysis: data.analysis,
        step: "analysis",
        loading: false,
      }));
      return data.analysis as ProductAnalysis;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      setState((s) => ({ ...s, loading: false, error: message }));
      throw err;
    }
  }, [state.photos]);

  const researchMarket = useCallback(async (query: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch("/api/ebay/market-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Market research failed");

      setState((s) => ({
        ...s,
        market: data.market,
        pricing: data.pricing,
        listingPrice: data.market.suggestedListingPrice,
        step: "market",
        loading: false,
      }));
      return { market: data.market, pricing: data.pricing };
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

  const reset = useCallback(() => setState(initialState), []);

  const updateListingPrice = useCallback((price: number) => {
    setState((s) => ({ ...s, listingPrice: price }));
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
    reset,
    updateListingPrice,
    setState,
  };
}
