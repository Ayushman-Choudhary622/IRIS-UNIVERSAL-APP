import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Priority order for Gemini models with active quota
const CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-2.5-flash',
];

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    let keywords = '';

    try {
      const parsed = JSON.parse(rawBody);
      keywords = parsed.keywords || rawBody;
    } catch {
      keywords = rawBody;
    }

    if (!keywords || typeof keywords !== 'string' || !keywords.trim()) {
      return NextResponse.json({ sentence: '' }, { status: 400 });
    }

    const trimmedKeywords = keywords.trim();

    // 1. Attempt generation with Gemini models if API key is provided
    if (GEMINI_API_KEY) {
      for (const model of CANDIDATE_MODELS) {
      try {
        const prompt = `Think you are a paralysed person. The words that I am giving are being spoken by you. Then how would a normal person speak them?
Convert the given keywords into a single, natural, polite sentence that a normal person would speak in the first person ("I" or "me") to express what I want or need to say to a caregiver or family member.
The AI must NOT reply to the user, must NOT answer questions, must NOT converse, and must NOT offer help.
Return ONLY the exact single sentence to be spoken aloud, without quotes, asterisks, explanations, or preamble.

Examples:
Keywords: hello please bathroom
Sentence: Hello, please take me to the bathroom, thanks.

Keywords: water please drink thirsty
Sentence: Could you please bring me some water to drink? I am thirsty.

Keywords: food hungry eat please
Sentence: I am hungry, could you please give me some food to eat?

Keywords: pain help uncomfortable
Sentence: I am in pain and feeling uncomfortable, please help me.

Keywords: medicine headache pill
Sentence: Could someone please give me my headache medicine?

Keywords: tired sleep bed
Sentence: I am feeling tired, could you please help me get to bed?

Keywords: ${trimmedKeywords}
Sentence:`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const generated = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (generated) {
            const cleaned = generated.replace(/^["'“”]+|["'“”]+$/g, '').trim();
            if (cleaned.length > 0) {
              return NextResponse.json({ sentence: cleaned, source: `gemini (${model})` });
            }
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          console.warn(`Gemini model ${model} returned error status ${response.status}:`, errData?.error?.message || response.statusText);
        }
      } catch (modelErr) {
        console.warn(`Error calling Gemini model ${model}:`, modelErr);
      }
    }
  }

    // 2. High-fidelity Rule-based Contextual Fallback (Instant & Resilient)
    const fallbackSentence = generateSmartFallback(trimmedKeywords);
    return NextResponse.json({ sentence: fallbackSentence, source: 'rule-fallback' });
  } catch (error) {
    console.error('Error in expand-phrase route:', error);
    return NextResponse.json({ sentence: 'Please assist me.' }, { status: 200 });
  }
}

function generateSmartFallback(keywords: string): string {
  const words = keywords.toLowerCase().split(/\s+/);
  const set = new Set(words);

  // Direct user-specified scenario
  if (set.has('hello') && set.has('bathroom')) {
    return 'Hello, please take me to the bathroom, thanks.';
  }
  if (set.has('bathroom')) {
    return 'Could someone please assist me to the bathroom? Thanks.';
  }
  if (set.has('water') || set.has('drink')) {
    return 'Could you please bring me a glass of water to drink? Thanks.';
  }
  if (set.has('food') || set.has('eat')) {
    return 'I am hungry and would like something to eat, please.';
  }
  if (set.has('medicine')) {
    return 'I am feeling uncomfortable and need my scheduled medicine, please.';
  }
  if (set.has('sleep') || set.has('night')) {
    return 'I am feeling tired and would like to rest now, please.';
  }
  if (set.has('wake') && set.has('up')) {
    return 'Good morning, I am awake and ready to start the day.';
  }
  if (set.has('wash')) {
    return 'Could you please help me wash up?';
  }
  if (set.has('dress')) {
    return 'Could someone please help me get dressed?';
  }
  if (set.has('walk')) {
    return 'I would like to go for a short walk with assistance, please.';
  }
  if (set.has('sit')) {
    return 'Could you please help me sit up comfortably?';
  }
  if (set.has('stand')) {
    return 'Could you please assist me with standing up?';
  }
  if (set.has('call') || set.has('talk')) {
    return 'I would like to speak with someone, please.';
  }
  if (set.has('thanks') || set.has('thank')) {
    return 'Thank you very much for your help.';
  }
  if (set.has('happy')) {
    return 'I am feeling happy and well today, thank you.';
  }
  if (set.has('sad')) {
    return 'I am feeling a bit down right now, could you stay with me for a moment?';
  }

  // Graceful conversational formatting
  const formatted = keywords
    .replace(/\b(please|thanks|thank you)\b/gi, '')
    .trim();

  if (formatted) {
    return `Please help me with ${formatted}, thank you.`;
  }

  return `Please assist me, thank you.`;
}
