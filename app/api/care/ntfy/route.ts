import { NextResponse } from 'next/server';

export const DEFAULT_NTFY_TOPIC = 'iris-care-alert';

const PRIORITY_MAP: Record<string, number> = {
  min: 1,
  low: 2,
  default: 3,
  high: 4,
  urgent: 5,
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      topic = DEFAULT_NTFY_TOPIC,
      title = 'IRIS Alert',
      message = 'Notification from IRIS Caregiver System',
      priority = 'default',
      tags = ['bell'],
      clickUrl,
      actions,
    } = body;

    const cleanTopic = (topic && typeof topic === 'string' && topic.trim())
      ? topic.trim()
      : DEFAULT_NTFY_TOPIC;

    const numPriority = typeof priority === 'number'
      ? priority
      : (PRIORITY_MAP[priority] || 3);

    const payload: Record<string, any> = {
      topic: cleanTopic,
      title: title,
      message: message,
      priority: numPriority,
      tags: Array.isArray(tags) ? tags : ['bell'],
    };

    if (clickUrl) {
      payload.click = clickUrl;
    }

    if (Array.isArray(actions) && actions.length > 0) {
      payload.actions = actions;
    }

    // Server-side fetch to ntfy.sh with JSON body (bypasses browser ByteString header restrictions & adblockers)
    const response = await fetch('https://ntfy.sh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json({
        success: true,
        id: data.id,
        topic: cleanTopic,
        time: data.time,
      });
    } else {
      const errText = await response.text().catch(() => 'Unknown error');
      console.error(`ntfy.sh returned HTTP ${response.status}:`, errText);
      return NextResponse.json(
        { success: false, status: response.status, error: errText },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error('Error in /api/care/ntfy route:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to dispatch notification' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const topic = searchParams.get('topic') || DEFAULT_NTFY_TOPIC;
  return NextResponse.json({
    status: 'online',
    topic,
    subscribeUrl: `https://ntfy.sh/${topic}`,
  });
}
