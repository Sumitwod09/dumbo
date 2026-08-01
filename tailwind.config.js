/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dumbo: {
          rose: {
            50: "#fff1f2",
            100: "#ffe4e6",
            500: "#f43f5e",
            600: "#e11d48",
          },
          sky: {
            50: "#f0f9ff",
            100: "#e0f2fe",
            500: "#0ea5e9",
            600: "#0284c7",
          },
          amber: {
            50: "#fffbeb",
            100: "#fef3c7",
            500: "#f59e0b",
            600: "#d97706",
          },
          violet: {
            50: "#f5f3ff",
            100: "#ede9fe",
            500: "#8b5cf6",
            600: "#7c3aed",
          },
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-gentle": "bounce 2s infinite",
      },
    },
  },
  plugins: [],
};
