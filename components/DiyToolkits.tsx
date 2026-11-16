import React from 'react';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductPicks, type ProductPick } from './tool/ProductPicks';
import { Faq, ToolPage, focusRing } from './tool/kit';

const ROADSIDE: ProductPick[] = [
  {
    name: 'NOCO Boost Plus GB40 jump starter',
    use: 'Starts a dead battery on your own, without a second car. Keep it charged every few months.',
    url: 'https://www.amazon.com/s?k=NOCO+Boost+Plus+GB40',
  },
  {
    name: 'Heavy-duty jumper cables, 4 gauge, 20 ft',
    use: 'The low-tech backup to a jump starter. Long enough to reach from any parking angle.',
    url: 'https://www.amazon.com/s?k=Heavy+Duty+Jumper+Cables+4+gauge+20+ft',
  },
  {
    name: 'EPAuto 12V portable tire inflator',
    use: 'Re-inflate a slow leak enough to reach a tire shop, and top up pressure at home.',
    url: 'https://www.amazon.com/s?k=EPAuto+12V+Portable+Air+Compressor',
  },
  {
    name: 'resqme car escape tool',
    use: 'A seatbelt cutter and window breaker on your keychain, for the emergency you hope never happens.',
    url: 'https://www.amazon.com/s?k=resqme+Car+Escape+Tool',
  },
  {
    name: 'Roadside first aid kit',
    use: 'Bandages, wipes and basics for cuts and scrapes. Check the contents once a year.',
    url: 'https://www.amazon.com/s?k=car+first+aid+kit',
  },
  {
    name: 'ThruNite Archer 2A flashlight',
    use: 'A bright, AA-powered light for changing a tire or checking under the hood at night.',
    url: 'https://www.amazon.com/s?k=ThruNite+Archer+2A+V3',
  },
];

const HOME: ProductPick[] = [
  {
    name: 'ANCEL AD310 OBD-II scanner',
    use: 'Reads and clears check engine codes on any 1996-or-newer car, so you know the problem before the shop does.',
    url: 'https://Autospex.short.gy/diGnAb',
  },
  {
    name: 'BlueDriver Bluetooth Pro scan tool',
    use: 'Plugs in under the dash and shows codes, live sensor data and readiness checks on your phone.',
    url: 'https://www.amazon.com/s?k=BlueDriver+Bluetooth+Pro+OBDII',
  },
  {
    name: 'AstroAI digital tire pressure gauge',
    use: 'Check all four tires monthly. Correct pressure improves grip, tire life and fuel economy.',
    url: 'https://www.amazon.com/s?k=AstroAI+Digital+Tire+Pressure+Gauge',
  },
  {
    name: 'DEWALT 1/4" and 3/8" drive mechanics tool set',
    use: 'Sockets, ratchets and hex keys for battery terminals, wiper arms, sensors and other basic jobs.',
    url: 'https://www.amazon.com/s?k=DEWALT+Mechanics+Tool+Set',
  },
  {
    name: 'Gorilla Grip work gloves',
    use: 'Keep your grip and your hands clean while you work under the hood.',
    url: 'https://www.amazon.com/s?k=Gorilla+Grip+Work+Gloves',
  },
];

const FAQS: [string, React.ReactNode][] = [
  [
    'What should every driver keep in the car?',
    'A way to start a dead battery (a jump starter or cables), a way to deal with a low tire (an inflator, plus a working spare or repair kit), a flashlight, a first aid kit and a phone charger. Add an ice scraper and blanket in winter.',
  ],
  [
    'Is a cheap OBD-II scanner good enough?',
    'For reading and clearing check engine codes, yes: any scanner works on 1996-or-newer US cars. Pricier tools add live data, ABS and airbag codes, and bidirectional tests that matter more to serious DIYers.',
  ],
  [
    'How are these picked?',
    "For usefulness to an everyday driver, not for commission. We don't accept payment for placement. Product names and links can change, so check current reviews and the seller before you buy.",
  ],
];

const DiyToolkits: React.FC = () => (
  <ToolPage
    category="services"
    title="DIY tools"
    intro="The roadside gear worth keeping in your car, and the basic tools that let you handle simple checks and fixes at home."
  >
    <ProductPicks id="roadside" title="Roadside kit" intro="What helps most when something goes wrong away from home." items={ROADSIDE} className="mt-0" />
    <ProductPicks id="home" title="Home garage basics" intro="Enough to read codes, check tires and do simple jobs yourself." items={HOME} />
    <a
      href="https://Autospex.short.gy/Z9WMx3"
      target="_blank"
      rel="sponsored noopener noreferrer"
      className={cn('mt-6 inline-flex items-center gap-1.5 font-semibold underline underline-offset-4', focusRing)}
    >
      Browse more car tools on Amazon <ExternalLink className="size-4" aria-hidden="true" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
    <Faq id="diy-faq" title="Questions about car tools" items={FAQS} />
  </ToolPage>
);

export default DiyToolkits;
