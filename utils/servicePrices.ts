// Typical 2026 US prices for routine car services, by shop type and area,
// with the upsells to skip and how to pay less for each.

export type ShopType = 'quick' | 'independent' | 'dealer';
export const SHOP_TYPES: { id: ShopType; label: string; factor: number }[] = [
  { id: 'quick', label: 'Quick lube or chain shop', factor: 1 },
  { id: 'independent', label: 'Independent shop', factor: 0.95 },
  { id: 'dealer', label: 'Dealer', factor: 1.3 },
];

/** Shop labor costs by state, relative to the US average. */
const HIGH = ['CA', 'NY', 'NJ', 'MA', 'WA', 'CT', 'HI', 'DC', 'MD', 'AK'];
const ABOVE = ['CO', 'OR', 'IL', 'NV', 'RI', 'NH', 'VA', 'DE', 'MN', 'VT'];
const BELOW = ['AL', 'AR', 'MS', 'KY', 'TN', 'OK', 'KS', 'IA', 'NE', 'SD', 'ND', 'MO', 'WV', 'LA', 'SC', 'IN', 'OH', 'WI', 'ID', 'MT', 'WY', 'NM'];
export function areaFactor(state: string): number {
  if (HIGH.includes(state)) return 1.18;
  if (ABOVE.includes(state)) return 1.07;
  if (BELOW.includes(state)) return 0.92;
  return 1;
}

export interface Service {
  id: string;
  name: string;
  /** Typical installed price at a quick lube/chain shop in an average-cost area. */
  price: [number, number];
  /** Parts cost if you do it yourself, when that's realistic. */
  diy?: [number, number];
  how: string;
  skip: string;
}

