// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],

  safelist: [
    // colors
    "bg-primary-100",
    "bg-primary-200",
    "bg-primary-300",
    "bg-primary-400",
    "bg-primary-500",
    "bg-primary-600",
    "bg-primary-700",
    "bg-primary-800",
    "bg-primary-900",

    // widths
    "w-full",
    "w-1/2",
    "w-1/3",
    "w-2/3",
    "w-1/4",
    "w-3/4",

    // heights
    "h-full",
    "h-1/2",
  ],

  theme: {
    extend: {
      /* ----------------------------- COLORS ----------------------------- */
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

      /* ----------------------------- WIDTH ------------------------------ */
      width: {
        "1/2": "50%",
        "1/3": "33.333333%",
        "2/3": "66.666667%",
        "1/4": "25%",
        "3/4": "75%",
        full: "100%",
      },

      /* ----------------------------- HEIGHT ----------------------------- */
      height: {
        "1/2": "50%",
        full: "100%",
      },

      /* ----------------------------- SHADOW ----------------------------- */
      boxShadow: {
        custom: "0 4px 4px rgba(0,0,0,0.25)",
        custom50: "0 4px 4px rgba(0,0,0,0.5)",
      },

      /* ----------------------------- FONTS ------------------------------ */
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
        "opensans-light": ["OpenSans-Light"],
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
        "tektur-semibold": ["Tektur-SemiBold"],
        "tektur-extrabold": ["Tektur-ExtraBold"],
        "tektur-black": ["Tektur-Black"],
        "yanone-semibold": ["YanoneKaffeesatz-SemiBold"],
        "sofia-bold": ["SofiaSansExtraCondensed-Bold"],
        "sofia-extrabold": ["SofiaSansExtraCondensed-ExtraBold"],
        "sofia-black": ["SofiaSansExtraCondensed-Black"],
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
