import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Orbitron', 'Space Grotesk Variable', 'sans-serif'],
        sans: ['Space Grotesk Variable', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono Variable', 'monospace'],
      },
      colors: {
        rush: {
          bg: 'rgb(var(--rush-bg) / <alpha-value>)',
          surface: 'rgb(var(--rush-surface) / <alpha-value>)',
          card: 'rgb(var(--rush-card) / <alpha-value>)',
          border: 'rgb(var(--rush-border) / <alpha-value>)',
          text: 'rgb(var(--rush-text) / <alpha-value>)',
          muted: 'rgb(var(--rush-muted) / <alpha-value>)',
          electric: '#00E5FF',
          blue: '#2563EB',
          purple: '#A855F7',
          orange: '#FF7A00',
          neon: '#22C55E',
          amber: '#FACC15',
          crimson: '#EF4444',
        },
      },
      boxShadow: {
        'glow-cyan': '0 0 24px rgba(0, 229, 255, 0.45), inset 0 0 12px rgba(0, 229, 255, 0.2)',
        'glow-purple': '0 0 24px rgba(168, 85, 247, 0.45), inset 0 0 12px rgba(168, 85, 247, 0.2)',
        'glow-orange': '0 0 24px rgba(255, 122, 0, 0.45), inset 0 0 12px rgba(255, 122, 0, 0.2)',
        'glow-green': '0 0 24px rgba(34, 197, 94, 0.45), inset 0 0 12px rgba(34, 197, 94, 0.2)',
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'rushFloat 5s ease-in-out infinite',
      },
      keyframes: {
        rushFloat: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
