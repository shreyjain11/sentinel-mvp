/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Enhanced premium colors
        premium: {
          blue: "#3f85f7",
          'blue-hover': "#56aaff",
          'blue-bright': "#4ea2ff",
          purple: "#a855f7",
          'purple-glow': "#ab62ff",
          amber: "#f59e0b",
          green: "#10b981",
          red: "#ef4444",
          emerald: "#10b981",
          yellow: "#f59e0b",
        },
        // Trust and transparency colors
        trust: {
          safe: "#10b981",
          medium: "#f59e0b", 
          high: "#ef4444",
          manual: "#3b82f6",
          noContract: "#10b981",
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        '400': '400',
        '500': '500', 
        '600': '600',
        '700': '700',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'glow-subtle': 'glow-subtle 3s ease-in-out infinite',
        'neon-pulse': 'neon-pulse 2s ease-in-out infinite',
        'ai-glow': 'ai-glow 2s ease-in-out infinite',
        'orbit': 'orbit 3s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-subtle': 'bounceSubtle 0.6s ease-out',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(63, 133, 247, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(63, 133, 247, 0.6)' },
        },
        'glow-subtle': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(63, 133, 247, 0.2)' },
          '50%': { boxShadow: '0 0 15px rgba(63, 133, 247, 0.4)' },
        },
        'neon-pulse': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(63, 133, 247, 0.3)' },
          '50%': { boxShadow: '0 0 25px rgba(63, 133, 247, 0.6)' },
        },
        'ai-glow': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(168, 85, 247, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(168, 85, 247, 0.6)' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg) translateX(4px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(4px) rotate(-360deg)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-2px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'neon-blue': '0 0 20px rgba(63, 133, 247, 0.5)',
        'neon-purple': '0 0 20px rgba(168, 85, 247, 0.5)',
        'glow-blue': '0 8px 32px rgba(63, 133, 247, 0.15)',
        'glow-purple': '0 8px 32px rgba(168, 85, 247, 0.15)',
      },
      transitionDuration: {
        '300': '300ms',
        '400': '400ms',
      },
      transitionTimingFunction: {
        'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
        'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
} 