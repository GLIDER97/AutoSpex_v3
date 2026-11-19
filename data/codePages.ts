// Reviewed reference pages for individual OBD-II codes, rendered at /codes/<code>.
//
// Rules (docs/GROWTH-PLAN.md section 5):
// - every figure or technical claim comes from a listed source
// - no dollar amounts unless a source for them is listed (none is accessible yet, so the
//   pages explain what drives the cost and link to the decoder's labeled AI estimate)
// - add codes in search-demand order, at most 2 new pages a day, and only once earlier
//   code pages are being indexed (section 4a-2)
/** Traffic-signal verdict, matching the decoder: go, caution or stop. */
export type DriveVerdict = 'go' | 'caution' | 'stop';

export interface CodePageSource {
  label: string;
  url: string;
}

export interface CodePage {
  /** Upper case, e.g. P0300. The URL is /codes/<lower case>. */
  code: string;
  /** The SAE J2012 / ISO 15031-6 standard title. */
  title: string;
  /** Short name used in the page title, e.g. "Random misfire". */
  shortName: string;
  /** Search result title, 47 characters or fewer (the site name is added). */
  seoTitle: string;
  /** Meta description, 160 characters or fewer. */
  description: string;
  system: string;
  /** One or two plain-English sentences: what the code means. */
  summary: string;
  /** How the engine computer decides to set the code. */
  howItSets: string;
  symptoms: string[];
  /** Most common first. */
  causes: string[];
  /** Parts that often get replaced without fixing this code. */
  misdiagnoses: string[];
  drive: { verdict: DriveVerdict; text: string };
  /** What to check first, cheapest first. */
  checks: string[];
  /** What decides how much the fix costs (no dollar figures without a source). */
  costDrivers: string[];
  related: { code: string; note: string }[];
  faqs: [string, string][];
  sources: CodePageSource[];
  /** Date the content was last reviewed, YYYY-MM-DD. */
  reviewed: string;
}

