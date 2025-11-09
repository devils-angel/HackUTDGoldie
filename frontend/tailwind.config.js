/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
        colors: {
        background: "#1e1e2d",
        sidebar: "#151521",
        accent: "#3699ff",
        text: "#f5f8fa",
      },
    },
  },
  plugins: [],
};