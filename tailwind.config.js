/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
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