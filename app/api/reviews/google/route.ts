// app/api/reviews/google/route.ts
import { NextRequest, NextResponse } from "next/server";

// 用法：GET /api/reviews/google?placeId=YOUR_PLACE_ID
// 需要在 Vercel/本地设置环境变量 GOOGLE_MAPS_API_KEY
// 注意：Google Places 返回的 reviews 通常只有少量（常见 ~5），且非时间排序。

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const placeId = req.nextUrl.searchParams.get("placeId");
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!placeId || !apiKey) {
    return NextResponse.json(
      { status: "error", message: "Missing placeId or GOOGLE_MAPS_API_KEY." },
      { status: 400 }
    );
  }

  const url =
    `https://maps.googleapis.com/maps/api/place/details/json` +
    `?place_id=${encodeURIComponent(placeId)}` +
    `&fields=reviews,rating,user_ratings_total,url` +
    `&key=${apiKey}`;

  try {
    const resp = await fetch(url);
    const data = await resp.json();
    const reviews = data?.result?.reviews ?? [];

    // 这里直接透明返回 Google 的 reviews；如需统一为 NormalizedReview，可在此做映射。
    return NextResponse.json({
      status: "success",
      reviews,
      meta: {
        rating: data?.result?.rating,
        total: data?.result?.user_ratings_total,
        url: data?.result?.url,
      },
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Failed to fetch Google Place Details." },
      { status: 500 }
    );
  }
}
