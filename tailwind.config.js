/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  safelist: [
    {
      pattern: /hljs+/, // for code highlighting
    },
  ],
  theme: {
    extend: {},
    hljs: {
      theme: 'github-dark', // for code highlighting
    },
  },
  plugins: [
    require('tailwind-highlightjs'), // for code highlighting
  ],
};
