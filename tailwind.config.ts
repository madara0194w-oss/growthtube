import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // YouTube-inspired dark theme colors
        'vt-bg-primary': '#0f0f0f',
        'vt-bg-secondary': '#1a1a1a',
        'vt-bg-tertiary': '#272727',
        'vt-bg-hover': '#3f3f3f',
        'vt-text-primary': '#f1f1f1',
        'vt-text-secondary': '#aaaaaa',
        'vt-text-tertiary': '#717171',
        'vt-accent': '#ff0000',
        'vt-accent-hover': '#cc0000',
        'vt-border': '#3f3f3f',
        // Light theme colors
        'vt-light-bg-primary': '#ffffff',
        'vt-light-bg-secondary': '#f9f9f9',
        'vt-light-bg-tertiary': '#e5e5e5',
        'vt-light-bg-hover': '#e5e5e5',
        'vt-light-text-primary': '#0f0f0f',
        'vt-light-text-secondary': '#606060',
        'vt-light-text-tertiary': '#909090',
        'vt-light-border': '#e5e5e5',
      },
      fontFamily: {
        sans: ['Roboto', 'Arial', 'sans-serif'],
      },
      spacing: {
        'sidebar': '240px',
        'sidebar-mini': '72px',
        'header': '56px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
