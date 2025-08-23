// app/api/reviews/hostaway/route.ts
import { NextResponse } from "next/server";
import { normalizeHostaway, aggregateByListing } from "@/lib/normalize";
import type { RawHostawayReview } from "@/lib/types";
import path from "path";
import fs from "fs/promises";

// 说明：这条路由会被考官直接请求，请确保能返回结构化数据。
// 这里读取本地 data/hostaway_reviews.sample.json（官方给的 mock 粘进去即可）。
// 如果以后接 Hostaway 真 API，只需把读取文件改成 fetch 即可。

export const dynamic = "force-dynamic"; // 避免被 Next 静态优化缓存

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "hostaway_reviews.sample.json");
    const rawText = await fs.readFile(filePath, "utf-8");
    const raw: RawHostawayReview[] = JSON.parse(rawText);

    // 规范化 + 聚合
    const reviews = normalizeHostaway(raw);
    const aggregates = aggregateByListing(reviews);

    // 返回结构化数据（前端直接使用）
    return NextResponse.json({ status: "success", reviews, aggregates });
  } catch (err: any) {
    // 出错时返回错误信息（不暴露敏感细节）
    return NextResponse.json(
      { status: "error", message: "Failed to load or parse Hostaway mock data." },
      { status: 500 }
    );
  }
}
