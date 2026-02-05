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
				},
			'dice-roll': {
				'0%': { transform: 'rotateX(0) rotateY(0) rotateZ(0) scale(1)' },
				'25%': { transform: 'rotateX(180deg) rotateY(90deg) rotateZ(45deg) scale(1.1)' },
				'50%': { transform: 'rotateX(360deg) rotateY(180deg) rotateZ(90deg) scale(1)' },
				'75%': { transform: 'rotateX(540deg) rotateY(270deg) rotateZ(135deg) scale(1.1)' },
				'100%': { transform: 'rotateX(720deg) rotateY(360deg) rotateZ(180deg) scale(1)' }
			},
			'dice-land': {
				'0%': { transform: 'scale(1.2)', opacity: '0.8' },
				'50%': { transform: 'scale(0.95)' },
				'100%': { transform: 'scale(1)', opacity: '1' }
			},
			'dice-shake': {
				'0%, 100%': { transform: 'rotate(0deg) scale(1)' },
				'10%, 30%, 50%, 70%, 90%': { transform: 'rotate(-8deg) scale(1.05)' },
				'20%, 40%, 60%, 80%': { transform: 'rotate(8deg) scale(1.05)' }
			},
			'dice-flip-reveal': {
				'0%': { transform: 'rotateY(0deg) scale(1)', opacity: '1' },
				'50%': { transform: 'rotateY(90deg) scale(0.9)', opacity: '0.5' },
				'100%': { transform: 'rotateY(0deg) scale(1)', opacity: '1' }
			},
			'result-expand': {
				'0%': { transform: 'scale(0.8) translateY(-10px)', opacity: '0' },
				'100%': { transform: 'scale(1) translateY(0)', opacity: '1' }
			},
			'shimmer': {
				'0%': { transform: 'translateX(-100%)' },
				'100%': { transform: 'translateX(100%)' }
			},
			'scale-in': {
				'0%': { transform: 'scale(0.8)', opacity: '0' },
				'100%': { transform: 'scale(1)', opacity: '1' }
			}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'dice-roll': 'dice-roll 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
				'dice-land': 'dice-land 0.3s ease-out',
				'dice-shake': 'dice-shake 0.6s ease-in-out infinite',
				'dice-flip-reveal': 'dice-flip-reveal 0.5s ease-out forwards',
				'result-expand': 'result-expand 0.4s ease-out 0.3s forwards',
				'shimmer': 'shimmer 1s ease-in-out infinite',
				'scale-in': 'scale-in 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
