// app/public/page.tsx
import { headers } from "next/headers";
import PublicDisplayClient from "@/app/ui/PublicDisplayClient";

type NormalizedReview = {
  reviewId: string;
  listingId: string;
  listingName: string;
  channel: "hostaway" | "google";
  type: string | null;
  status: string | null;
  ratingOverall: number | null;
  categories: { name: string; rating: number }[];
  submittedAt: string | null;
  guestName: string | null;
  text: string;
};

export const metadata = {
  title: "Guest Reviews | Flex Living",
  description: "Public page for approved guest reviews",
};

function getServerBaseUrl() {
  const h = headers();
  const host =
    h.get("x-forwarded-host") ??
    h.get("host") ??
    process.env.VERCEL_URL ??
    "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (process.env.VERCEL ? "https" : "http");
  return `${proto}://${host}`;
}

export default async function PublicPage() {
  const baseUrl = getServerBaseUrl();
  const res = await fetch(`${baseUrl}/api/reviews/hostaway`, { cache: "no-store" });

  if (!res.ok) {
    return (
      <main className="container-page">
        <h1 className="title-1">Guest reviews</h1>
        <p style={{ color: "#b91c1c" }}>Failed to load data. Please try again later.</p>
      </main>
    );
  }

  const data = await res.json();
  const reviews: NormalizedReview[] = data.reviews ?? [];

  return (
    <main style={{ minHeight: "100vh" }}>
      {/* Hero (solid color) */}
      <section className="hero" style={{ backgroundColor: "#284e4c" }} />
      <div className="hero-wrap">
        <div className="hero-card">
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>Guest reviews</h1>
          <div className="mt-1 text-soft" style={{ fontSize: 14 }}>
            Approved reviews selected by the manager
          </div>
        </div>
      </div>

      {/* Body: client filters via localStorage */}
      <section className="container-page" style={{ paddingTop: 0 }}>
        <PublicDisplayClient reviews={reviews} />
      </section>
    </main>
  );
}
