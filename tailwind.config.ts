import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/renderer/**/*.{ts,tsx,js,jsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "sky-surface": {
          DEFAULT: "#1f0f3b",
          foreground: "#f6f1ff",
        },
        "sky-accent": {
          DEFAULT: "#b96bff",
          foreground: "#170f35",
        },
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        overlay: "0 40px 80px rgba(13, 7, 23, 0.35)",
      },
      backgroundImage: {
        "sky-gradient":
          "radial-gradient(circle at top left, #ff67c7 0%, #7a35ff 35%, #120036 100%)",
      },
      animation: {
        "fade-in": "fadeIn 120ms ease-out",
        "slide-up": "slideUp 140ms ease-out",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { transform: "translateY(16px)" },
          to: { transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

