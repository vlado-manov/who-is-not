// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          100: "#49D0B5",
          200: "#374EE2",
          300: "#205E46",
          400: "#02BA1D",
          500: "#FA3A00",
          600: "#BA350D",
          700: "#FA8900",
          800: "#CACA23",
          900: "#C44CD7",
        },
        customBlack: {
          500: "#3F3F3F",
        },
      },
      boxShadow: {
        custom: "0 4px 4px 0 rgba(0,0,0,0.25)",
        custom50: "0 4px 4px 0 rgba(0,0,0,0.5)",
      },
      fontFamily: {
        amatic: ["AmaticSC-Regular"],
        "amatic-bold": ["AmaticSC-Bold"],
        alumni: ["AlumniSansCollegiateOne-Regular"],
        messiri: ["ElMessiri-Regular"],
        "messiri-bold": ["ElMessiri-Bold"],
        "messiri-semibold": ["ElMessiri-SemiBold"],
        "messiri-medium": ["ElMessiri-Medium"],
        oi: ["Oi-Regular"],
        opensans: ["OpenSans-Regular"],
        "opensans-bold": ["OpenSans-Bold"],
        "opensans-extrabold": ["OpenSans-ExtraBold"],
        "opensans-semibold": ["OpenSans-SemiBold"],
        "opensans-italic": ["OpenSans-Italic"],
        seymour: ["SeymourOne-Regular"],
        stalinist: ["StalinistOne-Regular"],
        overpass: ["Overpass-Regular"],
        "overpass-bold": ["Overpass-Bold"],
        "overpass-extrabold": ["Overpass-ExtraBold"],
        "overpass-semibold": ["Overpass-SemiBold"],
        "overpass-italic": ["Overpass-Italic"],
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ".text-shadow-default": {
          textShadowColor: "rgba(0,0,0,0.25)",
          textShadowOffset: { width: 0, height: 4 },
          textShadowRadius: 4,
        },
      });
    },
  ],
};
