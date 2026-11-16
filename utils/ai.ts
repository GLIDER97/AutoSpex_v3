// Browser client for the AI tools at /api/ai (api/ai.ts, OpenRouter).
// Pages send a tool id and that tool's fields; the server writes the prompt.
// The API key lives only on the server.
import type { AspectRatio, CoverageId, FinishId, SizeId } from '../api/_wrap';
import type { LineType, ShopType } from '../api/_quote';

export { cleanLine, cleanMessage, cleanName } from '../api/_validate';

interface VehicleFields {
  year: string;
  make: string;
  model: string;
}

/** The fields each tool takes (validated again by api/_tools.ts). */
export interface ToolInputs {
  'fault-code': { codes: string[]; vehicle?: string };
  'fault-chat': {
    codes: string[];
    vehicle?: string;
    diagnosis?: { codes: { code: string; title: string; drive: string }[]; causes: { cause: string; likelihood: string }[] };
    messages: { role: 'user' | 'model'; text: string }[];
  };
  'quote-read': { photo: string };
  'quote-audit': {
    vehicle?: string;
    zip?: string;
    shopType: ShopType;
    lines: { description: string; type: LineType; quantity: number; amount: number }[];
  };
  insurance: {
    year?: string;
    make?: string;
    model?: string;
    zipCode?: string;
    ageGroup: string;
    drivingHistory: string;
    creditTier: string;
    coverageLevel: string;
    deductible: string;
    monthlyMin: number;
    monthlyMax: number;
  };
  'car-price': { vehicle: VehicleFields; trim?: string; zip?: string };
  depreciation: { vehicle: VehicleFields; trim?: string; mileage: number; condition: string };
  'plate-ideas': { carModel: string; hobbies: string; vibe: string; state: string };
  'service-promos': Record<string, never>;
  'diy-toolkits': Record<string, never>;
  wrap: {
    finish: FinishId;
    color: { name: string; hex?: string };
    coverage: CoverageId;
    size: SizeId;
    vehicle?: VehicleFields;
    /** Base64 JPEG without the data: prefix. */
    photo?: string;
    aspectRatio?: AspectRatio;
  };
}

export type ToolId = keyof ToolInputs;

export interface ToolResult {
  /** The parsed JSON answer, for tools with structured answers. */
  data?: any;
  /** The answer, for tools that answer in text (insurance, chat). */
  text?: string;
  /** The picture, for the wrap tool. */
  image?: { mimeType: string; data: string };
}

/** An error from /api/ai. `code` is 'daily_limit' when today's allowance is used up. */
export class AiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'AiError';
  }
}

/** True when the request was refused because a daily limit was reached (or the limits can't be checked). */
export const isDailyLimit = (err: unknown): err is AiError => err instanceof AiError && err.code === 'daily_limit';

/** The server's own message for errors the visitor should see as they are (daily limits, a photo that isn't a car), otherwise the fallback. */
export const aiErrorMessage = (err: unknown, fallback: string) =>
  err instanceof AiError && (err.code === 'daily_limit' || err.code === 'not_a_car') ? err.message : fallback;

export async function runAiTool<T extends ToolId>(tool: T, fields: ToolInputs[T]): Promise<ToolResult> {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool, fields }),
  });

  let payload: (ToolResult & { error?: string; code?: string }) | null = null;
  try {
    payload = await res.json();
  } catch {
    // Non-JSON response (for example a platform error page).
  }

  if (!res.ok || !payload) {
    throw new AiError(payload?.error || `The AI service is unavailable (HTTP ${res.status}). Please try again.`, res.status, payload?.code);
  }
  return payload;
}

/** The picture in a result as a data: URL, or null. */
export function imageDataUrl(result: ToolResult): string | null {
  return result.image?.data ? `data:${result.image.mimeType || 'image/png'};base64,${result.image.data}` : null;
}
