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

type ListingAggregate = {
  listingId: string;
  listingName: string;
  reviewCount: number;
  avgRating: number | null;
  last30dCount: number;
  topIssues: { name: string; avg: number }[];
};

function inRange(iso: string | null, start?: Date | null, end?: Date | null) {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  if (start && t < start.getTime()) return false;
  if (end && t > end.getTime()) return false;
  return true;
}
function getCategoryRating(r: NormalizedReview, cat?: string | null): number | null {
  if (!cat) return null;
  const found = r.categories.find((c) => c.name === cat);
  return found ? found.rating : null;
}

export default function DashboardClient({
  reviews,
  aggregates,
}: {
  reviews: NormalizedReview[];
  aggregates: ListingAggregate[];
}) {
  // Derived options
  const listings = useMemo(() => {
    const map = new Map<string, string>();
    reviews.forEach((r) => map.set(r.listingId, r.listingName));
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [reviews]);

  const allCategories = useMemo(
    () => Array.from(new Set(reviews.flatMap((r) => r.categories.map((c) => c.name)))).sort(),
    [reviews]
  );

  const allChannels = useMemo(
    () => Array.from(new Set(reviews.map((r) => r.channel))).sort(),
    [reviews]
  );

  // State
  const [selectedListing, setSelectedListing] = useState<string | "all">("all");
  const [minRating, setMinRating] = useState<number>(0);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  type TimePreset = "all" | "7d" | "30d" | "90d" | "custom";
  const [timePreset, setTimePreset] = useState<TimePreset>("all");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");
  type SortField = "date" | "rating" | "channel" | "category";
  type SortDir = "asc" | "desc";
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [sortCategory, setSortCategory] = useState<string>("");

  // Approval (local persistence)
  const [approved, setApproved] = useState<string[]>([]);
  useEffect(() => {
    try {
      setApproved(JSON.parse(localStorage.getItem("approvedReviews") || "[]"));
    } catch {
      setApproved([]);
    }
  }, []);
  const toggleApprove = (id: string) => {
    setApproved((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem("approvedReviews", JSON.stringify(next));
      return next;
    });
  };

  // Time range
  const { startDate, endDate } = useMemo(() => {
    if (timePreset === "custom") {
      const s = customStart ? new Date(customStart) : null;
      const e = customEnd ? new Date(customEnd) : null;
      if (e) e.setHours(23, 59, 59, 999);
      return { startDate: s, endDate: e };
    }
    if (timePreset === "all") return { startDate: null, endDate: null };
    const now = new Date();
    const end = new Date(); end.setHours(23, 59, 59, 999);
    const start = new Date();
    const days = timePreset === "7d" ? 7 : timePreset === "30d" ? 30 : 90;
    start.setDate(now.getDate() - days); start.setHours(0,0,0,0);
    return { startDate: start, endDate: end };
  }, [timePreset, customStart, customEnd]);

  // Filter + sort
  const filtered = useMemo(() => {
    let arr = reviews.filter((r) => {
      if (selectedListing !== "all" && r.listingId !== selectedListing) return false;
      if (typeof r.ratingOverall === "number" && r.ratingOverall < minRating) return false;
      if (selectedCats.length > 0 && !r.categories.some((c) => selectedCats.includes(c.name))) return false;
      if (selectedChannels.length > 0 && !selectedChannels.includes(r.channel)) return false;
      if (!(timePreset === "all") && !inRange(r.submittedAt, startDate, endDate)) return false;
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    arr = arr.slice().sort((a, b) => {
      if (sortField === "date") {
        return (new Date(a.submittedAt ?? 0).getTime() - new Date(b.submittedAt ?? 0).getTime()) * dir;
      }
      if (sortField === "rating") {
        return ((a.ratingOverall ?? -Infinity) - (b.ratingOverall ?? -Infinity)) * dir;
      }
      if (sortField === "channel") {
        return (a.channel || "").localeCompare(b.channel || "") * dir;
      }
      if (!sortCategory) return 0;
      const ar = getCategoryRating(a, sortCategory);
      const br = getCategoryRating(b, sortCategory);
      const av = ar === null ? -Infinity : ar;
      const bv = br === null ? -Infinity : br;
      return (av - bv) * dir;
    });
    return arr;
  }, [
    reviews, selectedListing, minRating, selectedCats, selectedChannels,
    startDate, endDate, timePreset, sortField, sortDir, sortCategory
  ]);

  // UI interactions
  const toggleCat = (cat: string) => {
    setSelectedCats((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  };
  const toggleChannel = (ch: string) => {
    setSelectedChannels((prev) => (prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]));
  };
  const clearFilters = () => {
    setSelectedListing("all");
    setMinRating(0);
    setSelectedCats([]);
    setSelectedChannels([]);
    setTimePreset("all");
    setCustomStart("");
    setCustomEnd("");
    setSortField("date");
    setSortDir("desc");
    setSortCategory("");
  };

  return (
    <div className="stack">
      {/* KPI Cards */}
      <section className="kpi-grid">
        {aggregates.map((a) => (
          <div key={a.listingId} className="card">
            <div style={{ fontWeight: 600 }}>{a.listingName}</div>
            <div className="meta">
              Average: {a.avgRating ?? "—"} · Reviews: {a.reviewCount} · Last 30 days: {a.last30dCount}
            </div>
            <div className="muted">
              Top issues: {a.topIssues.map((t) => `${t.name}:${t.avg}`).join(" · ")}
            </div>
          </div>
        ))}
      </section>

      {/* Filters / Sorting */}
      <section className="controls">
        {/* Row 1 */}
        <div className="controls-row">
          <div className="text-sm">
            <label style={{ marginRight: 6, color: "var(--ink-60)" }}>Listing:</label>
            <select
              className="select"
              value={selectedListing}
              onChange={(e) => setSelectedListing(e.target.value as any)}
            >
              <option value="all">All</option>
              {listings.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          <div className="text-sm">
            <label style={{ marginRight: 6, color: "var(--ink-60)" }}>Min rating:</label>
            <input
              type="number" min={0} max={10} step={0.5} value={minRating}
              onChange={(e) => setMinRating(parseFloat(e.target.value) || 0)}
              className="input -sm"
            />
            <span style={{ marginLeft: 8, color: "var(--ink-60)", fontSize: 12 }}>(0–10)</span>
          </div>

          <div className="controls-row" style={{ marginLeft: "auto" }}>
            <a href="/public" className="btn btn-primary" title="View approved reviews on Review Display Page">
            Review Display Page
            </a>
            <button onClick={clearFilters} className="btn">Clear filters</button>
          </div>
        </div>

        {/* Row 2: Category */}
        <div className="controls-row">
          <div className="muted" style={{ marginRight: 6 }}>Category:</div>
          <div className="pills">
            {allCategories.map((cat) => {
              const active = selectedCats.includes(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggleCat(cat)}
                  className={`pill ${active ? "is-active" : ""}`}
                >
                  {cat}
                </button>
              );
            })}
            {allCategories.length === 0 && <span className="muted">(No categories)</span>}
          </div>
        </div>

        {/* Row 3: Channel */}
        <div className="controls-row">
          <div className="muted" style={{ marginRight: 6 }}>Channel:</div>
          <div className="pills">
            {allChannels.map((ch) => {
              const active = selectedChannels.includes(ch);
              return (
                <button
                  key={ch}
                  onClick={() => toggleChannel(ch)}
                  className={`pill ${active ? "is-active" : ""}`}
                  style={{ textTransform: "capitalize" }}
                >
                  {ch}
                </button>
              );
            })}
            {allChannels.length === 0 && <span className="muted">(No channels)</span>}
          </div>
        </div>

        {/* Row 4: Time */}
        <div className="controls-row">
          <div className="text-sm">
            <label style={{ marginRight: 6, color: "var(--ink-60)" }}>Time:</label>
            <select
              className="select"
              value={timePreset}
              onChange={(e) => setTimePreset(e.target.value as any)}
            >
              <option value="all">All</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {timePreset === "custom" && (
            <>
              <div className="text-sm">
                <label style={{ marginRight: 6, color: "var(--ink-60)" }}>Start:</label>
                <input
                  type="date"
                  className="input"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
              </div>
              <div className="text-sm">
                <label style={{ marginRight: 6, color: "var(--ink-60)" }}>End:</label>
                <input
                  type="date"
                  className="input"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        {/* Row 5: Sort */}
        <div className="controls-row">
          <div className="text-sm">
            <label style={{ marginRight: 6, color: "var(--ink-60)" }}>Sort by:</label>
            <select
              className="select"
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
            >
              <option value="date">Date</option>
              <option value="rating">Rating</option>
              <option value="channel">Channel</option>
              <option value="category">Category rating</option>
            </select>
          </div>
          <div className="text-sm">
            <label style={{ marginRight: 6, color: "var(--ink-60)" }}>Direction:</label>
            <select
              className="select"
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value as any)}
            >
              <option value="desc">Desc ↓</option>
              <option value="asc">Asc ↑</option>
            </select>
          </div>
          {sortField === "category" && (
            <div className="text-sm">
              <label style={{ marginRight: 6, color: "var(--ink-60)" }}>Category:</label>
              <select
                className="select"
                value={sortCategory}
                onChange={(e) => setSortCategory(e.target.value)}
              >
                <option value="">— Select —</option>
                {allCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </section>

      {/* Review list */}
      <section className="list">
        {filtered.map((r) => {
          const isApproved = approved.includes(r.reviewId);
          return (
            <div key={r.reviewId} className={`review-card ${isApproved ? "is-approved" : ""}`}>
              <div className="row">
                <div style={{ fontWeight: 600 }}>{r.guestName ?? "Guest"}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink-70)" }}>
                  <span className="badge">{r.channel}</span>
                  <span>Rating: {typeof r.ratingOverall === "number" ? r.ratingOverall.toFixed(1) : "—"}</span>
                </div>
              </div>

              <div className="muted">{r.listingName}</div>

              <p style={{ marginTop: 8, marginBottom: 0 }}>{r.text}</p>

              <div className="cat-list">
                {r.categories.map((c) => (
                  <span key={c.name} className="cat-item">{c.name}: {c.rating}</span>
                ))}
              </div>

              <div className="row" style={{ marginTop: 12, fontSize: 12, color: "var(--ink-60)" }}>
                <div>{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : ""}</div>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={isApproved}
                    onChange={() => toggleApprove(r.reviewId)}
                  />
                  Approve for website
                </label>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="empty">No reviews match the filters. Try relaxing the filter conditions.</div>
        )}
      </section>
    </div>
  );
}
