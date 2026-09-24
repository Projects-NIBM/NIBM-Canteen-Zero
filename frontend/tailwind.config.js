/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nibmBlue: '#0b3d91',
        nibmRed: '#d71920',
        nibmGold: '#ffc600',
        nibmGray: '#f8fafc',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.8s ease-in-out forwards',
        'slide-in-left': 'slideInLeft 0.7s ease-out forwards',
        'reveal-qr': 'revealQR 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards', // New "Next Level" animation
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        revealQR: {
          '0%': { opacity: '0', transform: 'scale(0.5) rotate(-10deg)', filter: 'blur(10px)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0deg)', filter: 'blur(0)' },
        }
      },
      boxShadow: {
        'premium': '0 20px 50px rgba(11, 61, 145, 0.12)',
      }
    },
  },
  plugins: [],
}