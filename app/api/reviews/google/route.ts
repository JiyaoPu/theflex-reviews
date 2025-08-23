import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Google Reviews Proxy (支持多个 placeId)
 * Usage: GET /api/reviews/google?placeIds=ID1,ID2,ID3
 * Env:   GOOGLE_MAPS_API_KEY 必须配置
 */
export async function GET(req: NextRequest) {
  const placeIdsParam = req.nextUrl.searchParams.get("placeIds");
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!placeIdsParam || !apiKey) {
    return NextResponse.json(
      { status: "error", message: "Missing placeIds or GOOGLE_MAPS_API_KEY." },
      { status: 400 }
    );
  }

  const placeIds = placeIdsParam.split(",").map((id) => id.trim()).filter(Boolean);

  const results: any[] = [];

  for (const placeId of placeIds) {
    const url =
      `https://maps.googleapis.com/maps/api/place/details/json` +
      `?place_id=${encodeURIComponent(placeId)}` +
      `&fields=reviews,rating,user_ratings_total,url,name` +
      `&key=${apiKey}`;

    try {
      const resp = await fetch(url);
      const data = await resp.json();
      results.push({
        placeId,
        name: data?.result?.name ?? null,
        rating: data?.result?.rating ?? null,
        total: data?.result?.user_ratings_total ?? null,
        url: data?.result?.url ?? null,
        reviews: data?.result?.reviews ?? [],
      });
    } catch (err) {
      results.push({
        placeId,
        error: "Failed to fetch or parse Google data"
      });
    }
  }

  return NextResponse.json({ status: "success", places: results });
}
