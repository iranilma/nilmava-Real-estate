/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          forest: '#1b4332',
          forestDark: '#081c15',
          forestLight: '#2d6a4f',
          forestAccent: '#40916c',
          gold: '#c5a059',
          goldHover: '#b38f46',
          goldLight: '#f4ede1',
          ivory: '#faf9f5',
          ivoryDark: '#f3efe6',
          charcoal: '#1a1f1d',
          charcoalMuted: '#2d3330',
          slateText: '#4a5550'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(27, 67, 50, 0.05), 0 1px 2px -1px rgba(27, 67, 50, 0.05)',
        'card-hover': '0 4px 6px -1px rgba(27, 67, 50, 0.1), 0 2px 4px -2px rgba(27, 67, 50, 0.08)',
        'modal': '0 25px 50px -12px rgba(8, 28, 21, 0.35)',
      }
    },
  },
  plugins: [],
}
