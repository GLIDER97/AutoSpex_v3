// Browser client for the AI proxy at /api/ai (api/ai.ts, OpenRouter).
// Pages name a tool and fill in its fields; the server builds the prompt
// (api/_aiTools.ts), so no instructions are ever sent from the browser.
// The API key lives only on the server.
import type { ToolId } from '../api/_aiTools';

export type { ToolId };

export interface AiResponse {
  /** Concatenated text of the first candidate. */
  text?: string;
  candidates?: {
    content?: { parts?: { text?: string; thought?: boolean; inlineData?: { data?: string; mimeType?: string } }[] };
    finishReason?: string;
  }[];
}

export async function runTool(tool: ToolId, fields: Record<string, unknown> = {}): Promise<AiResponse> {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool, fields }),
  });

  let payload: (AiResponse & { error?: string }) | null = null;
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
export function imageDataUrl(response: AiResponse): string | null {
  for (const part of response.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData?.data) return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
  }
  return null;
}
