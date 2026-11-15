// Total cost of ownership, calculated in the open: every assumption is a
// number the person can see and change.
import { monthlyPayment } from './carMath';

export type Segment = 'Sedan' | 'SUV' | 'Truck' | 'Hybrid' | 'EV';

/**
 * Typical starting assumptions per vehicle type: value lost in year one and
 * each year after, and average maintenance and repair cost per mile over the
 * first five years. Rules of thumb, editable per car.
 */
export const SEGMENT_DEFAULTS: Record<Segment, { firstYearDrop: number; yearlyDrop: number; maintenancePerMile: number }> = {
  Sedan: { firstYearDrop: 20, yearlyDrop: 12, maintenancePerMile: 0.1 },
  SUV: { firstYearDrop: 18, yearlyDrop: 11, maintenancePerMile: 0.11 },
  Truck: { firstYearDrop: 15, yearlyDrop: 10, maintenancePerMile: 0.12 },
  Hybrid: { firstYearDrop: 18, yearlyDrop: 11, maintenancePerMile: 0.09 },
  EV: { firstYearDrop: 25, yearlyDrop: 13, maintenancePerMile: 0.07 },
};

export interface CarInput {
  price: number;
  /** Combined MPG, or MPGe for an electric car. */
  mpg: number;
  electric: boolean;
  insurancePerYear: number;
  firstYearDrop: number; // percent
  yearlyDrop: number; // percent
  maintenancePerMile: number; // dollars, average over five years
}

export interface SharedInput {
  years: number;
  milesPerYear: number;
  gasPrice: number; // $/gallon
  electricityPrice: number; // $/kWh
  salesTaxRate: number; // fraction
  registrationPerYear: number;
  downPaymentRate: number; // fraction of price
  apr: number; // percent
  termMonths: number;
}

export interface YearCost {
  label: string;
  depreciation: number;
  fuel: number;
  insurance: number;
  maintenance: number;
  interest: number;
  taxesAndFees: number;
}

export interface OwnershipResult {
  years: YearCost[];
  totals: Omit<YearCost, 'label'>;
  total: number;
  perMonth: number;
  perMile: number;
  resaleValue: number;
}

// EPA counts 33.7 kWh of electricity as one gallon of gasoline (MPGe).
const KWH_PER_GALLON_EQUIVALENT = 33.7;

/** Maintenance grows with age: 60% of average in year 1, +20 points a year (averages 100% over five years). */
const maintenanceFactor = (yearIndex: number) => 0.6 + 0.2 * yearIndex;

export function ownershipCost(car: CarInput, s: SharedInput): OwnershipResult {
  const years: YearCost[] = [];
  const loan = Math.max(0, car.price * (1 + s.salesTaxRate) - car.price * s.downPaymentRate);
  const payment = monthlyPayment(loan, s.apr, s.termMonths);
  const r = s.apr / 100 / 12;
  let balance = loan;
  let value = car.price;

  const fuelPerMile = car.mpg > 0 ? (car.electric ? (KWH_PER_GALLON_EQUIVALENT / car.mpg) * s.electricityPrice : s.gasPrice / car.mpg) : 0;

  for (let y = 0; y < s.years; y++) {
    const drop = (y === 0 ? car.firstYearDrop : car.yearlyDrop) / 100;
    const lost = value * drop;
    value -= lost;

    let interest = 0;
    for (let m = 0; m < 12 && balance > 0.005 && y * 12 + m < s.termMonths; m++) {
      const i = balance * r;
      interest += i;
      balance -= Math.min(balance, payment - i);
    }

    years.push({
      label: `Year ${y + 1}`,
      depreciation: lost,
      fuel: s.milesPerYear * fuelPerMile,
      insurance: car.insurancePerYear,
      maintenance: s.milesPerYear * car.maintenancePerMile * maintenanceFactor(y),
      interest,
      taxesAndFees: s.registrationPerYear + (y === 0 ? car.price * s.salesTaxRate : 0),
    });
  }

  const sum = (k: keyof Omit<YearCost, 'label'>) => years.reduce((t, y) => t + y[k], 0);
  const totals = {
    depreciation: sum('depreciation'),
    fuel: sum('fuel'),
    insurance: sum('insurance'),
    maintenance: sum('maintenance'),
    interest: sum('interest'),
    taxesAndFees: sum('taxesAndFees'),
  };
  const total = Object.values(totals).reduce((a, b) => a + b, 0);
  return {
    years,
    totals,
    total,
    perMonth: total / (s.years * 12),
    perMile: s.milesPerYear > 0 ? total / (s.milesPerYear * s.years) : 0,
    resaleValue: value,
  };
}

export const CATEGORY_LABELS: Record<keyof OwnershipResult['totals'], string> = {
  depreciation: 'Value lost (depreciation)',
  fuel: 'Fuel or charging',
  insurance: 'Insurance',
  maintenance: 'Maintenance and repairs',
  interest: 'Loan interest',
  taxesAndFees: 'Sales tax and registration',
};
