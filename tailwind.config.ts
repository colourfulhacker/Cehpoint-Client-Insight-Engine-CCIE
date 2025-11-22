import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "#0C1A3D",
        secondary: "#2D65FF",
        accent: "#7BA7FF",
      },
      spacing: {
        0: "0",
        1: "0.125rem",
        2: "0.25rem",
        3: "0.375rem",
        4: "0.5rem",
        6: "0.75rem",
        8: "1rem",
        12: "1.5rem",
        16: "2rem",
        20: "2.5rem",
        24: "3rem",
        32: "4rem",
        40: "5rem",
        48: "6rem",
        56: "7rem",
        64: "8rem",
        72: "9rem",
        80: "10rem",
        96: "12rem",
        120: "15rem",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "Roboto", '"Helvetica Neue"', "Arial", "sans-serif"],
      },
      boxShadow: {
        sm: "0 4px 16px rgba(0, 0, 0, 0.06)",
        md: "0 8px 24px rgba(0, 0, 0, 0.12)",
      },
      animation: {
        "gradient-shift": "gradient-shift 8s ease infinite",
      },
      keyframes: {
        "gradient-shift": {
          "0%, 100%": { "background-position": "0% 50%" },
          "50%": { "background-position": "100% 50%" },
        },
      },
    },
  },
  darkMode: "class",
  plugins: [],
};

export default config;
