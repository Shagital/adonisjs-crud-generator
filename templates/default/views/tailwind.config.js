const defaultTheme = require('tailwindcss/defaultTheme');

whitelist = ["gray", "red", "orange", "yellow", "green", "teal", "blue", "purple", "pink"].reduce(
  (result, color) => result.push(`text-${color}-600`, `bg-${color}-600`, `bg-${color}-500`) && result, [])

module.exports = {
  future: {
    removeDeprecatedGapUtilities: true,
    purgeLayersByDefault: true
  },
  purge: {
    enabled: process.env.NODE_ENV === 'production',
    content: ['./index.html', './src/**/*.{vue, js}'],
    options: {
      whitelist,
    }
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter var', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [require('@tailwindcss/custom-forms')],
};
