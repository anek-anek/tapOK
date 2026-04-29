/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'tok-cream':     '#FFF4BD',
        'tok-cream-dim': '#F5EFB8',
        'tok-black':     '#000000',
        'tok-teal':      '#006666',
        'tok-teal-mid':  '#0a8080',
        'tok-teal-pale': '#c8e8e0',
        'tok-white':     '#FFFFFF',
        'tok-muted':     '#6b6b50',
        'tok-muted-lt':  '#9a9a78',
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          1: "var(--chart-1)",
          2: "var(--chart-2)",
          3: "var(--chart-3)",
          4: "var(--chart-4)",
          5: "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        passion:  ["var(--font-passion)", "sans-serif"],
        inter:    ["var(--font-inter)", "sans-serif"],
      },
      keyframes: {
        livepulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':       { opacity: '0.3', transform: 'scale(0.6)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-4px)' },
          '40%': { transform: 'translateX(4px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
      },
      animation: {
        'livepulse':      'livepulse 2s ease-in-out infinite',
        'livepulse-fast': 'livepulse 1.8s ease-in-out infinite',
        'fade-up': 'fade-up 0.4s ease-out both',
        'fade-up-1': 'fade-up 0.4s 0.05s ease-out both',
        'fade-up-2': 'fade-up 0.4s 0.1s ease-out both',
        'fade-up-3': 'fade-up 0.4s 0.15s ease-out both',
        'fade-up-4': 'fade-up 0.4s 0.2s ease-out both',
        'fade-up-5': 'fade-up 0.4s 0.25s ease-out both',
        'fade-up-6': 'fade-up 0.4s 0.3s ease-out both',
        'fade-up-7': 'fade-up 0.4s 0.35s ease-out both',
        'fade-in': 'fade-in 0.5s ease-out both',
        'slide-in-right': 'slide-in-right 0.5s 0.1s ease-out both',
        'shake': 'shake 0.35s ease-in-out',
      },
    },
  },
  plugins: [],
}


