// Browser client for the Gemini proxy at /api/gemini (api/gemini.ts).
// The API key lives only on the server; components call generateContent() here
// instead of using @google/genai in the browser.

// Schema type names, same values as the `Type` enum in @google/genai
// (kept here so the SDK is not bundled into the client).
export const Type = {
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  INTEGER: 'INTEGER',
  BOOLEAN: 'BOOLEAN',
  ARRAY: 'ARRAY',
  OBJECT: 'OBJECT',
} as const;

export interface GenerateContentRequest {
  model: 'gemini-3-flash-preview' | 'gemini-2.5-flash' | 'gemini-2.5-flash-image';
  contents: string | { text: string }[];
  config?: {
    systemInstruction?: string;
    responseMimeType?: 'application/json' | 'text/plain';
    responseSchema?: Record<string, unknown>;
    thinkingConfig?: { thinkingBudget: number };
    tools?: { googleMaps: Record<string, never> }[];
    imageConfig?: { aspectRatio: string };
  };
}

export interface GenerateContentResponse {
  /** Concatenated text of the first candidate, like the SDK's `response.text`. */
  text?: string;
  candidates?: {
    content?: { parts?: { text?: string; thought?: boolean; inlineData?: { data?: string; mimeType?: string } }[] };
    groundingMetadata?: { groundingChunks?: { maps?: { uri?: string; title?: string } }[] };
    finishReason?: string;
  }[];
}

export async function generateContent(request: GenerateContentRequest): Promise<GenerateContentResponse> {
  const res = await fetch('/api/gemini', {
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
