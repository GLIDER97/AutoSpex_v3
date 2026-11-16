// Questions and answers under the check engine code lookup.
import React from 'react';
import { Faq } from './tool/kit';

const FAQS: [string, React.ReactNode][] = [
  [
    'What is an OBD-II code?',
    "A standard code (like P0300) that your car's computer stores when it detects a fault in the engine, transmission, emissions or other systems. Every car sold in the US since 1996 uses them.",
  ],
  [
    'What do the letters and numbers in a code mean?',
    'The first letter shows the system: P for powertrain (engine and transmission), B for body, C for chassis and U for the communication network. A 0 as the second character means a generic code shared by all makes, and a 1 usually means a manufacturer-specific code. The last three characters point to the specific fault, so P0420 is a generic powertrain code for catalytic converter efficiency.',
  ],
  [
    "How do I find my car's fault code?",
    "Plug an OBD-II scanner into the diagnostic port, usually under the dashboard on the driver's side. Many auto parts stores will also read codes for free.",
  ],
  [
    'How accurate are the repair cost estimates?',
    "They're AI estimates of typical US parts prices and book labor hours, not quotes. Costs vary with your car, your area and the shop, so use them to judge whether a quote is in a sensible range.",
  ],
  [
    'Can I drive with the check engine light on?',
    "A steady light usually means a problem to fix soon. A flashing light means a severe misfire that can damage the catalytic converter: slow down and get it checked right away. Each result shows whether it's safe to drive.",
  ],
  ['Is this tool free?', 'Yes, with no account and no limit on normal use.'],
];

const FAQSection: React.FC = () => <Faq id="decoder-faq" title="Questions about check engine codes" items={FAQS} className="mt-0" />;

export default FAQSection;
