import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2f8ff',
          100: '#dcecff',
          200: '#b7d7ff',
          300: '#82b8ff',
          400: '#4d93ff',
          500: '#2575ff',
          600: '#1758d9',
          700: '#1647a8',
          800: '#143c88',
          900: '#122f6b'
        }
      },
      boxShadow: {
        glass: '0 20px 80px rgba(3, 12, 41, 0.18), inset 0 1px 0 rgba(255,255,255,0.08)'
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(circle at top, rgba(32, 143, 255, 0.18), transparent 40%), radial-gradient(circle at bottom right, rgba(11, 38, 86, 0.18), transparent 25%)'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};

export default config;
