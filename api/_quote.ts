// Repair quote lines and their exact arithmetic, shared by the page
// (utils/quoteAudit.ts) and the server, which writes the quote check prompt.

export type LineType = 'Labor' | 'Part' | 'Fee' | 'Job';
export const LINE_TYPES: LineType[] = ['Job', 'Labor', 'Part', 'Fee'];
export const SHOP_TYPES = ['Independent shop', 'Dealer', 'Chain shop', 'Not sure'] as const;
export type ShopType = (typeof SHOP_TYPES)[number];

/** Limits the server accepts (the page trims lines to fit before sending). */
export const QUOTE_LIMITS = { lines: 40, description: 140, quantity: 1000, amount: 100000 } as const;

export interface QuoteLine {
  description: string;
  type: LineType;
  /** Hours for labor lines, quantity for parts. */
  quantity: number;
  amount: number;
}

export function quoteMath(lines: QuoteLine[]) {
  const total = lines.reduce((sum, l) => sum + l.amount, 0);
  const labor = lines.filter((l) => l.type === 'Labor');
  const laborCost = labor.reduce((s, l) => s + l.amount, 0);
  const laborHours = labor.reduce((s, l) => s + (l.quantity || 0), 0);
  const fees = lines.filter((l) => l.type === 'Fee').reduce((s, l) => s + l.amount, 0);
  return {
    total,
    laborCost,
    laborHours,
    /** Effective hourly rate, when labor lines list hours. */
    laborRate: laborHours > 0 ? laborCost / laborHours : null,
    fees,
    feeShare: total > 0 ? fees / total : 0,
  };
}
