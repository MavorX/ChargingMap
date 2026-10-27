import { colors } from './src/theme/palette.js'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      zIndex: {
        fab: '30',
        panel: '40',
        header: '50',
        modal: '60',
        toast: '70'
      },
      colors,
      boxShadow: {
        soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'soft-md': '0 4px 25px -5px rgba(0, 0, 0, 0.08), 0 15px 35px -5px rgba(0, 0, 0, 0.05)',
        'soft-lg': '0 8px 40px -8px rgba(0, 0, 0, 0.12), 0 20px 50px -12px rgba(0, 0, 0, 0.08)',
        'soft-xl': '0 12px 55px -10px rgba(0, 0, 0, 0.15), 0 25px 60px -15px rgba(0, 0, 0, 0.1)',
        'glow-primary': '0 0 20px rgba(0, 140, 130, 0.2)',
        'glow-secondary': '0 0 20px rgba(0, 140, 130, 0.2)',
        'glow-accent': '0 0 20px rgba(194, 254, 6, 0.2)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)'
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem'
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-mesh':
          'linear-gradient(135deg, rgba(0, 140, 130, 0.04) 0%, rgba(153, 209, 205, 0.08) 100%)',
        'gradient-premium': `linear-gradient(135deg, ${colors.surface[800]} 0%, ${colors.brand.ink} 100%)`,
        'gradient-energy': `linear-gradient(135deg, ${colors.primary[600]} 0%, ${colors.brand.green} 100%)`,
        'gradient-sunset': 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
        'gradient-ocean': `linear-gradient(135deg, ${colors.brand.green} 0%, ${colors.brand.soft} 100%)`,
        'gradient-dark': `linear-gradient(135deg, ${colors.surface[800]} 0%, ${colors.brand.ink} 100%)`
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        'slide-up-fade': 'slideUpFade 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'bounce-soft': 'bounceSoft 2s infinite',
        glow: 'glow 2s ease-in-out infinite alternate',
        'spin-slow': 'spin 3s linear infinite'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        slideUpFade: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' }
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 140, 130, 0.1), 0 0 20px rgba(0, 140, 130, 0.05)' },
          '100%': { boxShadow: '0 0 10px rgba(0, 140, 130, 0.2), 0 0 40px rgba(0, 140, 130, 0.1)' }
        }
      },
      backdropBlur: {
        xs: '2px'
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
      }
    }
  },
  plugins: []
}
