/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/ui/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        figma: {
          bg: '#2C2C2C',
          panel: '#383838',
          border: '#444444',
          text: '#FFFFFF',
          textMuted: '#AAAAAA',
          blue: '#18A0FB',
          blueHover: '#0D8DE2'
        }
      }
    },
  },
  plugins: [],
}