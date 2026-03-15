import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta principal — identidade da Dra. Mônica
        lilac: {
          50:  '#f5f0ff',
          100: '#ede5ff',
          200: '#ddd0ff',
          300: '#c5aeff',
          400: '#a97fff',
          500: '#8b52f7',
          600: '#7730ed',
          700: '#651fd9',
          800: '#541ab5',
          900: '#461994',
          950: '#2a0d65',
        },
        gold: {
          50:  '#fefbec',
          100: '#fdf3c9',
          200: '#fbe48e',
          300: '#f9cf4a',
          400: '#f7bc1f',
          500: '#e69d0c',
          600: '#c87807',
          700: '#a0540a',
          800: '#844210',
          900: '#703712',
          950: '#411b05',
        },
        // Tons de fundo lilás claro
        surface: {
          DEFAULT: '#f8f4ff',  // fundo principal
          card:    '#ffffff',
          muted:   '#f0eaff',
          border:  '#e2d9f5',
        },
        // Texto
        ink: {
          DEFAULT: '#2d1b69',  // texto principal — roxo escuro
          muted:   '#6b5b9a',  // texto secundário
          light:   '#9b8cc0',  // texto placeholder
        },
      },
      fontFamily: {
        display: ['var(--font-cormorant)', 'Georgia', 'serif'],
        body:    ['var(--font-nunito)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-jetbrains)', 'monospace'],
      },
      backgroundImage: {
        'gradient-lilac': 'linear-gradient(135deg, #f5f0ff 0%, #ede5ff 50%, #fdf3c9 100%)',
        'gradient-card':  'linear-gradient(145deg, #ffffff 0%, #f8f4ff 100%)',
        'gradient-gold':  'linear-gradient(135deg, #f9cf4a 0%, #e69d0c 100%)',
        'gradient-hero':  'linear-gradient(160deg, #f5f0ff 0%, #ede5ff 40%, #fdf3c9 100%)',
      },
      boxShadow: {
        'card':    '0 2px 20px rgba(139, 82, 247, 0.08)',
        'card-lg': '0 8px 40px rgba(139, 82, 247, 0.12)',
        'gold':    '0 4px 20px rgba(230, 157, 12, 0.25)',
        'focus':   '0 0 0 3px rgba(139, 82, 247, 0.25)',
      },
      borderRadius: {
        'xl':  '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 4px 20px rgba(230, 157, 12, 0.25)' },
          '50%':      { boxShadow: '0 4px 30px rgba(230, 157, 12, 0.45)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
