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
        section: "#000000",
        card: "#0A0A0A",
        border: "#1A1A1A",
        accent: "#8B5CFF",
        accentDeep: "#5B2DFF",
        electric: "#00A3FF",
        mint: "#00F0B5",
        primary: "#FFFFFF",
        secondary: "#8A8A8A",
        disabled: "#5F5F5F"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(139, 92, 255, 0.18), 0 16px 48px rgba(91, 45, 255, 0.14), 0 0 38px rgba(0, 163, 255, 0.08)"
      },
      backgroundImage: {
        "accent-radial":
          "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.02), transparent 30%), radial-gradient(circle at 18% 10%, rgba(255,255,255,0.012), transparent 18%), radial-gradient(circle at 82% 14%, rgba(255,255,255,0.01), transparent 18%), linear-gradient(180deg, #000000 0%, #000000 100%)",
        "accent-gradient":
          "linear-gradient(135deg, #8B5CFF 0%, #5B2DFF 38%, #00A3FF 72%, #00F0B5 100%)"
      }
    }
  },
  plugins: []
};

export default config;
