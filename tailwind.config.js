/** @type {import('tailwindcss').Config} */
module.exports = {
  purge: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Crypto.com exact dark backgrounds
        dark: {
          950: '#080d1b',      // --bg-app
          900: '#0B1426',      // --bg-surface-app, --mantine-color-grey-9
          850: '#151D32',      // --bg-surface-secondary, --mantine-color-grey-8
          800: '#1F283C',      // --bg-surface-primary, --mantine-color-grey-7
          750: '#323C52',      // --bg-surface-emphasis, --mantine-color-grey-6
          700: '#565F76',      // --mantine-color-grey-5
          600: '#7B849B',      // --mantine-color-grey-4
          500: '#A0A9BE',      // --mantine-color-grey-3
          400: '#C9CFDD',      // --mantine-color-grey-2
        },
        // Crypto.com primary blue
        accent: {
          blue: '#1199FA',     // --mantine-color-primary-4, --common-primary
          'blue-light': '#4DB5FF',  // --mantine-color-primary-3
          'blue-lighter': '#92D1FF', // --mantine-color-primary-2
          'blue-dark': '#0577DA',   // --mantine-color-primary-5
          'blue-darker': '#034481', // --mantine-color-primary-6
          cyan: '#15aabf',
          purple: '#C288F9',   // --mantine-color-purple-4
          'purple-bold': '#CD9EFF', // --content-decorative-purple-bold
          orange: '#F76341',   // --content-decorative-orange
        },
        // Crypto.com status colors
        success: {
          DEFAULT: '#00A68C',  // --common-success, --content-success
          light: '#5DD1BF',    // --content-success-bold, --mantine-color-green-3
          dark: '#017361',     // --mantine-color-green-7
          subtle: '#00392F',   // --bg-status-success-subtle
        },
        danger: {
          DEFAULT: '#E0485C',  // --common-danger, --content-danger
          light: '#ED7685',    // --content-danger-bold, --mantine-color-red-3
          dark: '#A22636',     // --bg-status-danger
          subtle: '#4D0E17',   // --bg-status-danger-subtle
        },
        warning: {
          DEFAULT: '#F5B700',  // --common-pending, --content-warning
          light: '#FFE591',    // --content-warning-bold
          dark: '#D9A200',     // --bg-status-warning
          subtle: '#593900',   // --bg-status-warning-subtle
        },
        // Crypto.com text colors
        text: {
          primary: '#FFFFFF',   // --content-primary
          secondary: '#A0A9BE', // --content-secondary, --text-secondary
          muted: '#7B849B',     // --content-tertiary
          accent: '#92D1FF',    // --content-active-bold
        },
        // Surface colors
        surface: {
          app: '#0B1426',
          primary: '#1F283C',
          secondary: '#151D32',
          tertiary: '#001B3C',
          emphasis: '#323C52',
          contrast: '#FFFFFF',
        },
        // Border colors
        border: {
          default: 'rgba(255, 255, 255, 0.1)',  // --border-surface-default
          emphasis: 'rgba(255, 255, 255, 0.2)', // --border-surface-emphasis
          active: '#1199FA',    // --border-status-active
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'sm': '8px',   // --mantine-radius-sm
        'md': '10px',  // --mantine-radius-md, --mantine-radius-default
        'lg': '16px',  // --mantine-radius-lg
        'xl': '16px',
        '4xl': '2rem',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(17, 153, 250, 0.3)',
        'glow-cyan': '0 0 20px rgba(21, 170, 191, 0.3)',
        'glow-green': '0 0 20px rgba(0, 166, 140, 0.3)',
        'glow-red': '0 0 20px rgba(224, 72, 92, 0.3)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.3)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-card': 'linear-gradient(135deg, rgba(17, 153, 250, 0.1) 0%, rgba(194, 136, 249, 0.05) 100%)',
        'gradient-hero': 'linear-gradient(180deg, rgba(17, 153, 250, 0.15) 0%, transparent 50%)',
        'glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
      },
      transitionDuration: {
        '400': '400ms',
      },
    },
  },
  variants: {
    extend: {
      backgroundColor: ['hover', 'focus', 'active', 'group-hover'],
      borderColor: ['hover', 'focus', 'active', 'group-hover'],
      textColor: ['hover', 'focus', 'active', 'group-hover'],
      opacity: ['hover', 'focus', 'active', 'group-hover'],
      transform: ['hover', 'focus', 'active', 'group-hover'],
      scale: ['hover', 'focus', 'active', 'group-hover'],
    },
  },
  plugins: [],
};
