// tailwind.config.js
const scrollbar = require("tailwind-scrollbar");
const scrollbarHide = require("tailwind-scrollbar-hide"); // keeps code tidy
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:  ['"MagicCards"', "serif"],
        serif: ['"MagicCards"', "serif"],
      },
    },
  },
  plugins: [scrollbar({ nocompatible: true }), scrollbarHide],
};
