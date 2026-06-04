import { NextRequest } from "next/server";
import { calculateProfit } from "@/lib/profit-calculator";
import { handleApiError, parseJsonBody, ApiError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody<{
      salePrice: number;
      shippingCost: number;
      costOfGoods: number;
      taxRate?: number;
    }>(request);

    if (body.salePrice == null || body.shippingCost == null || body.costOfGoods == null) {
      throw new ApiError("salePrice, shippingCost, and costOfGoods are required", 400);
    }

    const profit = calculateProfit(body);
    return Response.json({ profit });
  } catch (error) {
    return handleApiError(error);
  }
}