export const CODE_PAGES: CodePage[] = [
  {
    code: 'P0300',
    title: 'Random/Multiple Cylinder Misfire Detected',
    shortName: 'Random misfire',
    seoTitle: 'P0300 Code: Random Misfire Causes and Fixes',
    description:
      'P0300 means the engine is misfiring in more than one cylinder. What causes it, whether it is safe to drive, what to check first and what drives the repair cost.',
    system: 'Ignition and engine misfire monitor',
    summary:
      "Your engine computer has seen misfires that it can't pin on a single cylinder: one or more cylinders aren't burning their fuel properly, at random or in several cylinders at once.",
    howItSets:
      "The engine computer watches how evenly the crankshaft speeds up with each cylinder's firing. When the speed changes unevenly by more than a set threshold (about 2%), it stores P0300. When the misfiring is bad enough to overheat the catalytic converter (around 10%), it makes the check engine light flash.",
    symptoms: [
      'Check engine light, sometimes flashing',
      'Rough running, shaking or jerking, especially when accelerating',
      'Rough idle or stalling at stops',
      'Loss of power and worse fuel economy',
      'Sometimes no noticeable symptoms at all',
    ],
    causes: [
      'Worn spark plugs, or failing ignition coils or plug wires',
      'Vacuum leaks letting in unmeasured air',
      'Low or weak fuel pressure (fuel pump, filter or regulator)',
      'A faulty mass air flow (MAF) sensor',
      'A faulty crankshaft or camshaft position sensor',
      'An EGR system that sticks open',
      'Mechanical engine problems such as low compression, a leaking head gasket or valve problems',
    ],
    misdiagnoses: ['Fuel injectors', 'Oxygen sensors', 'Transmission or drivetrain problems'],
    drive: {
      verdict: 'stop',
      text:
        "If the check engine light is flashing, slow down, avoid hard acceleration and get the car checked as soon as you can: the unburned fuel can overheat and ruin the catalytic converter. If the light is steady and the car runs smoothly, drive gently and have it diagnosed soon.",
    },
    checks: [
      'Read the freeze-frame data with a scanner: the speed, load and temperature when the code set point to the cause.',
      'Look for other codes. A cylinder-specific code (P0301 to P0308), a lean code (P0171, P0174) or a sensor code narrows it down fast.',
      'Check the spark plugs and their service interval. Old plugs are the most common cause and the cheapest fix.',
      'Listen for hissing vacuum leaks and check hoses and the intake boot after the air filter.',
      'If the misfire moves when you swap two ignition coils, the coil is the problem.',
    ],
    costDrivers: [
      'The cause: spark plugs are a routine part, while a fuel pump or internal engine repair costs far more.',
      'Your engine: plugs and coils on V6 and V8 engines can sit under the intake manifold, which adds labor time.',
      'Diagnosis time: random misfires can take a shop longer to trace than a single-cylinder misfire.',
    ],
    related: [
      { code: 'P0301', note: 'Misfire in cylinder 1 (P0302 to P0308 for the others)' },
      { code: 'P0171', note: 'System too lean, bank 1: a common partner code' },
      { code: 'P0174', note: 'System too lean, bank 2' },
      { code: 'P0420', note: 'Catalytic converter efficiency, which misfires can damage' },
    ],
    faqs: [
      [
        'Can a P0300 code fix itself?',
        "The light can go off if the misfire stops, for example after filling up with good fuel, but the code usually comes back until the cause is fixed. A misfire that comes and goes is still worth diagnosing before it damages the catalytic converter.",
      ],
      [
        'Will bad gas cause a P0300 code?',
        'It can. Contaminated or very low-quality fuel can cause misfires in several cylinders. If the code appeared right after a fill-up, running the tank down and refilling with fresh fuel is a reasonable first step.',
      ],
      [
        'Is P0300 the same on every car?',
        'The meaning is the same on every make, because P0300 is a generic (standard) code. The most likely cause depends on the engine, so a lookup for your exact year, make and model is more useful than a general list.',
      ],
    ],
    sources: [{ label: 'RepairPal: P0300 OBD-II trouble code', url: 'https://repairpal.com/obd-ii-code-p0300' }],
    reviewed: '2026-11-19',
  },
  {
    code: 'P0171',
    title: 'System Too Lean (Bank 1)',
    shortName: 'System too lean',
    seoTitle: 'P0171 Code: System Too Lean Causes and Fixes',
    description:
      'P0171 means the engine is getting too much air or too little fuel on bank 1. The usual causes, whether it is safe to drive and what to check first.',
    system: 'Fuel and air metering',
    summary:
      "The oxygen sensors see too much oxygen in the exhaust, so the engine is running lean: too much air or not enough fuel. The engine computer has added as much fuel as it's allowed to and still can't correct it.",
    howItSets:
      'The engine aims for about 14.7 parts air to 1 part fuel and corrects the mixture using oxygen sensor readings. That correction is called fuel trim. A healthy engine needs only a few percent; when the long-term fuel trim reaches roughly 15% to 35% extra fuel, the computer stores P0171.',
    symptoms: [
      'Check engine light',
      'Hesitation or lack of power when accelerating',
      'Rough or unstable idle, especially when warm or at a stop',
      'Occasional misfiring or "coughing"',
    ],
    causes: [
      'Vacuum leaks: cracked hoses, intake manifold gaskets or PCV hoses',
      'A dirty or faulty mass air flow (MAF) sensor',
      'A plugged fuel filter or weak fuel pump',
      'Plugged or dirty fuel injectors',
      'Engine computer software that needs a manufacturer update',
    ],
    misdiagnoses: ['Oxygen sensors: they report the lean condition, but rarely cause it'],
    drive: {
      verdict: 'caution',
      text:
        "Usually safe to drive for a short while if the car runs normally. Get it fixed soon: a lean engine can start misfiring, which can damage the catalytic converter, and it puts out more smog-forming NOx.",
    },
    checks: [
      'Look for other codes. P0174 too means both sides of a V6 or V8 are lean, which points to something shared, like the MAF sensor, a vacuum leak or fuel pressure.',
      'Check the intake boot between the air filter and the engine for cracks, and listen for hissing vacuum leaks.',
      'Clean the MAF sensor with MAF-specific cleaner (never touch the sensing wire).',
      'Ask a shop to check fuel pressure and long-term fuel trim at idle and at 3,000 rpm: which one is high shows where to look.',
      'Ask the dealer whether there is a software update or service bulletin for lean codes on your model.',
    ],
    costDrivers: [
      'The cause: a cracked vacuum hose or cleaning a MAF sensor is a small job; a fuel pump or intake gasket is much more.',
      'Access: some intake gaskets and fuel pumps take hours of labor to reach.',
      'Diagnosis time: finding a small vacuum leak can need a smoke test.',
    ],
    related: [
      { code: 'P0174', note: 'System too lean on bank 2 (the other side of a V6 or V8)' },
      { code: 'P0101', note: 'Mass air flow sensor range or performance' },
      { code: 'P0300', note: 'Random misfire, which a lean mixture can cause' },
      { code: 'P0172', note: 'System too rich, bank 1: the opposite problem' },
    ],
    faqs: [
      [
        'What does "bank 1" mean?',
        "On a V6 or V8, bank 1 is the side of the engine with cylinder 1. A four-cylinder engine only has bank 1. If you also see P0174, both banks are lean.",
      ],
      [
        'Can a dirty air filter cause P0171?',
        "Not usually. A clogged filter restricts air rather than adding it. A torn or loose intake boot after the filter, or a dirty MAF sensor, is far more likely.",
      ],
      [
        'Will replacing the oxygen sensor fix P0171?',
        'Rarely. The oxygen sensor is usually reporting the lean mixture correctly. Replacing it without finding the air leak or fuel problem is one of the most common wasted repairs for this code.',
      ],
    ],
    sources: [{ label: 'RepairPal: P0171 OBD-II trouble code', url: 'https://repairpal.com/obd-ii-code-p0171' }],
    reviewed: '2026-11-19',
  },
];

export const codePage = (code: string) => CODE_PAGES.find((p) => p.code.toLowerCase() === code.toLowerCase());
