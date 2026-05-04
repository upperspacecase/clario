import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Existing palette — kept for /report and /start/* pages
        cream: "#F8F2E6",
        "cream-card": "#FBF7EB",
        ink: "#1E1A14",
        olive: "#A28A43",
        terracotta: "#C05A3E",
        "terracotta-hover": "#A84A30",

        // hrs design-system tokens
        "surface-tint": "#745a27",
        "surface": "#fcf9f8",
        "surface-bright": "#fcf9f8",
        "surface-dim": "#dcd9d9",
        "surface-container": "#f0eded",
        "surface-container-low": "#f6f3f2",
        "surface-container-lowest": "#ffffff",
        "surface-container-high": "#eae7e7",
        "surface-container-highest": "#e5e2e1",
        "surface-variant": "#e5e2e1",
        "inverse-surface": "#313030",
        "inverse-on-surface": "#f3f0ef",
        "inverse-primary": "#e4c285",
        "background": "#fcf9f8",
        "outline": "#7f7668",
        "outline-variant": "#d0c5b5",
        "on-background": "#1c1b1b",
        "on-surface": "#1c1b1b",
        "on-surface-variant": "#4d463a",
        "primary": "#745a27",
        "primary-container": "#9CB380",
        "primary-fixed": "#ffdea4",
        "primary-fixed-dim": "#e4c285",
        "on-primary": "#ffffff",
        "on-primary-container": "#543d0c",
        "on-primary-fixed": "#261900",
        "on-primary-fixed-variant": "#5a4312",
        "secondary": "#556349",
        "secondary-container": "#d9e8c7",
        "secondary-fixed": "#d9e8c7",
        "secondary-fixed-dim": "#bdcbac",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#5b694f",
        "on-secondary-fixed": "#131f0b",
        "on-secondary-fixed-variant": "#3e4b33",
        "tertiary": "#4e5e82",
        "tertiary-container": "#9dadd5",
        "tertiary-fixed": "#d8e2ff",
        "tertiary-fixed-dim": "#b6c6ef",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#314163",
        "on-tertiary-fixed": "#081b3b",
        "on-tertiary-fixed-variant": "#374669",
        "error": "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",
      },
      fontFamily: {
        // Default sans switched from Karla -> Inter (matches new design)
        sans: ["Inter", "system-ui", "sans-serif"],
        // Default display switched to Noto Serif (matches new design)
        display: ['"Noto Serif"', "serif"],
        serif: ['"Noto Serif"', "serif"],
        // hrs tokens
        "label-sm": ["Inter", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "display-xl": ['"Noto Serif"', "serif"],
        "headline-lg": ['"Noto Serif"', "serif"],
        "headline-md": ['"Noto Serif"', "serif"],
      },
      fontSize: {
        "label-sm": ["13px", { lineHeight: "1", letterSpacing: "0.05em", fontWeight: "600" }],
        "body-md": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        "body-lg": ["18px", { lineHeight: "1.6", fontWeight: "400" }],
        "headline-md": ["32px", { lineHeight: "1.3", fontWeight: "400" }],
        "headline-lg": ["40px", { lineHeight: "1.2", fontWeight: "400" }],
        "display-xl": ["64px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "400" }],
      },
      letterSpacing: {
        label: "0.14em",
      },
      spacing: {
        gutter: "32px",
        "section-v-padding": "120px",
      },
      maxWidth: {
        content: "1200px",
        container: "1120px",
      },
    },
  },
  plugins: [],
};

export default config;
