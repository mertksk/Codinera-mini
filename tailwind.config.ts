import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "#E1E7EC", // Keep or replace? Let's keep for now, might remove later if unused.
        gray: colors.slate,
        primary: colors.purple, // Add purple palette
      },
      backgroundColor: {
        dark: "#1a1035", // Dark purple background for dark mode
      },
      backgroundImage: {
        'dark-radial': 'radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%)',
      },
      fontFamily: {
        sans: ['"Aeonik"', ...defaultTheme.fontFamily.sans],
      },
    },
  },
};

export default config;
