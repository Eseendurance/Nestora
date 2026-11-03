import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: { ink:'#131a17', muted:'#5c6a64', paper:'#f8f7f4', brand:'#14532d', 'brand-soft':'#e7f2ec', accent:'#b45309' },
    fontFamily: { display:['var(--font-display)'], body:['var(--font-body)'] }
  }},
  plugins: []
};
export default config;
