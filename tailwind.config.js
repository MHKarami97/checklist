/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        vazir: ['Vazirmatn', 'sans-serif']
      },
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          400: '#5b8def',
          500: '#3b6fe0',
          600: '#2a56c2',
          700: '#1f469c'
        }
      },
      animation: {
        'check-pop': 'checkPop 0.25s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out'
      },
      keyframes: {
        checkPop: {
          '0%': { transform: 'scale(0.7)', opacity: '0.5' },
          '60%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      }
    }
  },
  plugins: []
}
