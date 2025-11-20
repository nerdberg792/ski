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
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        sky: {
          surface: {
            DEFAULT: "#000000",
            glass: "rgba(255, 255, 255, 0.3)", // More translucent for colorful background
          },
          text: {
            primary: "#FFFFFF",
            secondary: "rgba(255, 255, 255, 0.7)",
            tertiary: "rgba(255, 255, 255, 0.5)",
          },
          accent: {
            DEFAULT: "#007AFF",
            foreground: "#FFFFFF",
          },
          // New colorful palette
          pink: "#FF00FF",
          purple: "#800080",
          blue: "#0000FF",
        },
        "glass-border": "rgba(255, 255, 255, 0.2)",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        overlay: "0 40px 80px rgba(0, 0, 0, 0.2)",
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.05)",
        "glass-sm": "0 4px 16px 0 rgba(0, 0, 0, 0.05)",
        "glass-lg": "0 12px 40px 0 rgba(0, 0, 0, 0.1)",
      },
      backgroundImage: {
        "sky-gradient":
          "radial-gradient(circle at top left, #27272a 0%, #09090b 50%, #000000 100%)",
        "glass-gradient": "linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05))", // White gradient
      },
      animation: {
        "fade-in": "fadeIn 300ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        "slide-up": "slideUp 400ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { transform: "translateY(20px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

