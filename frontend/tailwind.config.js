/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Chakra Petch"', "ui-sans-serif", "system-ui", "sans-serif"],
        body: ['"Chakra Petch"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        bro: { blue: "#1e40af", gold: "#f2c14e", ink: "#0f172a", soft: "#e5e7eb" }
      },
      boxShadow: {
        glow: "0 10px 35px rgba(30,64,175,.20)",
        card: "0 6px 20px rgba(0,0,0,.25)"
      },
      borderRadius: { xl2: "1rem" }
    },
  },
  plugins: [],
}
