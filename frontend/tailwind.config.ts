import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        lajvard: { DEFAULT: "#31547A", deep: "#26415F", soft: "#8FB2D9" },
        firouzeh: { DEFAULT: "#7A9E93", soft: "#93B8AC" },
        clay: { DEFAULT: "#B0764F", soft: "#CF9270" },
        "kiln-clay": "#B0764F",
        slip: { DEFAULT: "#EDEAE3", raised: "#F6F4EF" },
        char: { DEFAULT: "#26221F", soft: "#57514B" },
        copper: "#9C6B5E",
        surface: "var(--surface)",
        bg: "var(--bg)",
        ink: { DEFAULT: "var(--ink)", soft: "var(--ink-soft)" },
        brand: "var(--brand)",
        accent: "var(--accent)",
        warm: "var(--warm)",
      },
      fontFamily: {
        vazir: ["var(--font-vazir)", "Tahoma", "sans-serif"],
      },
      borderRadius: {
        wobble: "255px 18px 225px 18px / 18px 225px 18px 255px",
        /** Admin-dashboard style wave, toned down for storefront cards */
        "wobble-card": "60px 20px 52px 20px / 20px 52px 20px 60px",
        /** Subtle handmade wave — same shape on every card size */
        "wobble-soft": "22px 27px 22px 27px / 27px 22px 27px 22px",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        shelf: "var(--shadow-sm)",
        lifted: "var(--shadow-md)",
        deep: "var(--shadow-lg)",
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
      },
      maxWidth: {
        "8xl": "88rem",
        "9xl": "96rem",
      },
      fontSize: {
        "display": ["clamp(2rem, 5vw, 3.5rem)", { lineHeight: "1.15", fontWeight: "800" }],
        "heading": ["clamp(1.5rem, 3vw, 2.25rem)", { lineHeight: "1.2", fontWeight: "800" }],
        "subheading": ["clamp(1.25rem, 2vw, 1.75rem)", { lineHeight: "1.3", fontWeight: "700" }],
      },
      transitionDuration: {
        "400": "400ms",
        "600": "600ms",
        "800": "800ms",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out forwards",
        "scale-in": "scale-in 0.4s ease-out forwards",
      },
    },
  },
  plugins: [],
};
export default config;
