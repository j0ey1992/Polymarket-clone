module.exports = {
  purge: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'poly-dark': '#0d1117',
        'poly-card': '#161b22',
        'poly-border': 'rgba(51, 65, 85, 0.5)',
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
