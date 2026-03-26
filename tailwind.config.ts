import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#060e20",
        surface: "#0f1930",
        "surface-low": "#091328",
        "surface-high": "#141f38",
        "surface-bright": "#1f2b49",
        "surface-variant": "#192540",
        primary: "#a7a5ff",
        "primary-dim": "#645efb",
        "primary-soft": "#c7c6ff",
        secondary: "#34b5fa",
        "secondary-dim": "#17a8ec",
        tertiary: "#ac8aff",
        error: "#ff6e84",
        outline: "#6d758c",
        "outline-variant": "#40485d",
        "on-surface": "#dee5ff",
        "on-surface-variant": "#a3aac4"
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["Fira Code", "monospace"]
      },
      boxShadow: {
        glow: "0 0 35px rgba(100, 94, 251, 0.26)",
        panel: "0 18px 80px rgba(3, 9, 23, 0.45)"
      },
      backgroundImage: {
        hero:
          "radial-gradient(circle at 50% 10%, rgba(100,94,251,0.25), transparent 42%), radial-gradient(circle at 80% 20%, rgba(52,181,250,0.18), transparent 32%), linear-gradient(180deg, rgba(6,14,32,0.98), rgba(6,14,32,1))",
        grid:
          "linear-gradient(rgba(109,117,140,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(109,117,140,0.08) 1px, transparent 1px)"
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem"
      },
      animation: {
        pulseSoft: "pulseSoft 2.6s ease-in-out infinite",
        float: "float 8s ease-in-out infinite",
        shimmer: "shimmer 2.4s linear infinite"
      },
      keyframes: {
        pulseSoft: {
          "0%, 100%": { opacity: "0.65" },
          "50%": { opacity: "1" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        }
      }
    }
  },
  plugins: []
};

export default config;
