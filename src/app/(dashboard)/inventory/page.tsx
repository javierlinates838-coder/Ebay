"use client";

import { useState, useMemo } from "react";
import { AppHeader } from "@/components/layout/app-nav";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { useInventory } from "@/hooks/use-inventory";
import type { ListingStatus } from "@/types";
import { toast } from "sonner";

export default function InventoryPage() {
  const { listings, loading, deleteListing, updateListingStatus } = useInventory();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ListingStatus | null>(null);

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      const matchesSearch = !search || l.title.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !statusFilter || l.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [listings, search, statusFilter]);

  const handleDelete = async (id: string) => {
    await deleteListing(id);
    toast.success("Listing deleted");
  };

  const handleMarkSold = async (id: string) => {
    await updateListingStatus(id, "sold");
    toast.success("Marked as sold");
  };

  return (
    <>
      <AppHeader title="Inventory" />
      <main className="flex-1 p-4 sm:p-6">
        <div className="mx-auto max-w-4xl">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : (
            <InventoryTable
              listings={filtered}
              onSearch={setSearch}
              onStatusFilter={setStatusFilter}
              onDelete={handleDelete}
              onMarkSold={handleMarkSold}
              activeStatus={statusFilter}
            />
          )}
        </div>
      </main>
    </>
  );
}
