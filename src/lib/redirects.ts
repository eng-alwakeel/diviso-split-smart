/**
 * Centralized redirect configuration
 * Add old routes and their new destinations here
 */
export const REDIRECTS: Record<string, string> = {
  '/referral-center': '/referral',
  '/admin': '/admin-dashboard',
  '/store': '/credit-store',
  '/join': '/auth',
  '/signup': '/auth',
  '/login': '/auth',
  '/register': '/auth',
};
