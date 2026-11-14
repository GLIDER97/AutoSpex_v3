// Every tool on the site, grouped the way US road signs use color:
// yellow = warning, green = guidance (here: money decisions), blue = motorist
// services, brown = recreation. The navbar, homepage and footer all read this
// list, so a tool only has to be added once.
import type { LucideIcon } from 'lucide-react';
import {
  Gauge,
  ShieldAlert,
  ScanBarcode,
  ReceiptText,
  ShieldCheck,
  Fuel,
  PiggyBank,
  Wallet,
  TrendingDown,
  MapPin,
  Ticket,
  Hammer,
  RectangleHorizontal,
  SprayCan,
} from 'lucide-react';

export type ToolCategoryId = 'warnings' | 'money' | 'services' | 'fun';

export interface Tool {
  name: string;
  path: string;
  description: string;
  icon: LucideIcon;
}

export interface ToolCategory {
  id: ToolCategoryId;
  name: string;
  tools: Tool[];
}

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: 'warnings',
    name: 'Warnings and checks',
    tools: [
      {
        name: 'Check engine code lookup',
        path: '/fault-code-decoder',
        description: 'What an OBD-II code means, how serious it is and what the fix usually costs.',
        icon: Gauge,
      },
      {
        name: 'Recall check',
        path: '/recalls',
        description: 'Safety recalls for your year, make and model, straight from NHTSA.',
        icon: ShieldAlert,
      },
      {
        name: 'VIN decoder',
        path: '/vin-lookup',
        description: 'Factory specs behind any 17-character VIN.',
        icon: ScanBarcode,
      },
    ],
  },
  {
    id: 'money',
    name: 'Money decisions',
    tools: [
      {
        name: 'Repair quote checker',
        path: '/maintenance-validator',
        description: "See whether a shop's quote is in the normal range for your area.",
        icon: ReceiptText,
      },
      {
        name: 'Insurance cost estimate',
        path: '/insurance-estimator',
        description: 'A ballpark monthly premium for your car, age and ZIP code.',
        icon: ShieldCheck,
      },
      {
        name: 'MPG and fuel cost',
        path: '/mpg-calculator',
        description: 'Your cost per mile, and your real MPG next to the EPA rating.',
        icon: Fuel,
      },
      {
        name: 'Cost of ownership',
        path: '/ownership-calculator',
        description: 'Depreciation, fuel, insurance, upkeep and loan costs, added up.',
        icon: PiggyBank,
      },
      {
        name: 'Can I afford this car?',
        path: '/affordability-predictor',
        description: 'A fair price range and the monthly payment, checked against your income.',
        icon: Wallet,
      },
      {
        name: 'Resale value drop',
        path: '/value-shock-calculator',
        description: 'How much value your car loses per day and over the next year.',
        icon: TrendingDown,
      },
    ],
  },
  {
    id: 'services',
    name: 'Help nearby',
    tools: [
      {
        name: 'Find a mechanic',
        path: '/mechanic-finder',
        description: 'Repair shops near your ZIP code.',
        icon: MapPin,
      },
      {
        name: 'Service coupons',
        path: '/coupons',
        description: 'Typical deals on oil changes, brakes and tires.',
        icon: Ticket,
      },
      {
        name: 'DIY tools',
        path: '/diy-toolkits',
        description: 'Scanners and tools worth owning for home repairs.',
        icon: Hammer,
      },
    ],
  },
  {
    id: 'fun',
    name: 'Just for fun',
    tools: [
      {
        name: 'Vanity plate ideas',
        path: '/plate-generator',
        description: 'Plate ideas from your car, your hobbies and your style.',
        icon: RectangleHorizontal,
      },
      {
        name: 'Wrap designer',
        path: '/wrap-designer',
        description: 'Preview a custom vinyl wrap from a short description.',
        icon: SprayCan,
      },
    ],
  },
];

export const CATEGORY_BY_ID = Object.fromEntries(TOOL_CATEGORIES.map((c) => [c.id, c])) as Record<
  ToolCategoryId,
  ToolCategory
>;
