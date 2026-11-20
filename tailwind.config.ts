import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./config/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09080a",
        foreground: "#faf5f0",
        surface: {
          50:  "#0f0d0b",
          100: "#18140f",
          200: "#221c15",
          300: "#2e2419",
          400: "#3d3020",
          500: "#52412c",
        },
        // Orange brand palette
        brand: {
          50:  "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
        },
        accent: {
          amber:   "#f59e0b",
          emerald: "#10b981",
          violet:  "#a78bfa",
          rose:    "#f87171",
          gold:    "#fbbf24",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
      boxShadow: {
        glow:         "0 0 24px -4px rgba(249, 115, 22, 0.35)",
        "glow-sm":    "0 0 12px -3px rgba(249, 115, 22, 0.25)",
        "glow-amber": "0 0 20px -5px rgba(245, 158, 11, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
