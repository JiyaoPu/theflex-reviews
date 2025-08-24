// app/ui/PublicDisplayClient.tsx
"use client";
import { useEffect, useMemo, useState } from "react";

type NormalizedReview = {
  reviewId: string;
  listingId: string;
  listingName: string;
  channel: "hostaway" | "google";
  type: string | null;
  status: string | null;
  ratingOverall: number | null; // 0–10
  categories: { name: string; rating: number }[];
  submittedAt: string | null;   // ISO
  guestName: string | null;
  text: string;
};

export default function PublicDisplayClient({ reviews }: { reviews: NormalizedReview[] }) {
  const [approved, setApproved] = useState<string[]>([]);
  const [selectedListing, setSelectedListing] = useState<string | "all">("all");

  // Load approved IDs from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("approvedReviews") || "[]";
      setApproved(JSON.parse(raw));
    } catch {
      setApproved([]);
    }
  }, []);

  // Derived listing options
  const listings = useMemo(() => {
    const map = new Map<string, string>();
    reviews.forEach((r) => map.set(r.listingId, r.listingName));
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [reviews]);

  // Approved + optional listing filter
  const visible = useMemo(() => {
    const set = new Set(approved);
    return reviews.filter((r) => {
      if (!set.has(r.reviewId)) return false;
      if (selectedListing !== "all" && r.listingId !== selectedListing) return false;
      return true;
    });
  }, [reviews, approved, selectedListing]);

  // Summary for Overview
  const summary = useMemo(() => {
    const scores = visible
      .map((v) => v.ratingOverall)
      .filter((n): n is number => typeof n === "number");
    const avg = scores.length ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : null;
    return { count: visible.length, avg };
  }, [visible]);

  const renderStars = (score: number | null) => {
    if (score === null) return "—";
    const stars = Math.round(score / 2);
    return "★".repeat(stars) + "☆".repeat(5 - stars);
  };

  return (
    <main style={{ background: "var(--bg)" }}>
      {/* Main */}
      <section className="container-page" style={{ paddingTop: 0 }}>
        {/* Top controls: back to dashboard */}
        <div className="controls" style={{ marginBottom: 12 }}>
          <div className="controls-row" style={{ marginLeft: "auto" }}>
            <a
              href="/"
              className="btn btn-primary"
              title="Back to Reviews Dashboard"
            >
              Dashboard
            </a>
          </div>
        </div>

        <div className="two-col">
          {/* Left: reviews */}
          <div className="stack">
            {visible.length === 0 ? (
              <div className="empty">
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No approved reviews yet</div>
                <div className="text-mute" style={{ fontSize: 14 }}>
                  Go to Dashboard and check “Approve for website” to publish selected reviews.
                </div>
              </div>
            ) : (
              <div className="list">
                {visible.map((r) => {
                  const score = typeof r.ratingOverall === "number" ? r.ratingOverall : null;
                  return (
                    <article key={r.reviewId} className="card" style={{ padding: 20 }}>
                      <header
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                          marginBottom: 8,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700 }}>{r.guestName || "Guest"}</div>
                          <div className="text-mute" style={{ fontSize: 12, marginTop: 2 }}>
                            {r.listingName}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className="badge">{r.channel}</span>
                          <span
                            className="badge"
                            aria-label="rating"
                            style={{
                              borderColor: "var(--brand)",
                              color: "var(--brand)",
                              background: "var(--brand-10)",
                            }}
                          >
                            {score !== null ? `${score.toFixed(1)} / 10` : "—"}
                          </span>
                        </div>
                      </header>

                      <div className="text-soft" style={{ fontSize: 14, marginBottom: 8 }}>
                        <span aria-label="stars" style={{ marginRight: 6 }}>
                          {renderStars(score)}
                        </span>
                        {score !== null ? "Rated experience" : "No score provided"}
                      </div>

                      <p style={{ margin: 0, lineHeight: 1.6 }}>{r.text}</p>

                      {r.categories.length > 0 && (
                        <div className="cat-list" style={{ marginTop: 12 }}>
                          {r.categories.map((c) => (
                            <span key={c.name} className="cat-item">
                              {c.name}: {c.rating}
                            </span>
                          ))}
                        </div>
                      )}

                      <footer className="text-mute mt-3" style={{ fontSize: 12 }}>
                        {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : ""}
                      </footer>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: overview & CTA */}
          <aside className="stack">
            <div className="card sticky">
              <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>Overview</h3>
              <div className="meta">
                {summary.avg !== null ? `Average ${summary.avg} / 10` : "No average yet"} · {summary.count} approved
                review{summary.count > 1 ? "s" : ""}
              </div>

              <div className="mt-3">
                <label className="text-mute" style={{ fontSize: 12 }}>Filter by listing</label>
                <div style={{ marginTop: 6 }}>
                  <select
                    className="select"
                    value={selectedListing}
                    onChange={(e) => setSelectedListing(e.target.value as any)}
                  >
                    <option value="all">All</option>
                    {listings.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-3 text-mute" style={{ fontSize: 12 }}>
                Showing only the reviews you approved in Dashboard.
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>Looking to stay?</h3>
              <p className="text-soft" style={{ marginTop: 8, fontSize: 14 }}>
                Explore availability and flexible terms tailored to your needs.
              </p>
              <div className="stack" style={{ gap: 8, marginTop: 12 }}>
                <button className="btn-primary" style={{ padding: "10px 12px", borderRadius: 8 }}>
                  Contact us
                </button>
                <button className="btn" style={{ padding: "10px 12px", borderRadius: 8 }}>
                  Learn more
                </button>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
