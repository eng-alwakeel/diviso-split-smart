// Share utility for the /launch page

import { getScenarioById, DEFAULT_SHARE_TEXT, type ScenarioType } from '@/data/demoScenarios';

export interface ShareResult {
  success: boolean;
  method: 'native' | 'clipboard';
  error?: string;
}

function getShareMessage(type: ScenarioType): string {
  const scenario = getScenarioById(type);
  return scenario?.shareText || DEFAULT_SHARE_TEXT;
}

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
  const message = getShareMessage(type);
  return `${message}\n${url}`;
}

export async function shareExperience(type: ScenarioType): Promise<ShareResult> {
  const url = buildShareUrl(type, 'social');
  const text = getShareMessage(type);

  // Check if Web Share API is available
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Diviso – القسمة بدون إحراج',
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

export async function shareLaunchPage(): Promise<ShareResult> {
  const shareUrl = `${window.location.origin}/launch`;
  const shareText = 'قسّم مصاريفك مع أصحابك بدون إحراج – جرب بنفسك';

  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Diviso – القسمة بدون إحراج',
        text: shareText,
        url: shareUrl,
      });
      return { success: true, method: 'native' };
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return { success: false, method: 'native', error: 'cancelled' };
      }
    }
  }

  try {
    await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    return { success: true, method: 'clipboard' };
  } catch (error) {
    return { 
      success: false, 
      method: 'clipboard', 
      error: (error as Error).message 
    };
  }
}
