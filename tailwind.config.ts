import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
			extend: {
				fontFamily: {
					sans: ["Readex Pro", "ui-sans-serif", "system-ui", "sans-serif"],
				},
				colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				info: {
					DEFAULT: 'hsl(var(--info))',
					foreground: 'hsl(var(--info-foreground))'
				},
				'notification-badge': {
					DEFAULT: 'hsl(var(--notification-badge))',
					foreground: 'hsl(var(--notification-badge-foreground))'
				},
				'status-positive': {
					DEFAULT: 'hsl(var(--status-positive))',
					foreground: 'hsl(var(--status-positive-foreground))',
					bg: 'hsl(var(--status-positive-bg))'
				},
				'status-negative': {
					DEFAULT: 'hsl(var(--status-negative))',
					foreground: 'hsl(var(--status-negative-foreground))',
					bg: 'hsl(var(--status-negative-bg))'
				},
				'status-neutral': {
					DEFAULT: 'hsl(var(--status-neutral))',
					foreground: 'hsl(var(--status-neutral-foreground))',
					bg: 'hsl(var(--status-neutral-bg))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				'notification-critical': {
					DEFAULT: 'hsl(var(--notification-critical))',
					bg: 'hsl(var(--notification-critical-bg))'
				},
				'notification-warning': {
					DEFAULT: 'hsl(var(--notification-warning))',
					bg: 'hsl(var(--notification-warning-bg))'
				},
				'notification-info': {
					DEFAULT: 'hsl(var(--notification-info))',
					bg: 'hsl(var(--notification-info-bg))'
				},
				'notification-success': {
					DEFAULT: 'hsl(var(--notification-success))',
					bg: 'hsl(var(--notification-success-bg))'
				},
				'usage-groups': 'hsl(var(--usage-groups))',
				'usage-members': 'hsl(var(--usage-members))',
				'usage-expenses': 'hsl(var(--usage-expenses))',
				'usage-invites': 'hsl(var(--usage-invites))',
				'usage-ocr': 'hsl(var(--usage-ocr))',
				'usage-export': 'hsl(var(--usage-export))',
				'usage-retention': 'hsl(var(--usage-retention))',
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				// New card design system colors
				'expense-light': {
					DEFAULT: 'hsl(var(--expense-light))',
					foreground: 'hsl(var(--expense-light-foreground))'
				},
				'group-card': {
					DEFAULT: 'hsl(var(--group-card))',
					foreground: 'hsl(var(--group-card-foreground))'
				},
				'total-card': {
					DEFAULT: 'hsl(var(--total-card))',
					foreground: 'hsl(var(--total-card-foreground))'
				},
				'referral-card': {
					DEFAULT: 'hsl(var(--referral-card))',
					foreground: 'hsl(var(--referral-card-foreground))'
				},
				'dark-background': {
					DEFAULT: 'hsl(var(--dark-background))',
					foreground: 'hsl(var(--dark-background-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-card': 'var(--gradient-card)',
				'gradient-accent': 'var(--gradient-accent)',
				'gradient-dark': 'var(--gradient-dark)',
				'gradient-hero': 'var(--gradient-hero)'
			},
			boxShadow: {
				'primary': 'var(--shadow-primary)',
				'card': 'var(--shadow-card)',
				'elevated': 'var(--shadow-elevated)',
				'accent': 'var(--shadow-accent)'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
