/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./app/**/*.{ts,tsx}",
      "./components/**/*.{ts,tsx}",
      "./pages/**/*.{ts,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          brand: { DEFAULT: "#6C63FF", dark: "#5952d4", light: "#8b85ff" },
          ink: { DEFAULT: "#111827", soft: "#4B5563" },
          border: "#E5E7EB",
          bg: { DEFAULT: "#F9FAFB", card: "#FFFFFF" },
        },
        boxShadow: {
          card: "0 8px 24px rgba(0,0,0,0.06)",
        },
        borderRadius: { xl2: "1rem" },
      },
    },
    plugins: [],
  };
  