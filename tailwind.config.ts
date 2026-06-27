import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#5B4FE8",
          50: "#EFEDFD",
          100: "#DBD7FB",
          200: "#B8AFF6",
          300: "#9488F1",
          400: "#7A6CEC",
          500: "#5B4FE8",
          600: "#3E30D8",
          700: "#3127A8",
          800: "#241D7B",
          900: "#18144F",
        },
        accent: {
          DEFAULT: "#00C4B4",
          50: "#D9FFFB",
          100: "#A6FBF3",
          200: "#5FF0E4",
          300: "#1FE2D2",
          400: "#00C4B4",
          500: "#00A99B",
          600: "#008176",
        },
        ink: {
          950: "#0A0918",
          900: "#0F0D22",
          850: "#15122E",
          800: "#1B1738",
          700: "#241F47",
          600: "#322B5C",
        },
        hot: "#F0506E",
        warm: "#F5A623",
        cold: "#3B82F6",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(91,79,232,0.18), 0 12px 40px -12px rgba(91,79,232,0.45)",
        card: "0 8px 30px -12px rgba(0,0,0,0.6)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #5B4FE8 0%, #00C4B4 100%)",
        "brand-radial":
          "radial-gradient(1200px 600px at 10% -10%, rgba(91,79,232,0.18), transparent 60%), radial-gradient(900px 500px at 110% 10%, rgba(0,196,180,0.12), transparent 55%)",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s infinite",
        "fade-in": "fade-in 0.25s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
