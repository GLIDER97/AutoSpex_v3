// Browser client for the AI proxy at /api/ai (api/ai.ts, OpenRouter).
// The API key lives only on the server; pages call generateContent() here.

// Schema type names. The server turns these schemas into strict JSON Schema.
export const Type = {
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  INTEGER: 'INTEGER',
  BOOLEAN: 'BOOLEAN',
  ARRAY: 'ARRAY',
  OBJECT: 'OBJECT',
} as const;

export type ContentPart = { text: string } | { inlineData: { mimeType: string; data: string } };
export type ChatTurn = { role: 'user' | 'model'; parts: ContentPart[] };

export interface GenerateContentRequest {
  /** "text" for answers (and reading photos), "image" to generate a picture. */
  model: 'text' | 'image';
  /** A prompt, a list of parts (text and at most one photo), or a chat history. */
  contents: string | ContentPart[] | ChatTurn[];
  config?: {
    systemInstruction?: string;
    responseMimeType?: 'application/json' | 'text/plain';
    responseSchema?: Record<string, unknown>;
    imageConfig?: { aspectRatio: string };
  };
}

export interface GenerateContentResponse {
  /** Concatenated text of the first candidate, like the SDK's `response.text`. */
  text?: string;
  candidates?: {
    content?: { parts?: { text?: string; thought?: boolean; inlineData?: { data?: string; mimeType?: string } }[] };
    finishReason?: string;
  }[];
}

export async function generateContent(request: GenerateContentRequest): Promise<GenerateContentResponse> {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  let payload: (GenerateContentResponse & { error?: string }) | null = null;
  try {
    payload = await res.json();
  } catch {
    // Non-JSON response (for example a platform error page).
  }

  if (!res.ok || !payload) {
    throw new Error(payload?.error || `The AI service is unavailable (HTTP ${res.status}). Please try again.`);
  }
  return payload;
}

/** The first image in a response as a data: URL, or null. */
export function imageDataUrl(response: GenerateContentResponse): string | null {
  for (const part of response.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData?.data) return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
  }
  return null;
}
