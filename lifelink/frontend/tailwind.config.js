/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#edfbff',
          100: '#d6f5ff',
          200: '#b5edff',
          300: '#83e2ff',
          400: '#48cdff',
          500: '#1eb0f5',
          600: '#068ed1',
          700: '#0770a8',
          800: '#0c5d8a',
          900: '#104e72',
          950: '#0a3350',
        },
        accent: {
          50:  '#fff6f0',
          100: '#ffe9d9',
          200: '#ffd0b2',
          300: '#ffae7d',
          400: '#ff8145',
          500: '#ff5f20',
          600: '#f04010',
          700: '#c72f0b',
          800: '#a0280f',
          900: '#832514',
        },
        success: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        medical: {
          50:  '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        brand: {
          50:  '#f0f4ff',
          100: '#e0eaff',
          500: '#4361ee',
          600: '#3751d7',
          700: '#2c42bf',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 16px 40px rgba(0,0,0,0.08)',
        'glow-primary': '0 0 0 4px rgba(14,112,209,0.15)',
        'glow-medical': '0 0 0 4px rgba(20,184,166,0.15)',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #0770a8 0%, #0c5d8a 40%, #0a3350 100%)',
        'card-gradient': 'linear-gradient(135deg, #f0fdfa 0%, #edfbff 100%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
}
