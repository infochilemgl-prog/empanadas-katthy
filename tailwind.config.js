/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        charcoal: "#141210",
        cream: "#FBF8F0",
        leaf: "#2ED11E",
        terracotta: "#C1502E",
        mustard: "#D9A441",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
