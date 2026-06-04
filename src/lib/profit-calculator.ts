const EBAY_FEE_RATE = 0.1325; // 13.25% final value fee (approximate)
const PAYMENT_PROCESSING_RATE = 0.029; // 2.9%
const PAYMENT_PROCESSING_FIXED = 0.3;

export function calculateEbayFees(salePrice: number): number {
  return salePrice * EBAY_FEE_RATE + salePrice * PAYMENT_PROCESSING_RATE + PAYMENT_PROCESSING_FIXED;
}

export function calculateProfit(params: {
  salePrice: number;
  shippingCost: number;
  costOfGoods: number;
  taxRate?: number;
}): {
  salePrice: number;
  shippingCost: number;
  ebayFees: number;
  taxes: number;
  costOfGoods: number;
  netProfit: number;
  roiPercentage: number;
} {
  const { salePrice, shippingCost, costOfGoods, taxRate = 0 } = params;
  const ebayFees = calculateEbayFees(salePrice);
  const taxes = salePrice * taxRate;
  const netProfit = salePrice - shippingCost - ebayFees - taxes - costOfGoods;
  const roiPercentage = costOfGoods > 0 ? (netProfit / costOfGoods) * 100 : 0;

  return {
    salePrice,
    shippingCost,
    ebayFees: Math.round(ebayFees * 100) / 100,
    taxes: Math.round(taxes * 100) / 100,
    costOfGoods,
    netProfit: Math.round(netProfit * 100) / 100,
    roiPercentage: Math.round(roiPercentage * 100) / 100,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}
