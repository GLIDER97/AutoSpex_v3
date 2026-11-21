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
  {
    code: 'P0128',
    title: 'Coolant Thermostat (Coolant Temperature Below Thermostat Regulating Temperature)',
    shortName: 'Engine running too cold',
    seoTitle: 'P0128 Code: Coolant Thermostat Causes, Fixes',
    description:
      'P0128 means the engine takes too long to warm up or runs too cold. The usual causes, whether it is safe to drive and what to check before replacing parts.',
    system: 'Engine cooling and temperature monitoring',
    summary:
      "Your engine isn't reaching its normal operating temperature quickly enough, or it keeps dropping below it while you drive. The most common reason is a thermostat that is stuck open, letting coolant flow through the radiator before the engine has warmed up.",
    howItSets:
      'Most engine computers expect the coolant temperature sensor to read above about 160–170 °F within about 15 minutes of starting, and to stay above it while driving. If it fails either check, the computer records the event; if it happens again on the next start, it stores P0128 and turns on the check engine light.',
    symptoms: [
      'Check engine light',
      'Temperature gauge reads lower than usual or takes a long time to rise',
      'Weak heat from the heater in cold weather',
      'Worse fuel economy, because a cold engine runs a richer warm-up mixture',
      'Some automatics will not shift into top gear at highway speed',
      'Often no other symptoms at all',
    ],
    causes: [
      'A thermostat stuck open or opening too early (the most common cause)',
      'A faulty engine coolant temperature sensor or its wiring',
      'Low engine coolant',
      'A cooling fan stuck on, so the engine is cooled all the time',
      'A faulty intake air temperature sensor, which some engines compare against coolant temperature',
      'Old or dirty coolant giving the temperature sensor false readings',
    ],
    misdiagnoses: [
      'Oxygen sensors',
      'Cooling fans, when the fan itself is fine and only its control is at fault',
      'Internal engine problems',
      'Replacing the coolant temperature sensor when the thermostat is the real cause',
    ],
    drive: {
      verdict: 'caution',
      text:
        "Usually safe to drive for now if the temperature gauge never reads high and the coolant level is correct. Get it fixed soon: a cold engine uses more fuel and puts out more pollution, and in winter you may have little cabin heat or defrosting. If the gauge ever reads hot, stop driving: that is a different and more urgent problem.",
    },
    checks: [
      'With the engine cold, check the coolant level in the reservoir and top it up with the coolant your owner manual specifies.',
      'Read the freeze-frame data: the speed, load and coolant and intake air temperatures when the code set show whether it failed on warm-up or while cruising.',
      "Watch live coolant temperature on a scanner from a cold start with the heater off. If it doesn't pass about 160–170 °F within 15 minutes, a thermostat stuck open is the most likely cause.",
      'Check that the cooling fan is not running all the time on a cold engine.',
      "On a cold start the coolant and intake air temperature readings should be almost the same. If one is far off, suspect that sensor or its wiring before the thermostat.",
      'Ask the dealer whether there is a service bulletin for P0128 on your model; some engines have a known thermostat or software fix.',
    ],
    costDrivers: [
      'The cause: topping up coolant or replacing a sensor is a small job; a thermostat is usually a modest repair, but more on some engines.',
      'Access: on some engines the thermostat sits deep under the intake or other parts, which adds labor time.',
      'Coolant: replacing the thermostat means draining and refilling some coolant, and some engines need special coolant and air bleeding.',
      'Whether the thermostat comes as a sealed housing assembly on your engine, which costs more than a thermostat alone.',
    ],
    related: [
      { code: 'P0125', note: 'Insufficient coolant temperature for closed-loop fuel control' },
      { code: 'P0126', note: 'Insufficient coolant temperature for stable operation' },
      { code: 'P0117', note: 'Engine coolant temperature sensor circuit low' },
      { code: 'P0171', note: 'System too lean, bank 1: another code that affects fuel mixture' },
    ],
    faqs: [
      [
        'Can low coolant cause a P0128 code?',
        'Yes. If the coolant is low, the temperature sensor may sit in air or steam instead of liquid and read too low. Check the level with the engine cold before replacing anything.',
      ],
      [
        'Will a P0128 code go away on its own?',
        "The light can go off after several drives without the fault, which is more likely in warm weather. If the thermostat is stuck open, the code usually comes back, especially when it's cold outside.",
      ],
      [
        'Is P0128 more common in winter?',
        "Yes. Cold air and cold coolant make a weak or stuck-open thermostat struggle to warm the engine within the time limit, so the code often first appears when the weather turns cold.",
      ],
      [
        'Should I replace the thermostat or the temperature sensor first?',
        "Check before buying either. If the live coolant temperature rises slowly and the gauge reads low, the thermostat is the usual cause. If the sensor's reading doesn't match the intake air temperature on a cold start, the sensor or its wiring is more likely.",
      ],
    ],
    sources: [{ label: 'RepairPal: P0128 OBD-II trouble code', url: 'https://repairpal.com/obd-ii-code-p0128' }],
    reviewed: '2026-11-20',
  },
  {
    code: 'P0455',
    title: 'Evaporative Emission System Leak Detected (Large Leak)',
    shortName: 'EVAP large leak',
    seoTitle: 'P0455 Code: EVAP Large Leak Causes and Fixes',
    description:
      'P0455 means the fuel vapor (EVAP) system found a large leak. The usual causes, starting with the gas cap, whether it is safe to drive and what to check first.',
    system: 'Evaporative emission (EVAP) control',
    summary:
      "Your car's fuel vapor system, which traps gasoline fumes from the tank and burns them in the engine, failed its self-test because it couldn't hold vacuum. That usually means a large leak, and the most common one is a loose, missing or worn gas cap.",
    howItSets:
      "After the car has sat for several hours (typically four to eight) and with the tank between about 15% and 85% full, the engine computer runs a leak test. It closes the canister vent valve, opens the purge valve to pull vacuum on the system for a few seconds, then closes it and watches the fuel tank pressure sensor. If no vacuum builds, or it disappears too fast, on two tests in a row, it stores P0455.",
    symptoms: [
      'Check engine light',
      'Usually nothing else: the car drives normally',
      'Sometimes a smell of gasoline near the car, especially around the filler or the rear',
    ],
    causes: [
      'A missing, loose, damaged or wrong gas cap (or a worn seal on it)',
      'A damaged or rusted fuel filler neck',
      'Torn, cracked or disconnected EVAP hoses',
      'A purge valve or canister vent valve stuck open or closed',
      'A cracked or damaged charcoal canister',
      'A leaking seal or gasket on the fuel pump or fuel level sender at the top of the tank',
      'A faulty fuel tank pressure sensor',
      'A damaged fuel tank',
    ],
    misdiagnoses: [
      'The purge valve and the vent valve: often replaced without a smoke test proving they are at fault',
      "The gas cap: easy to check and replace, but if a new cap doesn't clear the code, the leak is somewhere else",
    ],
    drive: {
      verdict: 'go',
      text:
        "Generally safe to drive: it doesn't affect how the car runs. Get it fixed reasonably soon, though, because gasoline vapor is escaping into the air, the car will likely fail an emissions inspection while the light is on, and the light can hide a new, more serious problem. If you smell strong fuel, have it checked promptly.",
    },
    checks: [
      "Check the gas cap first: is it there, tight (clicked), and is its rubber seal intact? If it's damaged or not the right part, replace it.",
      'Look at the filler neck behind the fuel door for rust or damage.',
      'Clear the code and drive normally for a few days: the leak test only runs under certain conditions, so it can take several drives to see if the code returns.',
      'If the code comes back, ask a shop for an EVAP smoke test. It shows exactly where vapor escapes instead of guessing at parts.',
      'Ask the shop to check the purge and vent valves and the fuel tank pressure sensor reading during the test: a valve stuck open or a sensor that misreads can set this code without any leak.',
    ],
    costDrivers: [
      'The cause: a gas cap is a cheap part you can fit yourself; a canister, filler neck or fuel tank part costs much more.',
      'Diagnosis time: a smoke test is the reliable way to find the leak and is usually charged as diagnostic time.',
      'Access: valves and the canister often sit under the car near the tank, and tank-top seals may need the tank lowered.',
    ],
    related: [
      { code: 'P0442', note: 'EVAP system small leak' },
      { code: 'P0456', note: 'EVAP system very small leak' },
      { code: 'P0457', note: 'EVAP leak detected: fuel cap loose or off' },
      { code: 'P0452', note: 'EVAP system pressure sensor low' },
    ],
    faqs: [
      [
        'Can a gas cap cause a P0455 code?',
        "Yes, it's the most common cause. A missing, loose or worn cap lets the system leak during the self-test. Tighten it until it clicks, or replace a damaged cap, then give the car several drives to re-run the test.",
      ],
      [
        'How long does it take P0455 to clear after fixing the leak?',
        "The light goes off only after the EVAP self-test passes, and that test runs only under certain conditions (for example after the car has sat for hours and with a partly full tank). It can take several days of normal driving. Clearing the code with a scanner turns the light off immediately, but don't do it right before an emissions test: the car will show as not ready.",
      ],
      [
        'Can I pass emissions with a P0455 code?',
        "Usually not in areas with OBD-II inspection: under EPA guidance for state programs, a lit check engine light is a fail. Fix the cause, then drive normally (EPA suggests about a week) so the readiness monitors can complete before the test. Rules vary by state, so check yours.",
      ],
      [
        "What's the difference between P0455 and P0442?",
        'Both mean the EVAP system failed its leak test. P0455 is a large leak (or no vacuum at all), often a missing or loose cap or a disconnected hose. P0442 is a small leak, often a worn cap seal or a small crack.',
      ],
    ],
    sources: [
      { label: 'RepairPal: P0455 OBD-II trouble code', url: 'https://repairpal.com/obd-ii-code-p0455' },
      {
        label: 'US EPA: Performing onboard diagnostic system checks as part of a vehicle inspection and maintenance program (EPA420-R-01-015)',
        url: 'https://nepis.epa.gov/Exe/ZyPDF.cgi?Dockey=P1002KRN.pdf',
      },
    ],
    reviewed: '2026-11-20',
  },
  {
    code: 'P0442',
    title: 'Evaporative Emission System Leak Detected (Small Leak)',
    shortName: 'EVAP small leak',
    seoTitle: 'P0442 Code: EVAP Small Leak Causes and Fixes',
    description:
      'P0442 means the fuel vapor (EVAP) system found a small leak. The usual causes, from the gas cap to cracked hoses, whether it is safe to drive and what to check.',
    system: 'Evaporative emission (EVAP) control',
    summary:
      "Your car's fuel vapor system, which traps gasoline fumes from the tank and burns them in the engine, held vacuum during its self-test but lost it a little too fast. That points to a small leak: a worn gas cap seal, a hairline crack in a hose or a tired O-ring.",
    howItSets:
      'After the car has sat for several hours (typically four to eight) and with the tank between about 15% and 85% full, the engine computer seals the system and pulls a vacuum on it, using engine vacuum or a leak detection pump. It then times how fast the vacuum fades. If it fades faster than allowed on two tests in a row, it stores P0442. Most modern systems fail with a hole as small as about 0.020 inch (half a millimeter).',
    symptoms: [
      'Check engine light',
      'Usually nothing else: the car drives normally',
      'Sometimes a faint smell of gasoline near the car',
    ],
    causes: [
      'A worn, damaged or wrong gas cap, or a hardened seal on it',
      'A small tear or crack in an EVAP hose',
      'Loose or worn clamps, or hardened O-rings, anywhere in the EVAP system',
      'A small split in a seam of the charcoal canister',
      'A purge valve or canister vent valve that does not seal fully',
      'A leaking seal or gasket on the fuel pump or fuel level sender at the top of the tank',
      'A damaged fuel filler neck',
      'A faulty leak detection pump or fuel tank pressure sensor',
    ],
    misdiagnoses: [
      "The gas cap: a common cause, but if a new cap doesn't stop the code, the leak is somewhere else",
      'The purge valve and the vent valve: often replaced without a smoke test proving they leak',
    ],
    drive: {
      verdict: 'go',
      text:
        "Generally safe to drive: it doesn't affect how the car runs. Get it fixed reasonably soon, though: fuel vapor is escaping, the car will likely fail an emissions inspection while the light is on, and the light can hide a new, more serious problem.",
    },
    checks: [
      "Check the gas cap: tighten it until it clicks and look at its rubber seal for cracks or flattening. A cap that's damaged or not the correct part is worth replacing first.",
      'Clear the code (or let it clear) and drive normally for several days: the leak test only runs under certain conditions, so it can take a while to see if the code returns.',
      'Look over the hoses you can see near the tank, canister and filler neck for cracks and loose clamps.',
      'If the code comes back, ask a shop for an EVAP smoke test. Small leaks are hard to find by eye, and the smoke shows exactly where vapor escapes.',
      'Ask the dealer whether there is a service bulletin for P0442 on your model: some vehicles have known canister, valve or seal problems.',
    ],
    costDrivers: [
      'The cause: a gas cap is a cheap part you can fit yourself; a canister, valve or tank seal costs more.',
      'Diagnosis time: tiny leaks can take a smoke test and some searching to find.',
      'Access: valves and the canister often sit under the car near the tank, and tank-top seals may need the tank lowered.',
    ],
    related: [
      { code: 'P0455', note: 'EVAP system large leak' },
      { code: 'P0456', note: 'EVAP system very small leak' },
      { code: 'P0457', note: 'EVAP leak detected: fuel cap loose or off' },
      { code: 'P0441', note: 'EVAP system incorrect purge flow' },
    ],
    faqs: [
      [
        'Can a loose gas cap cause P0442?',
        'Yes. A loose cap or one with a worn seal is one of the most common causes. Tighten or replace it, then give the car several days of normal driving so the self-test can run again.',
      ],
      [
        'How long does it take P0442 to clear after the fix?',
        "The light goes off only once the EVAP self-test runs and passes, which needs particular conditions (such as the car sitting for hours and a partly full tank). That can take several days of normal driving.",
      ],
      [
        'Can I pass emissions with a P0442 code?',
        "Usually not in areas with OBD-II inspection: under EPA guidance for state programs, a lit check engine light is a fail. Fix the cause, then drive normally (EPA suggests about a week) so the readiness monitors can complete before the test. Rules vary by state, so check yours.",
      ],
      [
        "What's the difference between P0442 and P0455?",
        'Both mean the EVAP system failed its leak test. P0442 is a small leak, where the system holds vacuum but loses it too fast. P0455 is a large leak, where it cannot build vacuum at all, often a missing cap or a disconnected hose.',
      ],
    ],
    sources: [
      { label: 'RepairPal: P0442 OBD-II trouble code', url: 'https://repairpal.com/obd-ii-code-p0442' },
      {
        label: 'US EPA: Performing onboard diagnostic system checks as part of a vehicle inspection and maintenance program (EPA420-R-01-015)',
        url: 'https://nepis.epa.gov/Exe/ZyPDF.cgi?Dockey=P1002KRN.pdf',
      },
    ],
    reviewed: '2026-11-21',
  },
];

export const codePage = (code: string) => CODE_PAGES.find((p) => p.code.toLowerCase() === code.toLowerCase());