export const SERVICES: Service[] = [
  {
    id: 'oil-synthetic',
    name: 'Synthetic oil change',
    price: [75, 115],
    diy: [35, 55],
    how: 'Follow the interval in your owner’s manual (often 7,500 to 10,000 miles for synthetic), not the 3,000-mile sticker. Chains and dealers post oil change coupons on their own websites almost every month.',
    skip: 'Engine flushes, "high-mileage" upgrades you didn’t ask for, and air filters shown to you dusty but not actually dirty.',
  },
  {
    id: 'oil-conventional',
    name: 'Conventional oil change',
    price: [45, 80],
    diy: [25, 40],
    how: 'Only if your manual allows conventional oil. Many newer cars require synthetic.',
    skip: 'Fuel system cleaning and fluid "top-off packages".',
  },
  {
    id: 'rotation',
    name: 'Tire rotation',
    price: [25, 50],
    how: 'Free for life at many tire stores if you bought your tires there. Combine it with an oil change.',
    skip: 'Nitrogen fill: air is already 78% nitrogen.',
  },
  {
    id: 'brakes-pads',
    name: 'Brake pads, one axle',
    price: [190, 350],
    diy: [50, 120],
    how: 'Ask for the pad thickness in millimeters: under 3 mm is due, 5 mm or more is not. Many shops run brake specials with a lifetime pad warranty.',
    skip: 'Rotors "because we always replace them": ask for the measured thickness against the minimum stamped on the rotor.',
  },
  {
    id: 'brakes-full',
    name: 'Brake pads and rotors, one axle',
    price: [350, 650],
    diy: [120, 300],
    how: 'Get a second quote: brake jobs vary more than almost any other service.',
    skip: 'Brake fluid flush unless it’s at the manual interval (often every 2 to 3 years) or tests contaminated.',
  },
  {
    id: 'battery',
    name: 'Battery replacement',
    price: [170, 320],
    diy: [130, 250],
    how: 'Most auto parts stores test batteries and install many of them free. Check the warranty length (3 years is good).',
    skip: 'Replacing a battery that tests good: corroded terminals or a weak alternator can look like a bad battery.',
  },
  {
    id: 'alignment',
    name: 'Wheel alignment',
    price: [100, 190],
    how: 'Needed after new tires, suspension work or if the car pulls. Some shops sell a lifetime alignment, which pays off if you keep the car.',
    skip: 'An alignment every oil change without a pull, uneven tire wear or a crooked steering wheel.',
  },
  {
    id: 'air-filter',
    name: 'Engine air filter',
    price: [45, 85],
    diy: [15, 30],
    how: 'A 5-minute DIY on most cars with no tools. Ask to see the old filter.',
    skip: 'A new filter every oil change: most last 15,000 to 30,000 miles.',
  },
  {
    id: 'cabin-filter',
    name: 'Cabin air filter',
    price: [55, 100],
    diy: [15, 30],
    how: 'Usually behind the glove box, about 10 minutes yourself.',
    skip: 'Paying $80+ for a $20 part you can swap in minutes.',
  },
  {
    id: 'coolant',
    name: 'Coolant flush',
    price: [120, 210],
    how: 'Many modern coolants last 100,000 miles or 10 years. Check your manual first.',
    skip: 'A flush offered at a low mileage "because it looks dark".',
  },
  {
    id: 'transmission',
    name: 'Transmission fluid service',
    price: [160, 320],
    how: 'Follow the manual’s severe or normal schedule. On high-mileage cars that never had it done, ask the shop’s opinion before changing it.',
    skip: 'A pressurized "flush" when the manual specifies a drain-and-fill.',
  },
  {
    id: 'spark-plugs',
    name: 'Spark plugs (4-cylinder)',
    price: [160, 320],
    diy: [40, 90],
    how: 'Iridium plugs often last 100,000 miles. V6 engines cost more because of extra labor.',
    skip: 'Plugs well before the manual’s interval without a misfire.',
  },
  {
    id: 'ac',
    name: 'A/C recharge',
    price: [150, 300],
    how: 'If it needs recharging again within a year there’s a leak: ask for a leak test (dye) instead of repeated recharges.',
    skip: 'Recharging without checking for a leak first.',
  },
  {
    id: 'diagnostic',
    name: 'Check engine light diagnosis',
    price: [100, 200],
    how: 'Auto parts stores read codes for free. Look up the code first, and ask whether the diagnostic fee is credited toward the repair.',
    skip: 'Paying for a "diagnosis" that is only a code read.',
  },
  {
    id: 'wipers',
    name: 'Wiper blades, installed',
    price: [35, 70],
    diy: [20, 45],
    how: 'Parts stores will usually install wipers free when you buy them there.',
    skip: 'Premium blades at double the price for a car that sits outside in mild weather.',
  },
];

export function servicePrice(s: Service, shop: ShopType, state: string): [number, number] {
  const f = SHOP_TYPES.find((t) => t.id === shop)!.factor * areaFactor(state);
  const round = (n: number) => Math.round(n / 5) * 5;
  return [round(s.price[0] * f), round(s.price[1] * f)];
}

/** Where real, current coupons are published: the shops' own websites. */
export const COUPON_SOURCES: { name: string; url: string; for: string }[] = [
  { name: 'Jiffy Lube', url: 'https://www.jiffylube.com', for: 'Oil changes' },
  { name: 'Valvoline Instant Oil Change', url: 'https://www.vioc.com', for: 'Oil changes' },
  { name: 'Firestone Complete Auto Care', url: 'https://www.firestonecompleteautocare.com', for: 'Oil, brakes, tires, alignment' },
  { name: 'Midas', url: 'https://www.midas.com', for: 'Brakes, oil, exhaust' },
  { name: 'Meineke', url: 'https://www.meineke.com', for: 'Brakes, oil, A/C' },
  { name: 'Pep Boys', url: 'https://www.pepboys.com', for: 'Oil, batteries, tires' },
  { name: 'Discount Tire', url: 'https://www.discounttire.com', for: 'Tires (and free rotations)' },
  { name: 'NTB', url: 'https://www.ntb.com', for: 'Tires, alignment, brakes' },
];
