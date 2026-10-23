'use client';

export interface NtfyAction {
  action: 'view' | 'broadcast' | 'http';
  label: string;
  url?: string;
  clear?: boolean;
}

export interface NtfyNotificationOptions {
  title: string;
  message: string;
  priority?: 'urgent' | 'high' | 'default' | 'low';
  tags?: string[];
  topic?: string;
  clickUrl?: string;
  actions?: NtfyAction[];
}

export const DEFAULT_NTFY_TOPIC = 'iris-care-alert';

const PRIORITY_MAP: Record<string, number> = {
  min: 1,
  low: 2,
  default: 3,
  high: 4,
  urgent: 5,
};

/**
 * Send an immediate push notification to the caretaker's mobile phone via ntfy.sh
 * Uses two-tier delivery:
 * 1. Primary: internal Next.js API route (/api/care/ntfy) to eliminate CORS, ByteString header issues & adblockers.
 * 2. Fallback: direct JSON POST to https://ntfy.sh with full UTF-8 emoji support.
 */
export async function sendNtfyNotification({
  title,
  message,
  priority = 'default',
  tags = ['bell'],
  topic = DEFAULT_NTFY_TOPIC,
  clickUrl,
  actions,
}: NtfyNotificationOptions): Promise<boolean> {
  const cleanTopic = (topic && topic.trim()) ? topic.trim() : DEFAULT_NTFY_TOPIC;
  
  // Construct default click URL to open IRIS Care if running in browser
  let targetClickUrl = clickUrl;
  if (!targetClickUrl && typeof window !== 'undefined') {
    targetClickUrl = `${window.location.origin}/caretaker`;
  }

  const numPriority = typeof priority === 'number' ? priority : (PRIORITY_MAP[priority] || 3);

  const payload: Record<string, any> = {
    topic: cleanTopic,
    title,
    message,
    priority: numPriority,
    tags: Array.isArray(tags) ? tags : ['bell'],
  };

  if (targetClickUrl) {
    payload.click = targetClickUrl;
  }

  if (Array.isArray(actions) && actions.length > 0) {
    payload.actions = actions;
  }

  let delivered = false;

  // 1. Primary: Server-side Next.js proxy route (Same-Origin, Zero CORS, Zero Adblocker filter)
  try {
    const res = await fetch('/api/care/ntfy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      console.log(`[IRIS ntfy] ✓ Push notification dispatched via server API: topic="${cleanTopic}", id="${data.id || 'ok'}"`);
      delivered = true;
    } else {
      console.warn(`[IRIS ntfy] Server proxy returned HTTP ${res.status}, attempting direct fallback...`);
    }
  } catch (err) {
    console.warn('[IRIS ntfy] Server proxy unavailable, attempting direct fallback...', err);
  }

  // 2. Fallback: Direct JSON POST to https://ntfy.sh (JSON body bypasses ByteString header errors)
  if (!delivered) {
    try {
      const directRes = await fetch('https://ntfy.sh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (directRes.ok) {
        console.log(`[IRIS ntfy] ✓ Push notification dispatched via direct fallback: topic="${cleanTopic}"`);
        delivered = true;
      } else {
        const errText = await directRes.text().catch(() => '');
        console.error(`[IRIS ntfy] Direct dispatch failed with HTTP ${directRes.status}:`, errText);
      }
    } catch (directErr) {
      console.error('[IRIS ntfy] Failed to dispatch push notification to ntfy.sh:', directErr);
    }
  }

  // 3. Native local browser notification if permitted
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico',
      });
    } catch (notifErr) {
      console.warn('[IRIS ntfy] Browser Notification dispatch error:', notifErr);
    }
  }

  return delivered;
}

/**
 * URL for caretaker to open in mobile browser or app to subscribe
 */
export function getNtfySubscribeUrl(topic = DEFAULT_NTFY_TOPIC): string {
  const cleanTopic = (topic && topic.trim()) ? topic.trim() : DEFAULT_NTFY_TOPIC;
  return `https://ntfy.sh/${cleanTopic}`;
}

/**
 * Check if browser supports HTML5 notifications
 */
export function isBrowserNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Request permission for native browser notifications
 */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    return await Notification.requestPermission();
  }
  return 'denied';
}
