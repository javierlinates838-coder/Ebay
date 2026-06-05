"use client";

import { useCallback, useEffect, useState } from "react";
import type { Listing, ListingStatus } from "@/types";

const STORAGE_KEY = "resellai_inventory";

export function useInventory() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setListings(JSON.parse(stored));
      }
    } catch {
      setListings([]);
    }
  }, []);

  const persist = useCallback((updated: Listing[]) => {
    setListings(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const fetchListings = useCallback(async (params?: { status?: ListingStatus; search?: string }) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (params?.status) query.set("status", params.status);
      if (params?.search) query.set("search", params.search);

      const res = await fetch(`/api/inventory?${query}`);
      const data = await res.json();

      if (data.listings?.length) {
        persist(data.listings);
      } else {
        loadFromStorage();
      }
    } catch {
      loadFromStorage();
    } finally {
      setLoading(false);
    }
  }, [loadFromStorage, persist]);

  const saveListing = useCallback(
    async (listing: Partial<Listing> & { id?: string }) => {
      const isUpdate = Boolean(listing.id);
      const method = isUpdate ? "PATCH" : "POST";

      try {
        const res = await fetch("/api/inventory", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(listing),
        });
        const data = await res.json();
        const saved = data.listing as Listing;

        if (isUpdate) {
          persist(listings.map((l) => (l.id === saved.id ? saved : l)));
        } else {
          persist([saved, ...listings]);
        }
        return saved;
      } catch {
        const mockListing: Listing = {
          id: listing.id || crypto.randomUUID(),
          user_id: "demo-user",
          title: listing.title || "Untitled",
          description: listing.description || null,
          status: listing.status || "draft",
          product_analysis: listing.product_analysis || null,
          market_research: listing.market_research || null,
          generated_listing: listing.generated_listing || null,
          pricing: listing.pricing || null,
          profit: listing.profit || null,
          photos: listing.photos || [],
          enhanced_photos: listing.enhanced_photos || [],
          ebay_item_id: listing.ebay_item_id || null,
          category: listing.category || null,
          listing_price: listing.listing_price || null,
          cost_of_goods: listing.cost_of_goods || null,
          keywords: listing.keywords || null,
          item_specifics: listing.item_specifics || null,
          created_at: listing.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (isUpdate) {
          persist(listings.map((l) => (l.id === mockListing.id ? mockListing : l)));
        } else {
          persist([mockListing, ...listings]);
        }
        return mockListing;
      }
    },
    [listings, persist]
  );

  const deleteListing = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/inventory?id=${id}`, { method: "DELETE" });
      } catch {
        // Continue with local delete
      }
      persist(listings.filter((l) => l.id !== id));
    },
    [listings, persist]
  );

  const updateListingStatus = useCallback(
    async (id: string, status: ListingStatus) => {
      try {
        const res = await fetch("/api/inventory", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status }),
        });
        const data = await res.json();
        if (data.listing) {
          persist(listings.map((l) => (l.id === id ? { ...l, ...data.listing, status } : l)));
          return;
        }
      } catch {
        // Fall through to local update
      }
      persist(
        listings.map((l) =>
          l.id === id ? { ...l, status, updated_at: new Date().toISOString() } : l
        )
      );
    },
    [listings, persist]
  );

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  return { listings, loading, fetchListings, saveListing, deleteListing, updateListingStatus };
}
