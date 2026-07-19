/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        terracota: '#B4513A',
        ocre: '#C68A3B',
        oliva: '#6B7F3F',
        crema: '#F7F1E5',
        carbon: '#2A2522',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 20px rgba(42, 37, 34, 0.08)',
      },
    },
  },
  plugins: [],
};
