// ========================================
// 🎯 MASTER AD CONTROL SWITCH
// ========================================
// تفعيل الإعلانات عبر Google AdSense
export const ENABLE_AMAZON_ADS = false; // ❌ Amazon معطّل
export const ENABLE_ADS = true; // ✅ الإعلانات مفعّلة

// ========================================
// 📢 Google AdSense Configuration
// ========================================
export const ADSENSE_CONFIG = {
  publisherId: 'ca-pub-4156962854639409',
  slots: {
    // أضف slot IDs من لوحة Google AdSense
    banner: '',     // للبانر العلوي/السفلي
    sidebar: '2712217105',    // للشريط الجانبي (250x700)
    inFeed: '',     // للإعلانات داخل المحتوى
  }
} as const;

// Google AdSense compliant ad sizes and configuration

export const AD_SIZES = {
  desktop: {
    leaderboard: { width: 970, height: 90 },
    mediumRectangle: { width: 300, height: 250 },
    largeRectangle: { width: 336, height: 280 },
    halfPage: { width: 300, height: 600 }
  },
  tablet: {
    leaderboard: { width: 728, height: 90 },
    mediumRectangle: { width: 300, height: 250 }
  },
  mobile: {
    largeBanner: { width: 320, height: 100 },
    banner: { width: 320, height: 50 },
    mediumRectangle: { width: 300, height: 250 }
  }
} as const;

export const AD_DENSITY_RULES = {
  maxAdsPerPage: {
    mobile: 1,
    tablet: 1,
    desktop: 4 // 3 في sidebar + 1 banner
  },
  sidebarAds: {
    desktop: 3, // عرض 3 إعلانات 300x250 في الشريط الجانبي
    tablet: 0,
    mobile: 0
  },
  minContentBetweenAds: 600, // px
  minViewportBeforeFirstAd: 0.3 // 30% of viewport
} as const;

export const AD_DISPLAY_RULES = {
  desktop: {
    showTopBanner: false,
    showSidebar: true,
    showBottomBanner: false
  },
  tablet: {
    showTopBanner: false,
    showSidebar: false,
    showBottomBanner: true
  },
  mobile: {
    showTopBanner: false,
    showSidebar: false,
    showBottomBanner: true
  }
} as const;
