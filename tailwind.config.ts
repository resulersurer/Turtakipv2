import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#071016",
        panel: "#0e1a20",
        line: "#1e343d",
        mint: "#44d7b6",
        amber: "#f3b94f",
        coral: "#ef7b69"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(68,215,182,.18), 0 20px 80px rgba(0,0,0,.34)"
      }
    }
  },
  plugins: []
};

export default config;
