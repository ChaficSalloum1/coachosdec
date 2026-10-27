/** @type {import('tailwindcss').Config} */
const plugin = require("tailwindcss/plugin");
// One source for brand colours, shared with src/utils/designTokens.ts
const palette = require("./src/theme/palette.json");

module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./App.tsx", "./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  corePlugins: {
    space: false,
  },
  theme: {
    // NOTE to AI: You can extend the theme with custom colors or styles here.
    extend: {
      colors: {
        primary: palette.brand.default,
        success: palette.green.strong,
        warning: palette.amber.warning,
        danger: palette.red["800"],
        // Jobsian Apple-inspired colors
        'accent-blue': palette.ios.blue,
        'graphite': palette.ios.graphite,
        'secondary-grey': palette.ios.grey,
        'true-white': palette.white,
        ink: {
          900: palette.text.strong,
          600: palette.text.muted
        }
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px'
      },
      borderRadius: {
        'default': '8px',
        'card': '12px',
        'sheet': '20px'
      },
      fontWeight: {
        'semibold': '600',
        'medium': '500'
      },
      fontSize: {
        xs: "10px",
        sm: "12px",
        base: "14px",
        lg: "18px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "32px",
        "4xl": "40px",
        "5xl": "48px",
        "6xl": "56px",
        "7xl": "64px",
        "8xl": "72px",
        "9xl": "80px",
        'title': ['22px', '28px'],
        'section': ['18px', '24px'],
        'body': ['16px', '22px'],
        'small': ['14px', '18px']
      },
    },
  },
  darkMode: "class",
  plugins: [
    plugin(({ matchUtilities, theme }) => {
      const spacing = theme("spacing");

      // space-{n}  ->  gap: {n}
      matchUtilities(
        { space: (value) => ({ gap: value }) },
        { values: spacing, type: ["length", "number", "percentage"] }
      );

      // space-x-{n}  ->  column-gap: {n}
      matchUtilities(
        { "space-x": (value) => ({ columnGap: value }) },
        { values: spacing, type: ["length", "number", "percentage"] }
      );

      // space-y-{n}  ->  row-gap: {n}
      matchUtilities(
        { "space-y": (value) => ({ rowGap: value }) },
        { values: spacing, type: ["length", "number", "percentage"] }
      );
    }),
  ],
};
