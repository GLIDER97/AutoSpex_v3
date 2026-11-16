// OBD-II scanners suggested under a decoded check engine code.
import React from 'react';
import { ProductPicks } from './tool/ProductPicks';

const SCANNERS = [
  {
    name: 'ANCEL AD310 OBD-II scanner',
    use: 'A simple handheld code reader: plug it in, read and clear check engine codes. No phone or app needed.',
    url: 'https://Autospex.short.gy/diGnAb',
  },
  {
    name: 'MOTOPOWER MP69033 OBD-II scanner',
    use: 'A budget handheld code reader for reading and clearing check engine codes and checking emissions readiness.',
    url: 'https://Autospex.short.gy/be8MeQ',
  },
  {
    name: 'VDIAGTOOL VD10 code reader',
    use: 'Another low-cost handheld reader for check engine codes on 1996-or-newer US cars.',
    url: 'https://Autospex.short.gy/WwUbod',
  },
];

const AffiliateSection: React.FC = () => (
  <ProductPicks
    id="scanners"
    title="Read codes yourself next time"
    intro="A basic scanner costs about the same as one shop diagnostic fee, and works on any 1996-or-newer car."
    items={SCANNERS}
    className="mt-0"
  />
);

export default AffiliateSection;
