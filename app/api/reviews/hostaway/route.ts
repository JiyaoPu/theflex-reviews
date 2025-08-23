// app/api/reviews/hostaway/route.ts
import { NextResponse, NextRequest } from "next/server";
import { normalizeHostaway, aggregateByListing } from "@/lib/normalize";
import type { RawHostawayReview } from "@/lib/types";
import path from "path";
import fs from "fs/promises";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // 1) 解析查询参数：?ids=1001,1002（按 reviewId 精确筛选）
    const idsParam = req.nextUrl.searchParams.get("ids");
    const idSet = new Set((idsParam ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    );

    // 2) 读取本地 mock
    const filePath = path.join(process.cwd(), "data", "hostaway_reviews.sample.json");
    const rawText = await fs.readFile(filePath, "utf-8");

    // 支持两种文件结构：纯数组 或 {status,result:[...]}
    const parsed = JSON.parse(rawText);
    const rawArr: RawHostawayReview[] = Array.isArray(parsed) ? parsed : (parsed.result ?? []);

    // 3) 规范化
    const allReviews = normalizeHostaway(rawArr);

    // 4) 条件筛选：如果带了 ?ids=，仅返回指定 reviewId
    const reviews = idSet.size > 0
      ? allReviews.filter((r) => idSet.has(r.reviewId))
      : allReviews;

    // 5) 基于筛选后的 reviews 重新计算 aggregates
    const aggregates = aggregateByListing(reviews);

    return NextResponse.json({ status: "success", reviews, aggregates });
  } catch (err) {
    return NextResponse.json(
      { status: "error", message: "Failed to load or parse Hostaway mock data." },
      { status: 500 }
    );
  }
}
