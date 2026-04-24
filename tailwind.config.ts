import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F8F2E6",
        "cream-card": "#FBF7EB",
        ink: "#1E1A14",
        olive: "#A28A43",
        terracotta: "#C05A3E",
        "terracotta-hover": "#A84A30",
      },
      fontFamily: {
        display: ['"Playfair Display"', "serif"],
        sans: ["Karla", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        label: "0.14em",
      },
      maxWidth: {
        content: "1200px",
      },
    },
  },
  plugins: [],
};

export default config;
