/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'navy-start': '#0A1128',
        'navy-end': '#16204A',
        gold: {
          DEFAULT: '#E8B84A',
          glow: 'rgba(232,184,74,0.35)',
        },
        'blue-accent': '#4DA8FF',
        emerald: '#1FAE7A',
        rose: '#E5556B',
        text: {
          'dark-primary': '#F7F7F5',
          'dark-secondary': 'rgba(247,247,245,0.7)',
          'light-primary': '#0F1B3D',
        },
        content: {
          'bg-light': '#F7F7F5',
          'panel-light': '#FFFFFF',
        },
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-ibm-plex-mono)', 'monospace'],
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,0.25)',
        'gold-glow': '0 0 24px rgba(232,184,74,0.35)',
        'panel-light': '0 2px 8px rgba(15,27,61,0.08)',
      },
      borderRadius: {
        card: '16px',
        panel: '12px',
      },
    },
  },
  plugins: [],
};
