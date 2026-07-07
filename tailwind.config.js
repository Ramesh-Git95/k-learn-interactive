/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        korean: ['Noto Sans KR', 'sans-serif'],
      },
      colors: {
        'han-blue': '#3D5A80',
        'han-sky': '#98C1D9',
        'han-light': '#E0FBFC',
        'han-red': '#EE6C4D',
        'han-dark': '#293241',
        // Enhanced Dark Mode Palette
        'dm-bg': '#1a202c',
        'dm-surface': '#2d3748',
        'dm-text-primary': '#edf2f7',
        'dm-text-secondary': '#a0aec0',
        'dm-accent': '#98c1d9',
        'dm-border': '#4a5568',
        // High contrast mode colors
        'hc-bg': '#000000',
        'hc-surface': '#ffffff',
        'hc-text': '#ffffff',
        'hc-accent': '#ffff00',
      },
      keyframes: {
        'flip-y': {
          '0%': { transform: 'rotateY(0)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        'flip-y-back': {
          '0%': { transform: 'rotateY(180deg)' },
          '100%': { transform: 'rotateY(0)' },
        },
        'fadeIn': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slideIn': {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slideUp': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scaleIn': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-2px)' },
        },
        'pulse-gentle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-2px)' },
          '75%': { transform: 'translateX(2px)' },
        },
        'theme-switch': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(180deg)' },
        },
        'flip-3d': {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        'flip-3d-back': {
          '0%': { transform: 'rotateY(180deg)' },
          '100%': { transform: 'rotateY(0deg)' },
        },
        'skeleton-wave': {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-468px 0' },
          '100%': { backgroundPosition: '468px 0' },
        },
      },
      animation: {
        'flip-3d': 'flip-3d 0.6s ease-in-out',
        'flip-3d-back': 'flip-3d-back 0.6s ease-in-out',
        'fadeIn': 'fadeIn 0.5s ease-out',
        'slideIn': 'slideIn 0.3s ease-out',
        'slideUp': 'slideUp 0.4s ease-out',
        'scaleIn': 'scaleIn 0.3s ease-out',
        'bounce-subtle': 'bounce-subtle 0.6s ease-in-out',
        'pulse-gentle': 'pulse-gentle 2s ease-in-out infinite',
        'shake': 'shake 0.3s ease-in-out',
        'theme-switch': 'theme-switch 0.3s ease-in-out',
        'skeleton-wave': 'skeleton-wave 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
