/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./assets/js/**/*.js"],
  theme: {
    extend: {
      colors: {
        primary: '#000000',
        secondary: '#868686',
        accent: '#DB1215',
        background: '#FFFFFF',
        surface: '#F5F5F5',
        cream: '#FDFCF6',
        lightCream: '#FAF9F2',
        darkRed: '#5E1B1C',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
      }
    }
  },
  plugins: [],
}
