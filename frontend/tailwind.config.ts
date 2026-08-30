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
        slip: { DEFAULT: "#EDEAE3", raised: "#F6F4EF" },
        char: { DEFAULT: "#26221F", soft: "#57514B" },
        copper: "#9C6B5E",
        // Semantic tokens mapped to CSS vars (globals.css --surface/--bg/--ink)
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
      },
      boxShadow: {
        shelf: "0 1px 2px rgba(38,34,31,.06), 0 8px 24px rgba(38,34,31,.08)",
        lifted: "0 2px 4px rgba(38,34,31,.08), 0 16px 40px rgba(38,34,31,.14)",
      },
    },
  },
  plugins: [],
};
export default config;
