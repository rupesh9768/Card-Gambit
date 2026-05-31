/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Cinzel', 'Georgia', 'serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        arcane: '0 0 30px rgba(147, 51, 234, 0.35)',
        ember: '0 0 24px rgba(245, 158, 11, 0.28)',
        frost: '0 0 26px rgba(56, 189, 248, 0.3)',
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        pulseGlow: 'pulseGlow 3s ease-in-out infinite',
        fadeUp: 'fadeUp 0.55s ease-out both',
        shimmer: 'shimmer 2.4s linear infinite',
        softPulse: 'softPulse 2.8s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.45', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.04)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(120%)' },
        },
        softPulse: {
          '0%, 100%': { boxShadow: '0 0 18px rgba(245, 158, 11, 0.16)' },
          '50%': { boxShadow: '0 0 34px rgba(245, 158, 11, 0.34)' },
        },
      },
    },
  },
  plugins: [],
};
