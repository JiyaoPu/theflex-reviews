// lib/types.ts
// 说明：这里定义“原始 Hostaway 评论形状”和“规范化后的评论形状”，以及房源聚合结果。

// 与 PDF 示例字段对应的原始类型（可容忍 null/缺失）
export type RawHostawayReview = {
    id: number | string;
    type: string | null;                 // e.g., "host-to-guest" / "guest-to-host"
    status?: string | null;              // e.g., "published"
    rating?: number | null;              // 可能为空；有时用类别评分平均代替
    publicReview?: string | null;        // 文本
    reviewCategory?: { category: string; rating: number }[]; // 各子维度评分
    submittedAt?: string | null;         // "2020-08-21 22:45:14"
    guestName?: string | null;           // 评论者
    listingName?: string | null;         // 房源名
    channel?: string | null;             // 若有来源渠道
  };
  
  // 规范化后的统一结构（前端消费）
  export type NormalizedReview = {
    reviewId: string;                    // 字符串化 ID
    listingId: string;                   // 从 listingName 派生的 slug
    listingName: string;                 // 房源名
    channel: "hostaway" | "google";      // 数据来源
    type: string | null;
    status: string | null;
    ratingOverall: number | null;        // 0-10（Hostaway）或 0-5（Google 映射后可统一到 0-10）
    categories: { name: string; rating: number }[]; // 子维度
    submittedAt: string | null;          // ISO 时间
    guestName: string | null;            // 用户名
    text: string;                        // 评论文本
  };
  
  // 按房源的聚合指标
  export type ListingAggregate = {
    listingId: string;
    listingName: string;
    reviewCount: number;
    avgRating: number | null;            // 0-10 平均
    last30dCount: number;                // 近30天评论数
    topIssues: { name: string; avg: number }[]; // 平均分最低的类别（越低越是潜在问题）
  };
  