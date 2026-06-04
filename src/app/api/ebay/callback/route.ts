import { NextRequest } from "next/server";
import { exchangeEbayCode } from "@/lib/ebay/client";
import { redirect } from "next/navigation";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    redirect("/settings?ebay_error=" + encodeURIComponent(error));
  }

  if (!code) {
    redirect("/settings?ebay_error=no_code");
  }

  const tokens = await exchangeEbayCode(code);

  if (!tokens) {
    redirect("/settings?ebay_error=exchange_failed");
  }

  // In production, store tokens via server action with user session
  redirect("/settings?ebay_connected=true");
}
