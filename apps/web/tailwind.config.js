/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF',
        surface: '#F5F5F3',
        dark: '#111111',
        border: '#E5E5E5',
        primary: {
          DEFAULT: '#171717',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#737373',
          foreground: '#171717',
        },
        accent: {
          DEFAULT: '#D97736',
          hover: '#C26425',
          light: '#FDF6F0',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
};

