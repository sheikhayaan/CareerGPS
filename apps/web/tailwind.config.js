/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#060912",
          secondary: "#0E1525",
        },
        surface: {
          DEFAULT: "#0E1525",
          hover: "#161E30",
        },
        secondary: "#101827",
        primary: {
          DEFAULT: "#6366F1",
          hover: "#4F46E5",
        },
        accent: {
          DEFAULT: "#06B6D4",
        },
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
        text: {
          primary: "#F8FAFC",
          secondary: "#94A3B8",
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'float-slow': 'floatSlow 8s ease-in-out infinite',
        'float-reverse': 'floatReverse 10s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 5s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'fade-in-scale': 'fadeInScale 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both',
      },
    },
  },
  plugins: [],
}
