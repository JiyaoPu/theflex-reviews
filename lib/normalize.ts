// lib/normalize.ts
import { RawHostawayReview, NormalizedReview, ListingAggregate } from "./types";

/**
 * 将房源名转为 URL 友好的 slug，作为 listingId 使用。
 * 如 "Modern 2 Bed Flat in Primrose Hill" -> "modern-2-bed-flat-in-primrose-hill"
 */
function slugify(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/**
 * Hostaway 原始数据 -> 规范化结构
 * 说明：
 * - Hostaway 评分通常是 0-10；若缺失总分，就用子维度平均作为 ratingOverall。
 * - 提交时间转换为 ISO，方便排序/筛选。
 */
export function normalizeHostaway(raw: RawHostawayReview[]): NormalizedReview[] {
  return raw.map((r) => {
    const listingName = r.listingName ?? "Unknown Listing";
    const listingId = slugify(listingName);

    const categories = (r.reviewCategory ?? []).map((c) => ({
      name: c.category,
      rating: Number(c.rating),
    }));

    // 优先使用整体评分；若缺失，则用子维度均值近似
    const ratingOverall =
      typeof r.rating === "number"
        ? r.rating
        : categories.length
        ? Math.round(
            (categories.reduce((sum, c) => sum + c.rating, 0) / categories.length) * 10
          ) / 10
        : null;

    // Hostaway 时间形如 "2020-08-21 22:45:14" -> ISO
    const submittedAtISO = r.submittedAt
      ? new Date(r.submittedAt.replace(" ", "T") + "Z").toISOString()
      : null;

    return {
      reviewId: String(r.id),
      listingId,
      listingName,
      channel: "hostaway",
      type: r.type ?? null,
      status: r.status ?? null,
      ratingOverall,
      categories,
      submittedAt: submittedAtISO,
      guestName: r.guestName ?? null,
      text: r.publicReview ?? "",
    };
  });
}

/**
 * 按房源聚合指标：
 * - 平均分
 * - 近30天评论数量
 * - 各类别平均分并找出最低的几个（认为是“问题点”）
 */
export function aggregateByListing(reviews: NormalizedReview[]): ListingAggregate[] {
  const byListing: Record<string, { name: string; items: NormalizedReview[] }> = {};

  for (const r of reviews) {
    byListing[r.listingId] ??= { name: r.listingName, items: [] };
    byListing[r.listingId].items.push(r);
  }

  const res: ListingAggregate[] = [];
  const now = Date.now();
  const DAY30 = 30 * 24 * 3600 * 1000;

  for (const [listingId, { name, items }] of Object.entries(byListing)) {
    // 平均分（忽略 null）
    const ratings = items
      .map((i) => i.ratingOverall)
      .filter((x): x is number => typeof x === "number");
    const avgRating = ratings.length
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : null;

    // 近30天评论数
    const last30dCount = items.filter(
      (i) => i.submittedAt && now - new Date(i.submittedAt).getTime() <= DAY30
    ).length;

    // 类别平均分（低分优先 -> “问题点”）
    const catMap: Record<string, number[]> = {};
    for (const i of items) {
      for (const c of i.categories) {
        (catMap[c.name] ??= []).push(c.rating);
      }
    }
    const topIssues = Object.entries(catMap)
      .map(([name, arr]) => ({
        name,
        avg: Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10,
      }))
      .sort((a, b) => (a.avg ?? 0) - (b.avg ?? 0))
      .slice(0, 3);

    res.push({
      listingId,
      listingName: name,
      reviewCount: items.length,
      avgRating,
      last30dCount,
      topIssues,
    });
  }

  // 默认按平均分降序展示
  return res.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
}
