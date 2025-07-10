/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      spacing: {
        '15': '3.75rem',
        '80': '20rem',
      },
      minWidth: {
        '80': '20rem',
      },
    },
  },
  plugins: [],
}
