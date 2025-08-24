# TheFlex Reviews

A Next.js 13 (App Router) project for managing and displaying guest reviews.  
Managers can filter, approve, and display reviews on a public page.

## Features

- **Manager Dashboard** (`/`)
  - View aggregated review stats
  - Filter & sort reviews
  - Approve reviews for public display

- **Public Reviews Page** (`/public`)
  - Shows only manager-approved reviews
  - Clean UI with overview and filters
  - Responsive design (desktop & mobile)

- **API Endpoint**
  - `/api/reviews/hostaway` → Fetch reviews data (example integration)

## Tech Stack

- [Next.js 13](https://nextjs.org/) (App Router)
- React / TypeScript
- Tailwind-inspired custom CSS
- Hosted on [Vercel](https://vercel.com/)

## Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/your-org/theflex-reviews.git
cd theflex-reviews
```

### 2. Install dependencies
```bash
- npm install
```

### 3. Run locally
```bash
- npm run dev
- The app will be available at:
- Dashboard → http://localhost:3000/
- Review Page → http://localhost:3000/public
```