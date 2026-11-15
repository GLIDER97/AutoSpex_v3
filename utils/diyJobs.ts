// DIY job planner data: common jobs an owner can do at home, what each saves
// against a shop, the tools it needs and when to leave it to a pro.

export interface Tool {
  id: string;
  name: string;
  price: [number, number];
  /** Search phrase for the shopping link. */
  search: string;
  emergency?: boolean;
}

export const TOOLS: Tool[] = [
  { id: 'sockets', name: 'Socket and wrench set (metric and SAE)', price: [40, 100], search: 'mechanics tool set sockets' },
  { id: 'jack', name: 'Floor jack (2 to 3 ton)', price: [50, 130], search: 'floor jack 3 ton' },
  { id: 'stands', name: 'Jack stands (pair)', price: [30, 60], search: 'jack stands 3 ton pair' },
  { id: 'torque', name: 'Torque wrench', price: [25, 80], search: 'click torque wrench 1/2 inch' },
  { id: 'breaker', name: 'Breaker bar', price: [20, 40], search: 'breaker bar 1/2 inch' },
  { id: 'filterWrench', name: 'Oil filter wrench', price: [8, 15], search: 'oil filter wrench' },
  { id: 'drainPan', name: 'Oil drain pan', price: [10, 20], search: 'oil drain pan' },
  { id: 'funnel', name: 'Funnel', price: [4, 10], search: 'automotive funnel' },
  { id: 'caliper', name: 'Brake caliper piston tool or large C-clamp', price: [15, 40], search: 'brake caliper piston compressor tool' },
  { id: 'brakeCleaner', name: 'Brake cleaner', price: [5, 10], search: 'brake parts cleaner' },
  { id: 'plugSocket', name: 'Spark plug socket and extension', price: [8, 20], search: 'spark plug socket set' },
  { id: 'gapTool', name: 'Spark plug gap tool', price: [5, 10], search: 'spark plug gap tool' },
  { id: 'trimTool', name: 'Plastic trim removal tools', price: [8, 15], search: 'trim removal tool kit' },
  { id: 'screwdrivers', name: 'Screwdriver set', price: [10, 25], search: 'screwdriver set' },
  { id: 'terminalBrush', name: 'Battery terminal brush', price: [5, 10], search: 'battery terminal cleaner brush' },
  { id: 'gauge', name: 'Digital tire pressure gauge', price: [8, 20], search: 'digital tire pressure gauge' },
  { id: 'scanner', name: 'OBD2 code scanner (Bluetooth or handheld)', price: [20, 100], search: 'OBD2 scanner bluetooth' },
  { id: 'gloves', name: 'Nitrile or work gloves', price: [10, 20], search: 'mechanic gloves nitrile' },
  { id: 'glasses', name: 'Safety glasses', price: [8, 15], search: 'safety glasses' },
  { id: 'jumpStarter', name: 'Portable jump starter', price: [60, 150], search: 'portable car jump starter lithium', emergency: true },
  { id: 'compressor', name: '12V portable tire inflator', price: [35, 80], search: '12V portable tire inflator', emergency: true },
  { id: 'cables', name: 'Jumper cables (4 gauge, 20 ft)', price: [25, 50], search: 'jumper cables 4 gauge 20 ft', emergency: true },
  { id: 'firstAid', name: 'Car first aid kit', price: [20, 40], search: 'car first aid kit', emergency: true },
  { id: 'escape', name: 'Seatbelt cutter and window breaker', price: [12, 20], search: 'seatbelt cutter window breaker', emergency: true },
];

export type Level = 'Easy' | 'Moderate' | 'Hard';

export interface Job {
  id: string;
  name: string;
  level: Level;
  time: string;
  shop: [number, number];
  diyParts: [number, number];
  tools: string[];
  steps: string[];
  pro: string;
}

