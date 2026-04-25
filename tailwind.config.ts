import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        card: "#111111",
        border: "#1F1F1F",
        accent: "#7C5CFF",
        primary: "#FFFFFF",
        secondary: "#A1A1AA"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(124, 92, 255, 0.24), 0 12px 40px rgba(124, 92, 255, 0.18)"
      },
      backgroundImage: {
        "accent-radial":
          "radial-gradient(circle at top, rgba(124,92,255,0.18), transparent 45%)"
      }
    }
  },
  plugins: []
};

export default config;
