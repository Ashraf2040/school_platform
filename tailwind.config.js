/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {

    colors: {
      gray: {
        50: "#f9fafb",
        100: "#f3f4f6",
        200: "#e5e7eb",
        300: "#d1d5db",
        400: "#9ca3af",
        500: "#6b7280",
        600: "#4b5563",
        700: "#374151",
        800: "#1f2937",
        900: "#111827",
      },
    },
    extend: {
      fontFamily: {
        arabic: ['"Noto Sans Arabic"', "sans-serif"],
      },
    },
  },
  plugins: [
    require("daisyui"), // ← Add this line
  ],

  // Optional: DaisyUI configuration (recommended)
  daisyui: {
    themes: ["light"], // Use only light theme (or add "dark" if you want both)
    // You can customize further later: https://daisyui.com/docs/config/
  },
};