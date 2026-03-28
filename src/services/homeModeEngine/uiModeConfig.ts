/**
 * UI Mode Configuration — Maps each home mode to UI content state
 * 
 * This is the central mapping layer between the Home Mode Engine output
 * and the dashboard UI. Each mode defines hero text, CTAs, section visibility,
 * and content section types.
 * 
 * ## Why participant_mode ≠ creator_active_mode:
 * - participant_mode: User joined groups but never created one. They see joined groups
 *   prominently and a CTA encouraging them to create their own group.
 * - creator_active_mode: User owns groups. They see full financial dashboard,
 *   owned groups, and management tools. Ownership is the core distinction.
 */

import { HOME_MODES, type HomeMode } from './constants';

export type MainSectionType = 
  | 'onboarding' 
  | 'continue_draft' 
  | 'prepared_group' 
  | 'joined_groups' 
  | 'managed_groups' 
  | 'stale_recovery';

export interface HomeModeUIConfig {
  heroTitle: string;
  heroSubtitle: string;
  primaryCTA: { label: string; route: string; icon: string };
  secondaryCTA?: { label: string; route: string; icon: string };
  showStatsGrid: boolean;
  mainSectionType: MainSectionType;
  showQuickActions: boolean;
  showSubscriptionCards: boolean;
  showAds: boolean;
}

const UI_CONFIGS: Record<HomeMode, HomeModeUIConfig> = {
  [HOME_MODES.FIRST_ENTRY]: {
    heroTitle: 'home_modes.first_entry_title',
    heroSubtitle: 'home_modes.first_entry_subtitle',
    primaryCTA: { label: 'home_modes.create_group_cta', route: '/create-group', icon: 'Users' },
    secondaryCTA: { label: 'home_modes.explore_cta', route: '/plans', icon: 'Map' },
    showStatsGrid: false,
    mainSectionType: 'onboarding',
    showQuickActions: false,
    showSubscriptionCards: false,
    showAds: false,
  },
  [HOME_MODES.IN_PROGRESS]: {
    heroTitle: 'home_modes.in_progress_title',
    heroSubtitle: 'home_modes.in_progress_subtitle',
    primaryCTA: { label: 'home_modes.continue_cta', route: '/my-groups', icon: 'ArrowRight' },
    secondaryCTA: { label: 'home_modes.view_drafts_cta', route: '/my-groups', icon: 'FileText' },
    showStatsGrid: true,
    mainSectionType: 'continue_draft',
    showQuickActions: true,
    showSubscriptionCards: false,
    showAds: false,
  },
  [HOME_MODES.SHARE_READY]: {
    heroTitle: 'home_modes.share_ready_title',
    heroSubtitle: 'home_modes.share_ready_subtitle',
    primaryCTA: { label: 'home_modes.add_members_cta', route: '/my-groups', icon: 'UserPlus' },
    secondaryCTA: { label: 'home_modes.review_group_cta', route: '/my-groups', icon: 'Eye' },
    showStatsGrid: true,
    mainSectionType: 'prepared_group',
    showQuickActions: true,
    showSubscriptionCards: false,
    showAds: false,
  },
  [HOME_MODES.PARTICIPANT]: {
    heroTitle: 'home_modes.participant_title',
    heroSubtitle: 'home_modes.participant_subtitle',
    primaryCTA: { label: 'home_modes.create_own_group_cta', route: '/create-group', icon: 'Plus' },
    secondaryCTA: { label: 'home_modes.view_joined_groups', route: '/my-groups', icon: 'Users' },
    showStatsGrid: true,
    mainSectionType: 'joined_groups',
    showQuickActions: true,
    showSubscriptionCards: false,
    showAds: false,
  },
  [HOME_MODES.CREATOR_ACTIVE]: {
    heroTitle: 'home_modes.creator_active_title',
    heroSubtitle: 'home_modes.creator_active_subtitle',
    primaryCTA: { label: 'quick_actions.create_group', route: '/create-group', icon: 'Users' },
    secondaryCTA: { label: 'quick_actions.add_expense', route: '/add-expense', icon: 'Plus' },
    showStatsGrid: true,
    mainSectionType: 'managed_groups',
    showQuickActions: true,
    showSubscriptionCards: true,
    showAds: true,
  },
  [HOME_MODES.RE_ENGAGEMENT]: {
    heroTitle: 'home_modes.re_engagement_title',
    heroSubtitle: 'home_modes.re_engagement_subtitle',
    primaryCTA: { label: 'home_modes.resume_cta', route: '/my-groups', icon: 'RotateCcw' },
    secondaryCTA: { label: 'home_modes.view_activity_cta', route: '/my-expenses', icon: 'Activity' },
    showStatsGrid: true,
    mainSectionType: 'stale_recovery',
    showQuickActions: true,
    showSubscriptionCards: false,
    showAds: false,
  },
};

/** Default config used as fallback when engine is loading or errored */
export const DEFAULT_UI_CONFIG = UI_CONFIGS[HOME_MODES.CREATOR_ACTIVE];

export function getHomeModeUIConfig(mode: string): HomeModeUIConfig {
  return UI_CONFIGS[mode as HomeMode] ?? DEFAULT_UI_CONFIG;
}
