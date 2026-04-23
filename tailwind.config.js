/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#a63300",
        "primary-dim": "#922c00",
        "primary-container": "#ff7949",
        "on-primary": "#ffefeb",
        "on-primary-container": "#451000",
        "secondary": "#7a5400",
        "secondary-dim": "#6b4900",
        "secondary-container": "#ffc96d",
        "on-secondary": "#fff1df",
        "on-secondary-container": "#604200",
        "tertiary": "#853d97",
        "tertiary-dim": "#78308a",
        "tertiary-container": "#ef9dff",
        "on-tertiary": "#ffeefc",
        "on-tertiary-container": "#5e1470",
        "surface": "#f9f6f4",
        "surface-bright": "#f9f6f4",
        "surface-dim": "#d6d4d2",
        "surface-variant": "#dfdcda",
        "on-surface": "#2f2f2e",
        "on-surface-variant": "#5c5b5a",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f3f0ee",
        "surface-container": "#eae8e6",
        "surface-container-high": "#e4e2e0",
        "surface-container-highest": "#dfdcda",
        "outline": "#787775",
        "outline-variant": "#afadab",
        "background": "#f9f6f4",
        "on-background": "#2f2f2e",
        "error": "#b31b25",
        "on-error": "#ffefee",
      },
      borderRadius: {
        "lg": "2rem",
        "xl": "3rem",
      },
      fontFamily: {
        "headline": ["Plus Jakarta Sans", "sans-serif"],
        "body": ["Be Vietnam Pro", "sans-serif"],
      }
    },
  },
  plugins: [],
}