export const JOBS: Job[] = [
  {
    id: 'codes',
    name: 'Read a check engine code',
    level: 'Easy',
    time: '5 minutes',
    shop: [100, 200],
    diyParts: [0, 0],
    tools: ['scanner'],
    steps: ['Find the OBD2 port under the dashboard, near the steering column.', 'Plug in the scanner with the ignition on and read the codes.', 'Look up each code before paying for repairs.'],
    pro: 'If the check engine light is flashing, the engine is misfiring badly: stop driving and get it diagnosed.',
  },
  {
    id: 'air-filter',
    name: 'Engine air filter',
    level: 'Easy',
    time: '10 minutes',
    shop: [45, 85],
    diyParts: [15, 30],
    tools: ['screwdrivers'],
    steps: ['Open the air box (clips or a few screws).', 'Note which way the old filter sits, swap it, and close the box firmly.'],
    pro: 'Rarely needed. Make sure the box is sealed so unfiltered air can’t get in.',
  },
  {
    id: 'cabin-filter',
    name: 'Cabin air filter',
    level: 'Easy',
    time: '15 minutes',
    shop: [55, 100],
    diyParts: [15, 30],
    tools: ['screwdrivers'],
    steps: ['Empty the glove box and release its stops so it drops down.', 'Slide out the old filter, match the airflow arrow on the new one, and refit.'],
    pro: 'Some cars hide it under the dash or windshield cowl; check a video for your model first.',
  },
  {
    id: 'wipers',
    name: 'Wiper blades',
    level: 'Easy',
    time: '10 minutes',
    shop: [35, 70],
    diyParts: [20, 45],
    tools: [],
    steps: ['Lift the arm, press the release tab and slide the old blade off the hook.', 'Click the new blade on and lower the arm gently.'],
    pro: 'Never needed. Hold the arm so it can’t snap back onto the glass.',
  },
  {
    id: 'battery',
    name: 'Battery replacement',
    level: 'Easy',
    time: '30 minutes',
    shop: [170, 320],
    diyParts: [130, 250],
    tools: ['sockets', 'terminalBrush', 'gloves', 'glasses'],
    steps: ['Disconnect the negative (−) cable first, then the positive (+).', 'Remove the hold-down, swap the battery, clean the terminals.', 'Connect positive first, then negative. Return the old battery for your core refund.'],
    pro: 'Many newer cars (BMW, Mercedes, Audi and others) must register a new battery with a scan tool, and some batteries sit under a seat or in the trunk.',
  },
  {
    id: 'bulb',
    name: 'Headlight or taillight bulb',
    level: 'Easy',
    time: '15 to 45 minutes',
    shop: [40, 120],
    diyParts: [10, 40],
    tools: ['screwdrivers', 'trimTool', 'gloves'],
    steps: ['Find the bulb holder behind the light (sometimes through the wheel well).', 'Twist out the holder, swap the bulb without touching the glass, and test it.'],
    pro: 'LED and HID headlight units that are sealed, or lights that need the bumper removed.',
  },
  {
    id: 'oil',
    name: 'Oil and filter change',
    level: 'Moderate',
    time: '45 to 60 minutes',
    shop: [75, 115],
    diyParts: [35, 55],
    tools: ['sockets', 'jack', 'stands', 'filterWrench', 'drainPan', 'funnel', 'gloves'],
    steps: ['Warm the engine slightly, lift the car and support it on jack stands on level ground.', 'Drain the oil, replace the filter (oil its gasket first), refit the drain plug with a new washer.', 'Fill with the grade and amount in your manual, run the engine, check for leaks and the dipstick.'],
    pro: 'Cars with a skid plate or a cartridge filter take longer. Never work under a car supported only by a jack.',
  },
  {
    id: 'rotation',
    name: 'Tire rotation and pressure check',
    level: 'Moderate',
    time: '45 minutes',
    shop: [25, 50],
    diyParts: [0, 0],
    tools: ['jack', 'stands', 'breaker', 'torque', 'gauge'],
    steps: ['Loosen lug nuts, lift and support the car.', 'Move tires in the pattern in your manual (often front-to-back on the same side).', 'Torque lug nuts to spec in a star pattern and set pressures from the door sticker.'],
    pro: 'Free at many tire stores if you bought the tires there.',
  },
  {
    id: 'plugs',
    name: 'Spark plugs (4-cylinder)',
    level: 'Moderate',
    time: '1 hour',
    shop: [160, 320],
    diyParts: [40, 90],
    tools: ['sockets', 'plugSocket', 'gapTool', 'torque'],
    steps: ['Work on a cold engine, one plug at a time: remove the coil, then the plug.', 'Check the gap, thread the new plug in by hand, torque to spec, refit the coil.'],
    pro: 'V6 and V8 engines often need the intake removed for the rear plugs: that’s a shop job.',
  },
  {
    id: 'brakes',
    name: 'Brake pads, one axle',
    level: 'Hard',
    time: '1.5 to 2 hours',
    shop: [190, 350],
    diyParts: [50, 120],
    tools: ['sockets', 'jack', 'stands', 'breaker', 'torque', 'caliper', 'brakeCleaner', 'gloves', 'glasses'],
    steps: ['Lift and support the car, remove the wheel and the caliper bolts.', 'Push the piston back, fit the new pads and hardware, refit and torque everything.', 'Pump the pedal before driving, then bed the pads in with several moderate stops.'],
    pro: 'Electronic parking brakes on rear calipers, grinding noises (rotors may be damaged), or any doubt: brakes are not a learning project.',
  },
];

export const toolById = (id: string) => TOOLS.find((t) => t.id === id)!;
export const mid = (r: [number, number]) => (r[0] + r[1]) / 2;
export const shopping = (t: Tool) => `https://www.amazon.com/s?k=${encodeURIComponent(t.search)}`;
