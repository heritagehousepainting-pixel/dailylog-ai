import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0F766E",
        "primary-dark": "#134E4A",
        accent: "#F59E0B",
        background: "#F8FAFC",
        surface: "#FFFFFF",
        "text-primary": "#1E293B",
        "text-secondary": "#64748B",
        danger: "#DC2626",
        success: "#16A34A",
      },
      fontFamily: {
        heading: ["DM Sans", "sans-serif"],
        body: ["IBM Plex Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;