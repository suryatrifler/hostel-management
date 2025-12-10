/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        terminal: '#ffb000',     // Your Amber color
        bg: '#0d0d0d',           // Your Dark background
      },
      fontFamily: {
        vt323: ['"VT323"', 'monospace'], 
      },
      animation: {
        flicker: 'flicker 0.15s infinite',
        blink: 'blink 1s step-end infinite',
        slideIn: 'slideIn 0.5s ease-out',
      },
      keyframes: {
        flicker: {
          '0%': { opacity: '0.97' },
          '5%': { opacity: '0.95' },
          '100%': { opacity: '0.95' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        slideIn: {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        loading: {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
        // --- NEW ANIMATIONS FOR ADMIN PANEL ---
        scan: {
          '0%': { top: '-20%' },
          '100%': { top: '120%' },
        },
        shine: {
          '0%': { left: '-100%' },
          '100%': { left: '100%' },
        }
      }
    },
  },
  plugins: [],
}