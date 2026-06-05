"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatPercent } from "@/lib/profit-calculator";
import type { ProfitBreakdown } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ProfitCalculatorProps {
  profit: ProfitBreakdown | null;
  salePrice: number;
  costOfGoods: number;
  shippingCost: number;
  onSalePriceChange: (v: number) => void;
  onCostChange: (v: number) => void;
  onShippingChange: (v: number) => void;
  onCalculate: () => void;
  loading?: boolean;
}

export function ProfitCalculator({
  profit,
  salePrice,
  costOfGoods,
  shippingCost,
  onSalePriceChange,
  onCostChange,
  onShippingChange,
  onCalculate,
  loading,
}: ProfitCalculatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Profit Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="salePrice">Sale Price</Label>
              <Input
                id="salePrice"
                type="number"
                min={0}
                step={0.01}
                value={salePrice || ""}
                onChange={(e) => onSalePriceChange(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cog">Cost of Goods</Label>
              <Input
                id="cog"
                type="number"
                min={0}
                step={0.01}
                value={costOfGoods || ""}
                onChange={(e) => onCostChange(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipping">Shipping Cost</Label>
              <Input
                id="shipping"
                type="number"
                min={0}
                step={0.01}
                value={shippingCost || ""}
                onChange={(e) => onShippingChange(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <Button
            className="w-full rounded-xl"
            onClick={onCalculate}
            disabled={loading || !salePrice}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Calculate Profit
          </Button>

          {profit && (
            <div className="space-y-3 rounded-xl bg-muted/50 p-4">
              {[
                { label: "Sale Price", value: formatCurrency(profit.salePrice), negative: false },
                { label: "Shipping Cost", value: `-${formatCurrency(profit.shippingCost)}`, negative: true },
                { label: "eBay Fees", value: `-${formatCurrency(profit.ebayFees)}`, negative: true },
                { label: "Taxes", value: `-${formatCurrency(profit.taxes)}`, negative: true },
                { label: "Cost of Goods", value: `-${formatCurrency(profit.costOfGoods)}`, negative: true },
              ].map(({ label, value, negative }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className={negative ? "text-red-600 dark:text-red-400" : ""}>{value}</span>
                </div>
              ))}
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold">Net Profit</span>
                  <span
                    className={cn(
                      "text-xl font-bold",
                      profit.netProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600"
                    )}
                  >
                    {formatCurrency(profit.netProfit)}
                  </span>
                </div>
                <div className="mt-1 flex justify-between text-sm">
                  <span className="text-muted-foreground">ROI</span>
                  <span className="font-medium">{formatPercent(profit.roiPercentage)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
