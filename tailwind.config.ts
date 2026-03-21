import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Krea.ai dark theme palette
        background: "#0a0a0a",
        surface: "#111111",
        "surface-2": "#1a1a1a",
        "surface-3": "#222222",
        border: "#2a2a2a",
        "border-2": "#333333",
        accent: "#7c3aed",
        "accent-2": "#6d28d9",
        "accent-glow": "rgba(124, 58, 237, 0.4)",
        text: "#e5e5e5",
        "text-muted": "#737373",
        "text-dim": "#525252",
        success: "#22c55e",
        error: "#ef4444",
        warning: "#f59e0b",
        running: "#a855f7",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      backgroundImage: {
        "dot-grid":
          "radial-gradient(circle, #2a2a2a 1px, transparent 1px)",
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      backgroundSize: {
        "dot-grid": "24px 24px",
      },
      animation: {
        "pulse-glow": "pulseGlow 1.5s ease-in-out infinite",
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-in-left": "slideInLeft 0.3s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        spin: "spin 1s linear infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": {
            boxShadow: "0 0 8px 2px rgba(124, 58, 237, 0.4)",
          },
          "50%": {
            boxShadow: "0 0 20px 6px rgba(124, 58, 237, 0.8)",
          },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideInLeft: {
          from: { opacity: "0", transform: "translateX(-16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        slideInRight: {
          from: { opacity: "0", transform: "translateX(16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
