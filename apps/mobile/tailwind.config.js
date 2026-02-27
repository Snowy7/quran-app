/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Warm brown palette — matching web app
        primary: {
          DEFAULT: "#5C4033",
          50: "#FAF6F3",
          100: "#F0E6DD",
          200: "#E0CCBB",
          300: "#CBA98E",
          400: "#B08968",
          500: "#8B6914",
          600: "#6B4F3A",
          700: "#5C4033",
          800: "#4A3228",
          900: "#3A271F",
          950: "#2A1C16",
        },
        accent: {
          DEFAULT: "#B08968",
          50: "#FCF8F5",
          100: "#F5EDE4",
          200: "#EAD9C8",
          300: "#D4B896",
          400: "#B08968",
          500: "#967252",
          600: "#7A5C42",
          700: "#634A36",
          800: "#4F3B2B",
          900: "#3D2E22",
        },
        background: {
          DEFAULT: "#FAF6F3",
          dark: "#1A1412",
        },
        card: {
          DEFAULT: "#FFFFFF",
          dark: "#2A1F1A",
        },
        muted: {
          DEFAULT: "#F0E6DD",
          foreground: "#8B7355",
          dark: "#3A2E26",
        },
        foreground: {
          DEFAULT: "#2A1C16",
          dark: "#F0E6DD",
        },
      },
      fontFamily: {
        inter: ["Inter"],
        poppins: ["Poppins"],
        scheherazade: ["ScheherazadeNew"],
        almarai: ["Almarai"],
      },
    },
  },
  plugins: [],
};
