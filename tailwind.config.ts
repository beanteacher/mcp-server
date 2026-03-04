import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#EFF6FF',
          300: '#93C5FD',
          500: '#3B82F6',
          700: '#1D4ED8',
          900: '#1E3A8A',
        },
        neutral: {
          50:  '#F8FAFC',
          200: '#E2E8F0',
          400: '#94A3B8',
          600: '#475569',
          800: '#1E293B',
          950: '#0A0F1E',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        error:   '#EF4444',
        info:    '#38BDF8',
        surface: {
          background: '#0A0F1E',
          card:       '#1E293B',
          overlay:    'rgba(0,0,0,0.6)',
        },
      },

      fontSize: {
        xs:   ['12px', { lineHeight: '1.5' }],
        sm:   ['14px', { lineHeight: '1.5' }],
        base: ['16px', { lineHeight: '1.5' }],
        lg:   ['18px', { lineHeight: '1.5' }],
        xl:   ['20px', { lineHeight: '1.25' }],
        '2xl':['24px', { lineHeight: '1.25' }],
        '3xl':['30px', { lineHeight: '1.25' }],
      },

      spacing: {
        1:  '4px',
        2:  '8px',
        3:  '12px',
        4:  '16px',
        5:  '20px',
        6:  '24px',
        8:  '32px',
        10: '40px',
        12: '48px',
        16: '64px',
      },

      borderRadius: {
        sm:   '4px',
        md:   '8px',
        lg:   '12px',
        xl:   '16px',
        '2xl':'24px',
        full: '9999px',
      },

      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.4)',
        md: '0 4px 6px rgba(0,0,0,0.5)',
        lg: '0 10px 15px rgba(0,0,0,0.5)',
        xl: '0 20px 25px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
}

export default config
