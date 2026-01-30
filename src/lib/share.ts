// Share utility for the /launch page

import type { ScenarioType } from '@/data/demoScenarios';

export interface ShareResult {
  success: boolean;
  method: 'native' | 'clipboard';
  error?: string;
}

const SHARE_MESSAGE = `الشعبنة حلوة… لين تجي القسمة 😅
جرب المثال وشوف كم يطلع عليك:`;

export function buildShareUrl(
  type: ScenarioType,
  channel: 'whatsapp' | 'social' = 'social'
): string {
  const baseUrl = window.location.origin;
  const params = new URLSearchParams({
    demo: type,
    utm_source: 'share',
    utm_medium: channel,
    utm_campaign: 'sha3bana',
  });
  return `${baseUrl}/launch?${params.toString()}`;
}

export function getShareText(type: ScenarioType, channel: 'whatsapp' | 'social' = 'social'): string {
  const url = buildShareUrl(type, channel);
  return `${SHARE_MESSAGE}\n${url}`;
}

export async function shareExperience(type: ScenarioType): Promise<ShareResult> {
  const url = buildShareUrl(type, 'social');
  const text = SHARE_MESSAGE;

  // Check if Web Share API is available
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'القسمة دايمًا تلخبط؟ خلّها واضحة',
        text: text,
        url: url,
      });
      return { success: true, method: 'native' };
    } catch (error) {
      // User cancelled or share failed - fall back to clipboard
      if ((error as Error).name === 'AbortError') {
        return { success: false, method: 'native', error: 'cancelled' };
      }
    }
  }

  // Fallback: Copy to clipboard
  try {
    const fullText = getShareText(type, 'whatsapp');
    await navigator.clipboard.writeText(fullText);
    return { success: true, method: 'clipboard' };
  } catch (error) {
    return { 
      success: false, 
      method: 'clipboard', 
      error: (error as Error).message 
    };
  }
}
