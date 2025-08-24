// app/page.tsx
import { headers } from "next/headers";
import DashboardClient from "./ui/DashboardClient";

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

type ListingAggregate = {
  listingId: string;
  listingName: string;
  reviewCount: number;
  avgRating: number | null;
  last30dCount: number;
  topIssues: { name: string; avg: number }[];
};

// Decode ?pub= base64 payload
function decodePubParam(pub?: string | string[] | null) {
  if (!pub || Array.isArray(pub)) return null;
  try {
    const json = Buffer.from(pub, "base64").toString("utf-8");
    return JSON.parse(json) as { listingId: string; approvedIds: string[] };
  } catch {
    return null;
  }
}

// Build absolute base URL for server-side fetch (works on Vercel + local)
function getServerBaseUrl() {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? process.env.VERCEL_URL ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (process.env.VERCEL ? "https" : "http");
  return `${proto}://${host}`;
}

export default async function Page({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const baseUrl = getServerBaseUrl();
  const res = await fetch(`${baseUrl}/api/reviews/hostaway`, { cache: "no-store" });

  if (!res.ok) {
    return (
      <main className="container-page">
        <h1 className="title-1">Reviews</h1>
        <p style={{ color: "#b91c1c" }}>Failed to load data. Please try again later.</p>
      </main>
    );
  }

  const data = await res.json();
  const reviews: NormalizedReview[] = data.reviews ?? [];
  const aggregates: ListingAggregate[] = data.aggregates ?? [];

  // Public mode (with ?pub=)
  const pubPayload = decodePubParam(searchParams?.pub);
  if (pubPayload) {
    const { listingId, approvedIds } = pubPayload;
    const approvedSet = new Set(approvedIds || []);
    const filtered = reviews.filter(
      (r) => r.listingId === listingId && approvedSet.has(r.reviewId)
    );

    const agg = aggregates.find((a) => a.listingId === listingId);
    const listingName = filtered[0]?.listingName || agg?.listingName || "Property";

    return (
      <main style={{ background: "var(--bg)", color: "var(--ink)", minHeight: "100vh" }}>
        {/* Hero section */}
        <section className="hero" style={{ backgroundColor: "#284e4c" }} />
        <div className="hero-wrap">
          <div className="hero-card">
            <h1 style={{ fontSize: 22, fontWeight: 600 }}>{listingName}</h1>
            <div className="mt-1 text-soft" style={{ fontSize: 14 }}>
              {typeof agg?.avgRating === "number"
                ? `Average ${agg.avgRating.toFixed(1)} / 10`
                : "No average yet"} · {agg?.reviewCount ?? 0} reviews total
            </div>
          </div>
        </div>

        {/* Main two-column layout */}
        <section className="container-page" style={{ paddingTop: 0 }}>
          <div className="two-col">
            {/* Left column: description + reviews */}
            <div className="stack">
              {/* Property description */}
              <div className="card">
                <h2 style={{ fontSize: 18, fontWeight: 600 }}>About this space</h2>
                <p className="mt-2 text-soft">
                  Spacious, fully furnished apartment with great transport links. Perfect for mid-term stays.
                </p>
              </div>

              {/* Approved reviews only */}
              <div className="card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h2 style={{ fontSize: 18, fontWeight: 600 }}>Guest reviews</h2>
                  <div className="text-mute" style={{ fontSize: 14 }}>Approved only</div>
                </div>

                {filtered.length === 0 ? (
                  <div className="empty mt-3">No approved reviews to show yet.</div>
                ) : (
                  <div className="list mt-3">
                    {filtered.map((r) => {
                      const score = typeof r.ratingOverall === "number" ? r.ratingOverall : null;
                      const stars = score ? Math.round(score / 2) : 0; // 0–10 → 0–5 stars
                      return (
                        <div key={r.reviewId} className="card">
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ fontWeight: 600 }}>{r.guestName || "Guest"}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink-70)" }}>
                              <span className="badge">{r.channel}</span>
                              {score !== null ? (
                                <span style={{ fontSize: 14 }}>
                                  <span aria-label="stars" style={{ marginRight: 4 }}>
                                    {"★".repeat(stars)}{"☆".repeat(5 - stars)}
                                  </span>
                                  {score.toFixed(1)} / 10
                                </span>
                              ) : (
                                <span style={{ fontSize: 14 }}>—</span>
                              )}
                            </div>
                          </div>

                          <p className="mt-2">{r.text}</p>

                          <div className="cat-list">
                            {r.categories.map((c) => (
                              <span key={c.name} className="cat-item">
                                {c.name}: {c.rating}
                              </span>
                            ))}
                          </div>

                          <div className="mt-3 text-mute" style={{ fontSize: 12 }}>
                            {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : ""}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right column: sticky card */}
            <aside>
              <div className="card sticky">
                <div style={{ fontSize: 24, fontWeight: 600 }}>
                  £2,850 <span className="text-mute" style={{ fontSize: 12 }}> / month</span>
                </div>
                <div className="text-mute mt-1" style={{ fontSize: 14 }}>
                  Bills included · Flexible terms
                </div>
                <div className="stack" style={{ gap: 8, marginTop: 16 }}>
                  <input className="input" placeholder="Move-in date" />
                  <input className="input" placeholder="Duration (months)" />
                  <button className="btn-solid">Check availability</button>
                </div>
                <p className="text-mute mt-2" style={{ fontSize: 12 }}>
                  Demo enquiry card for the assessment.
                </p>
              </div>
            </aside>
          </div>
        </section>
      </main>
    );
  }

  // No ?pub → Dashboard mode
  return (
    <main style={{ minHeight: "100vh" }}>
      {/* Hero section */}
      <section className="hero" style={{ backgroundColor: "#284e4c" }} />
      <div className="hero-wrap">
        <div className="hero-card">
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>Manager Dashboard</h1>
          <div className="mt-1 text-soft" style={{ fontSize: 14 }}>
            View listings performance, filter & sort reviews, and approve them for the public page
          </div>
        </div>
      </div>

      {/* Main content */}
      <section className="container-page" style={{ paddingTop: 0 }}>
        <div className="stack">
          <DashboardClient reviews={reviews} aggregates={aggregates} />
        </div>
      </section>
    </main>
  );
}
