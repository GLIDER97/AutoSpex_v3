
export enum SeverityLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export enum SafetyStatus {
  SAFE = 'Safe to Drive',
  CAUTION = 'Drive with Caution',
  STOP = 'Stop Immediately'
}

export enum DIYDifficulty {
  EASY = 'Easy (DIY)',
  MODERATE = 'Moderate',
  HARD = 'Professional Required'
}

export interface OBDCodeData {
  code: string;
  title: string;
  description: string;
  plainEnglish: string;
  symptoms: string[];
  causes: string[];
  severity: SeverityLevel;
  category: string;
  safetyStatus: SafetyStatus;
  repairCostEstimate: string;
  diyDifficulty: DIYDifficulty;
  similarCodes?: string[];
}

export interface MaintenanceRequest {
  year: string;
  make: string;
  model: string;
  service: string;
  zip: string;
  quoteAmount?: string;
}

export interface OwnershipRequest {
  carType: 'Sedan' | 'SUV' | 'Truck' | 'EV' | 'Hybrid';
  purchasePrice: string;
  zipCode: string;
  annualMiles: '5k' | '10k' | '15k' | '20k+';
  ownershipPeriod: '3 years' | '5 years';
}

export interface OwnershipResult {
  totalCost: number;
  monthlyAverage: number;
  breakdown: {
    depreciation: number;
    fuel: number;
    maintenance: number;
    insurance: number;
    financing: number;
  };
  expertAdditions: {
    biggestHiddenCost: string;
    costSavingInsight: string;
  };
}

