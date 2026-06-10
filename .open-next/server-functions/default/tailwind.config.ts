import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
    darkMode: "class",
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
        extend: {
                colors: {
                        background: 'var(--nm-bg)',
                        foreground: 'var(--nm-text)',
                        card: {
                                DEFAULT: 'var(--nm-bg)',
                                foreground: 'var(--nm-text)'
                        },
                        popover: {
                                DEFAULT: 'var(--nm-bg)',
                                foreground: 'var(--nm-text)'
                        },
                        primary: {
                                DEFAULT: 'var(--nm-accent)',
                                foreground: 'var(--primary-foreground)'
                        },
                        secondary: {
                                DEFAULT: 'var(--nm-bg)',
                                foreground: 'var(--nm-text)'
                        },
                        muted: {
                                DEFAULT: 'var(--nm-bg)',
                                foreground: 'var(--nm-text-muted)'
                        },
                        accent: {
                                DEFAULT: 'var(--nm-accent-soft)',
                                foreground: 'var(--nm-text)'
                        },
                        destructive: {
                                DEFAULT: 'var(--destructive)',
                                foreground: '#ffffff'
                        },
                        border: 'transparent',
                        input: 'transparent',
                        ring: 'var(--nm-accent)',
                        chart: {
                                '1': 'hsl(var(--chart-1))',
                                '2': 'hsl(var(--chart-2))',
                                '3': 'hsl(var(--chart-3))',
                                '4': 'hsl(var(--chart-4))',
                                '5': 'hsl(var(--chart-5))'
                        }
                },
                borderRadius: {
                        lg: 'var(--radius)',
                        md: 'calc(var(--radius) - 2px)',
                        sm: 'calc(var(--radius) - 4px)'
                },
                boxShadow: {
                        /* Neumorphism shadow system */
                        'nm': '6px 6px 12px var(--nm-shadow-dark), -6px -6px 12px var(--nm-shadow-light)',
                        'nm-sm': '3px 3px 6px var(--nm-shadow-dark), -3px -3px 6px var(--nm-shadow-light)',
                        'nm-lg': '10px 10px 20px var(--nm-shadow-dark), -10px -10px 20px var(--nm-shadow-light)',
                        'nm-inset': 'inset 4px 4px 8px var(--nm-shadow-dark), inset -4px -4px 8px var(--nm-shadow-light)',
                        'nm-inset-deep': 'inset 6px 6px 12px var(--nm-shadow-dark), inset -6px -6px 12px var(--nm-shadow-light)',
                        'nm-accent': '6px 6px 12px var(--nm-shadow-dark), -6px -6px 12px var(--nm-shadow-light), 0 0 20px var(--nm-accent-glow)',
                }
        }
  },
  plugins: [tailwindcssAnimate],
};
export default config;
