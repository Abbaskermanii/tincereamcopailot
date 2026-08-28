import { NextResponse } from "next/server";

const backendApi =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api/v1";

/** Adapt ZarinPal's GET callback into the backend JSON callback and return users to the UI. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const authority = url.searchParams.get("Authority");
  const status = url.searchParams.get("Status");
  const target = new URL("/order/failure", url.origin);

  if (!authority || !status) {
    return NextResponse.redirect(target);
  }

  try {
    const response = await fetch(`${backendApi}/payment/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Authority: authority, Status: status }),
      cache: "no-store",
    });
    const body = (await response.json()) as {
      ok?: boolean;
      order_number?: string | null;
    };
    if (response.ok && body.ok && body.order_number) {
      const success = new URL("/order/confirmation", url.origin);
      success.searchParams.set("order", body.order_number);
      return NextResponse.redirect(success);
    }
  } catch {
    // Show the failure page when the backend/gateway is unavailable.
  }

  return NextResponse.redirect(target);
}
