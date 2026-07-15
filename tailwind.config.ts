import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#003087',
          light: '#004db3',
          lighter: '#e8f0fb',
        },
        accent: '#e5001a',
      },
    },
  },
  plugins: [],
}

export default config
