// Exact car-finance math used by the affordability and ownership tools.

/** Monthly payment for a fixed-rate loan (standard amortization formula). */
export function monthlyPayment(principal: number, aprPercent: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  const r = aprPercent / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

/** The largest loan a given monthly payment can repay. */
export function maxLoanForPayment(payment: number, aprPercent: number, months: number): number {
  if (payment <= 0 || months <= 0) return 0;
  const r = aprPercent / 100 / 12;
  if (r === 0) return payment * months;
  return (payment * (1 - Math.pow(1 + r, -months))) / r;
}

export interface PurchaseCosts {
  price: number;
  /** Sales tax as a fraction (0.06 = 6%). Most states tax the price minus the trade-in. */
  taxRate: number;
  fees: number;
  downPayment: number;
  tradeIn: number;
}

export function salesTax(c: PurchaseCosts): number {
  return Math.max(0, c.price - c.tradeIn) * c.taxRate;
}

export function amountFinanced(c: PurchaseCosts): number {
  return Math.max(0, c.price + salesTax(c) + c.fees - c.downPayment - c.tradeIn);
}

/** Inverse of amountFinanced: the highest price a loan amount covers. */
export function maxPriceForLoan(loan: number, c: Omit<PurchaseCosts, 'price'>): number {
  // price + (price - tradeIn) * t + fees - down - tradeIn = loan
  const price = (loan - c.fees + c.downPayment + c.tradeIn * (1 + c.taxRate)) / (1 + c.taxRate);
  return Math.max(0, price);
}

export interface LoanYear {
  label: string;
  principal: number;
  interest: number;
  balance: number;
}

/** Principal and interest paid in each year of the loan. */
export function amortizationByYear(principal: number, aprPercent: number, months: number): LoanYear[] {
  const payment = monthlyPayment(principal, aprPercent, months);
  const r = aprPercent / 100 / 12;
  let balance = principal;
  const years: LoanYear[] = [];
  for (let m = 0; m < months; m++) {
    const interest = balance * r;
    const toPrincipal = Math.min(balance, payment - interest);
    balance -= toPrincipal;
    const y = Math.floor(m / 12);
    years[y] ??= { label: `Year ${y + 1}`, principal: 0, interest: 0, balance: 0 };
    years[y].principal += toPrincipal;
    years[y].interest += interest;
    years[y].balance = Math.max(0, balance);
  }
  return years;
}

// Typical APRs by credit band (new / used). Not a quote: people should enter
// the rate from a pre-approval for exact numbers.
export const CREDIT_TIERS = [
  { id: 'excellent', label: 'Excellent (720+)', newApr: 6.0, usedApr: 7.5 },
  { id: 'good', label: 'Good (660–719)', newApr: 7.5, usedApr: 10.0 },
  { id: 'fair', label: 'Fair (600–659)', newApr: 11.0, usedApr: 15.0 },
  { id: 'poor', label: 'Poor (under 600)', newApr: 15.0, usedApr: 20.0 },
] as const;
export type CreditTierId = (typeof CREDIT_TIERS)[number]['id'];
