/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        charcoal: "#141210",
        cream: "#FBF8F0",
        leaf: "#2ED11E",
        yolk: "#E8D400",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
