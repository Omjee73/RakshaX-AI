/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5faf8",
          100: "#d8f2e7",
          200: "#aee5cf",
          300: "#7ed3b3",
          400: "#49bb95",
          500: "#1f9d78",
          600: "#157e60",
          700: "#10634d",
          800: "#0f4f3e",
          900: "#0f4134"
        },
        alert: {
          low: "#15803d",
          medium: "#b45309",
          high: "#b91c1c"
        }
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 14px 40px rgba(15, 23, 42, 0.08)"
      },
      keyframes: {
        floatIn: {
          "0%": { opacity: 0, transform: "translateY(12px)" },
          "100%": { opacity: 1, transform: "translateY(0)" }
        }
      },
      animation: {
        floatIn: "floatIn 0.5s ease-out both"
      }
    }
  },
  plugins: []
};
