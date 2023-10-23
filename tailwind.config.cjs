/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsla(0, 0%, 13%, 1)",
        primary: "hsla(55, 96%, 67%, 1)",
        "primary-dark": "hsla(47, 93%, 63%, 1)",
        "light-gray": "hsla(0, 0%, 84%, 1)",
        "dark-gray": "hsla(120, 2%, 20%, 1)",
      },
      keyframes: {
        shadowbounce: {
          '0%, 100%': { transform: 'translateX(0.5rem) translateY(0.5rem)' },
          '50%': { transform: 'translateX(0rem)' },
        },
      }
    },
  },
  plugins: [],
};
