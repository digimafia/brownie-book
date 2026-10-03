/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F6F3F0',
        ink: '#241710',
        muted: '#7A6A60',
        line: '#E7E0DA',
        cocoa: { DEFAULT: '#3A2217', soft: '#5A3626', tint: '#F0E8E2' },
        caramel: { DEFAULT: '#C98A3D', tint: '#FBF1E1' },
        ok: { DEFAULT: '#2C7A55', tint: '#E3F3EB' },
        warn: { DEFAULT: '#A9690F', tint: '#FCEFD6' },
        bad: { DEFAULT: '#B23A2E', tint: '#FBE5E2' },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Roboto', '"Segoe UI"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(58,34,23,0.05), 0 6px 18px rgba(58,34,23,0.06)',
        sheet: '0 -12px 40px rgba(36,23,16,0.18)',
        fab: '0 10px 24px rgba(58,34,23,0.35)',
      },
      keyframes: {
        sheet: { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        fade: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideIn: { from: { transform: 'translateX(24px)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } },
        toast: { '0%': { transform: 'translateY(12px)', opacity: '0' }, '12%,88%': { transform: 'translateY(0)', opacity: '1' }, '100%': { transform: 'translateY(12px)', opacity: '0' } },
      },
      animation: {
        sheet: 'sheet 260ms cubic-bezier(0.2,0.8,0.2,1)',
        fade: 'fade 180ms ease-out',
        slideIn: 'slideIn 220ms ease-out',
        toast: 'toast 2200ms ease-in-out forwards',
      },
    },
  },
  plugins: [],
};
