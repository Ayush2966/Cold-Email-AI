/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["Instrument Serif", "Georgia", "serif"],
      },
      colors: {
        ink: "#0f1419",
        mist: "#f4f2ee",
        accent: "#2563eb",
        surface: "#ffffff",
      },
    },
  },
  plugins: [],
};
