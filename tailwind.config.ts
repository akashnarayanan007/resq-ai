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
        // Neon Command Design System Tokens
        cmd: {
          bg: "#080F23",
          surface: "#101C35",
          "surface-raised": "#172541",
          "surface-hover": "#1E3156",
          border: "#1E2E4E",
          "border-bright": "rgba(0, 217, 255, 0.35)",
          primary: "#246BFD",
          cyan: "#00D9FF",
          critical: "#FF4D67",
          warning: "#FFB547",
          success: "#19E6A0",
          text: "#F8FAFF",
          muted: "#A5B4D0",
        },
        navy: {
          950: "#050B1A",
          900: "#080F23",
          850: "#0F1A33",
          800: "#101C35",
          750: "#172541",
          700: "#1E3156",
          600: "#2B416D",
          500: "#3D5A96",
        },
        emergency: {
          critical: "#FF4D67",
          warning: "#FFB547",
          resolved: "#19E6A0",
          info: "#00D9FF",
          beacon: "#246BFD",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "neon-cyan": "0 0 20px -3px rgba(0, 217, 255, 0.45)",
        "neon-coral": "0 0 20px -3px rgba(255, 77, 103, 0.5)",
        "neon-blue": "0 0 20px -3px rgba(36, 107, 253, 0.5)",
        "cmd-surface": "0 10px 30px -10px rgba(0, 0, 0, 0.7), 0 0 1px 1px rgba(255, 255, 255, 0.05)",
      },
      keyframes: {
        pulseCritical: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(1.06)" },
        },
        radarSweep: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        subtleGlow: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
      },
      animation: {
        "pulse-critical": "pulseCritical 2.2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "radar-sweep": "radarSweep 8s linear infinite",
        "subtle-glow": "subtleGlow 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
