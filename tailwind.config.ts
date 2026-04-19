import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'var(--font-ibm-plex)',
          'IBM Plex Sans',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Identidad visual "Ámbar equilibrado" (Fase 14)
        brand: {
          amber: '#f59e0b',
          'amber-hover': '#d97706',
          'amber-light': '#fefce8',
          'amber-text': '#92400e',
        },
        sidebar: {
          bg: '#0f1419',
          'bg-deep': '#141c24',
          item: '#94a3b8',
          'item-hover': 'rgba(255,255,255,0.05)',
          'item-active': 'rgba(245, 158, 11, 0.10)',
          'item-active-text': '#fbbf24',
          'item-active-border': '#f59e0b',
          group: '#8899ab',
          divider: 'rgba(255,255,255,0.04)',
          logo: '#f1f3f5',
          'logo-sub': '#7a8899',
        },
      },
    },
  },
  plugins: [],
};
export default config;
