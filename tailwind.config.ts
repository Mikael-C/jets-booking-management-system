import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0F1420",
          50: "#E8E9EC",
          100: "#C5C8D1",
          200: "#8B91A4",
          300: "#515A77",
          400: "#2A3351",
          500: "#0F1420",
          600: "#0B101A",
          700: "#080C14",
          800: "#05080D",
          900: "#020307",
        },
        cream: {
          DEFAULT: "#F5F2EC",
          50: "#FDFCFA",
          100: "#F9F7F3",
          200: "#F5F2EC",
          300: "#EDE9DF",
          400: "#E0DAD0",
          500: "#D1C9BC",
        },
        gold: {
          DEFAULT: "#C9A052",
          light: "#E8D5A3",
          dark: "#9A7A35",
          50: "#FBF7EA",
          100: "#F5EDD0",
          200: "#EDDCAA",
          300: "#E8D5A3",
          400: "#D4B86A",
          500: "#C9A052",
          600: "#A08030",
          700: "#7A6124",
          800: "#544318",
          900: "#2E240D",
        },
        jet: {
          950: "#050810",
          900: "#0A0E1A",
          800: "#111827",
          700: "#1A1F35",
          600: "#252B45",
          500: "#374166",
        },
        brandOrange: "#FF6B00",
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "Manrope", "system-ui", "sans-serif"],
        display: ["var(--font-manrope)", "Manrope", "system-ui", "sans-serif"],
        mono: ["var(--font-manrope)", "Manrope", "system-ui", "sans-serif"],
        serif: ["var(--font-manrope)", "Manrope", "system-ui", "sans-serif"],
      },
      boxShadow: {
        gold: "0 4px 30px rgba(201,160,82,0.15)",
        "gold-lg": "0 8px 40px rgba(201,160,82,0.25)",
        card: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.08)",
        "card-hover": "0 4px 24px rgba(0,0,0,0.12), 0 8px 40px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
