"use client";

import Link from "next/link";
import { Search, MoreHorizontal, Trash2, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/profit-calculator";
import type { Listing, ListingStatus } from "@/types";

const statusColors: Record<ListingStatus, string> = {
  draft: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  listed: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  sold: "bg-green-500/15 text-green-700 dark:text-green-400",
  shipped: "bg-purple-500/15 text-purple-700 dark:text-purple-400",
};

interface InventoryTableProps {
  listings: Listing[];
  onSearch: (query: string) => void;
  onStatusFilter: (status: ListingStatus | null) => void;
  onDelete: (id: string) => void;
  activeStatus?: ListingStatus | null;
}

export function InventoryTable({
  listings,
  onSearch,
  onStatusFilter,
  onDelete,
  activeStatus,
}: InventoryTableProps) {
  const statuses: (ListingStatus | null)[] = [null, "draft", "listed", "sold", "shipped"];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search inventory..."
            className="pl-9"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {statuses.map((status) => (
            <Button
              key={status ?? "all"}
              variant={activeStatus === status ? "default" : "outline"}
              size="sm"
              className="shrink-0 rounded-full"
              onClick={() => onStatusFilter(status)}
            >
              {status ? status.charAt(0).toUpperCase() + status.slice(1) : "All"}
            </Button>
          ))}
        </div>
      </div>

      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
          <p className="text-muted-foreground">No listings found</p>
          <Link href="/list" className={cn(buttonVariants(), "mt-4")}>
            Create your first listing
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="flex items-center gap-4 rounded-xl border bg-card p-3 transition-shadow hover:shadow-md sm:p-4"
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                {(listing.enhanced_photos?.[0] || listing.photos?.[0]) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={listing.enhanced_photos?.[0] || listing.photos[0]}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    No img
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{listing.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={cn("text-xs capitalize", statusColors[listing.status])}>
                    {listing.status}
                  </Badge>
                  {listing.category && (
                    <span className="text-xs text-muted-foreground">{listing.category}</span>
                  )}
                </div>
              </div>

              <div className="hidden text-right sm:block">
                <p className="font-semibold">
                  {listing.listing_price ? formatCurrency(listing.listing_price) : "—"}
                </p>
                {listing.profit?.netProfit != null && (
                  <p className="text-xs text-green-600">
                    +{formatCurrency(listing.profit.netProfit)} profit
                  </p>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" />
                  }
                >
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {listing.ebay_item_id && (
                    <DropdownMenuItem
                      render={
                        <a
                          href={`https://www.ebay.com/itm/${listing.ebay_item_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        />
                      }
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View on eBay
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDelete(listing.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
