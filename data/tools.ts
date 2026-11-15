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
        description: 'One or more codes: whether it’s safe to drive, likely causes and what each fix costs.',
        icon: Gauge,
      },
      {
        name: 'Recall check',
        path: '/recalls',
        description: 'Safety recalls for your year, make and model, straight from NHTSA.',
        icon: ShieldAlert,
      },
      {
        name: 'VIN report',
        path: '/vin-lookup',
        description: 'Specs, recalls, owner complaints, crash ratings and MPG from any VIN.',
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
        description: 'Snap a photo of your estimate and see which lines are fair or inflated.',
        icon: ReceiptText,
      },
      {
        name: 'Insurance cost estimate',
        path: '/insurance-estimator',
        description: 'A ballpark monthly premium for your profile, and what each change would save.',
        icon: ShieldCheck,
      },
      {
        name: 'MPG and fuel cost',
        path: '/mpg-calculator',
        description: 'Fuel cost per mile, your real MPG against the EPA, and two cars compared.',
        icon: Fuel,
      },
      {
        name: 'Cost of ownership',
        path: '/ownership-calculator',
        description: 'Everything a car costs over the years you keep it, for one car or two.',
        icon: PiggyBank,
      },
      {
        name: 'Can I afford this car?',
        path: '/affordability-predictor',
        description: 'The real monthly payment and total cost, checked against your income.',
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
