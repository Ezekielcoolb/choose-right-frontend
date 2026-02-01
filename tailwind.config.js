/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        shell: "0 18px 40px -24px rgba(15, 23, 42, 0.35)",
        nav: "0 10px 30px -20px rgba(15, 23, 42, 0.4)",
        footer: "0 -10px 30px -20px rgba(15, 23, 42, 0.45)",
      },
      borderRadius: {
        shell: "1rem",
      },
      colors: {
        primary: "#2563eb",
      },
    },
  },
  plugins: [],
};
