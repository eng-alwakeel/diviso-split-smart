// ========================================
// Ad System Policies & Constants
// ========================================

// Master Ad Control - Set to false to disable all ads
export const ENABLE_ADS = true;

// ========================================
// Ad Type Keys (must match database)
// ========================================
export const AD_TYPES = {
  REWARDED: 'rewarded',
  SPONSORED: 'sponsored', 
  NATIVE: 'native',
  BANNER: 'banner',
  INTERSTITIAL: 'interstitial',
  APP_OPEN: 'app_open'
} as const;

// ========================================
// Placement Keys (must match database)
// ========================================
export const AD_PLACEMENTS = {
  // Paywall (critical - only rewarded allowed)
  PAYWALL_REWARDED: 'paywall_rewarded',
  
  // Recommendations page
  RECOMMENDATIONS_FEED: 'recommendations_feed',
  RECOMMENDATIONS_NATIVE: 'recommendations_native',
  
  // Settings & Profile (non-critical)
  SETTINGS_BANNER: 'settings_banner',
  PROFILE_BANNER: 'profile_banner',
  
  // Dashboard
  DASHBOARD_SIDEBAR: 'dashboard_sidebar',
  DASHBOARD_NATIVE: 'dashboard_native',
  
  // Reports (non-critical)
  REPORTS_BANNER: 'reports_banner',
  
  // Groups (sponsored only - no intrusive ads)
  GROUP_SPONSORED: 'group_sponsored'
} as const;

// ========================================
// Default Settings (fallback if DB unavailable)
// ========================================
export const DEFAULT_REWARDED_SETTINGS = {
  reward_uc: 1,
  daily_cap: 5,
  cooldown_seconds: 180,
  validity_type: 'immediate' as const
};

export const DEFAULT_SPONSORED_SETTINGS = {
  max_per_feed: 1,
  cards_between_ads: 8,
  label_text_ar: 'إعلان ذكي',
  label_text_en: 'Smart Ad'
};

export const DEFAULT_NATIVE_SETTINGS = {
  frequency: 10,
  min_cards_before_first: 5,
  label_text_ar: 'إعلان',
  label_text_en: 'Ad'
};

export const DEFAULT_BANNER_SETTINGS = {
  refresh_seconds: 60,
  label_text_ar: 'إعلان',
  label_text_en: 'Ad'
};

// ========================================
// Critical Screens (NO ADS ALLOWED)
// ========================================
export const CRITICAL_SCREENS = [
  '/add-expense',
  '/group/:id/add-expense',
  '/group/:id/settlement',
  '/create-group',
  '/create-budget'
] as const;

// ========================================
// Ad Event Types for Logging
// ========================================
export const AD_EVENT_TYPES = {
  // Lifecycle events
  IMPRESSION: 'impression',
  VIEW: 'view',
  CLICK: 'click',
  DISMISS: 'dismiss',
  
  // Rewarded ad events
  START: 'start',
  COMPLETE: 'complete',
  CLAIM: 'claim',
  
  // Error events
  NO_FILL: 'no_fill',
  ERROR: 'error',
  TIMEOUT: 'timeout',
  
  // Sponsored/Affiliate events
  OUTBOUND_CLICK: 'outbound_click',
  SAVE: 'save',
  SHARE: 'share'
} as const;

// ========================================
// User Type Ad Rules
// ========================================
export const AD_RULES_BY_USER_TYPE = {
  // Free users - must see ads
  free: {
    see_network_ads: true,
    see_sponsored: true,
    see_rewarded: true,
    can_disable: false
  },
  
  // Paid subscribers - no network ads by default
  paid: {
    see_network_ads: false,
    see_sponsored: true, // Can still show relevant recommendations
    see_rewarded: false,
    can_disable: true
  },
  
  // Expired/Cancelled - like free
  expired: {
    see_network_ads: true,
    see_sponsored: true,
    see_rewarded: true,
    can_disable: false
  }
} as const;

// ========================================
// Compliance Labels
// ========================================
export const AD_LABELS = {
  rewarded: {
    ar: 'شاهد واحصل على نقطة',
    en: 'Watch & earn credit'
  },
  sponsored: {
    ar: 'إعلان ذكي',
    en: 'Smart Ad'
  },
  affiliate: {
    ar: 'برعاية',
    en: 'Sponsored'
  },
  native: {
    ar: 'إعلان',
    en: 'Ad'
  },
  banner: {
    ar: 'إعلان',
    en: 'Ad'
  }
} as const;

// ========================================
// Helper Functions
// ========================================
export function isCriticalScreen(path: string): boolean {
  return CRITICAL_SCREENS.some(screen => {
    if (screen.includes(':')) {
      const pattern = screen.replace(/:[^/]+/g, '[^/]+');
      return new RegExp(`^${pattern}$`).test(path);
    }
    return path === screen;
  });
}

export function getAdLabel(type: keyof typeof AD_LABELS, lang: 'ar' | 'en'): string {
  return AD_LABELS[type]?.[lang] || AD_LABELS.native[lang];
}

export function getUserAdRules(userType: 'free' | 'paid' | 'expired') {
  return AD_RULES_BY_USER_TYPE[userType] || AD_RULES_BY_USER_TYPE.free;
}
