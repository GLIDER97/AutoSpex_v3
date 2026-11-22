import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FactList, HeaderWithImage, Panel, focusRing } from './tool/kit';

const FEEDBACK_URL = 'https://forms.gle/XtuvETokH5R83r1q7';
const UPDATED = 'November 22, 2026';

const linkClass = cn('font-semibold text-foreground underline underline-offset-4', focusRing);

/**
 * Shared layout for the about, policy and contact pages: one readable column in the site's type scale, with the
 * page's studio photo beside the header where it has one (data/pageImages.ts).
 */
function ContentPage({ title, intro, updated, children }: { title: string; intro?: React.ReactNode; updated?: string; children: React.ReactNode }) {
  const { pathname } = useLocation();
  return (
    <article className="w-full max-w-6xl">
      <HeaderWithImage path={pathname} className="mb-10">
        <h1 className="font-heading text-[2.25rem] leading-[1.08] font-extrabold tracking-[-0.02em] text-balance sm:text-5xl">{title}</h1>
        {intro && <p className="mt-4 max-w-[62ch] text-lg leading-relaxed text-muted-foreground">{intro}</p>}
        {updated && <p className="mt-3 text-sm text-muted-foreground">Last updated {updated}</p>}
      </HeaderWithImage>
      <div className="max-w-3xl space-y-10 text-[1.0625rem] leading-relaxed [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:tracking-[-0.01em] [&_li]:mt-1.5 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </article>
  );
}

const ExternalA = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className={cn(linkClass, 'inline-flex items-center gap-1')}>
    {children}
    <ExternalLink className="size-3.5" aria-hidden="true" />
    <span className="sr-only">(opens in a new tab)</span>
  </a>
);

export const AboutUs: React.FC = () => (
  <ContentPage
    title="About MyAutoSpex"
    intro="Free tools that explain car problems and car costs in plain English, so you can walk into a shop, a dealer or an insurer knowing what's fair."
  >
    <section>
      <h2>What we do</h2>
      <p>
        MyAutoSpex has 14 free tools for US drivers: decode a check engine code, check a repair quote, look up recalls and VIN details,
        and work out what a car really costs to insure, fuel and own. No account is needed, and we don't ask for your name, email or phone
        number.
      </p>
    </section>

    <section>
      <h2>Where the answers come from</h2>
      <Panel className="mt-4">
        <FactList
          items={[
            ['Recalls, VIN details, complaints', 'NHTSA (U.S. government)'],
            ['Fuel economy', 'EPA ratings via fueleconomy.gov'],
            ['Check engine code titles', 'SAE J2012 standard definitions'],
            ['Causes, prices and explanations', "AI estimates (Anthropic's Claude)"],
            ['Loan, ownership and fuel math', 'Standard formulas, shown on each tool'],
          ]}
        />
      </Panel>
      <p>
        Government data is shown as published. Anything written by AI is labeled as an estimate: use it to prepare for a conversation with a
        shop or insurer, not as a quote.
      </p>
    </section>

    <section>
      <h2>Independent, and how we're funded</h2>
      <p>
        MyAutoSpex isn't owned by a carmaker, dealer, insurer or repair chain, and nobody pays to change what a tool says. Some pages link to
        products on Amazon; when you buy through those links we may earn a small commission at no cost to you, and every such link is
        labeled. We don't sell or share personal details, because we don't collect them.
      </p>
    </section>

    <section>
      <h2>Our guides</h2>
      <p>
        Articles are published by the MyAutoSpex Editorial Team with help from AI tools, and reviewed before they go live. Read our{' '}
        <Link to="/editorial-policy" className={linkClass}>
          editorial policy
        </Link>{' '}
        for how they're written and corrected.
      </p>
    </section>

    <section>
      <h2>Tell us what to fix</h2>
      <p>
        Found a mistake, or want a tool we don't have yet? <ExternalA href={FEEDBACK_URL}>Send us feedback</ExternalA>.
      </p>
    </section>
  </ContentPage>
);

export const EditorialPolicy: React.FC = () => (
  <ContentPage title="Editorial policy" intro="Who writes the guides on MyAutoSpex, how they're made and how to tell us when something is wrong.">
    <section>
      <h2>Who writes our guides</h2>
      <p>
        Our guides are published by the MyAutoSpex Editorial Team. We use AI tools, including Anthropic&apos;s Claude, to help research and
        draft articles, and our team reviews and edits each article before it is published.
      </p>
    </section>
    <section>
      <h2>Prices, figures and sources</h2>
      <p>
        Repair costs, insurance premiums and depreciation vary by region, vehicle and shop, so the figures in our guides are estimates, not
        quotes. When we cite a specific figure we link to where it comes from, such as NHTSA, the EPA or published pricing data, and we are
        adding source links to our older articles.
      </p>
    </section>
    <section>
      <h2>General information, not a diagnosis</h2>
      <p>
        Our guides and tools explain what a code, a warning light or a quote usually means. They can&apos;t inspect your car. For anything
        that affects safety, such as brakes, steering or a flashing check engine light, have a qualified mechanic look at it.
      </p>
    </section>
    <section>
      <h2>Affiliate links</h2>
      <p>
        Some guides and tools link to products on Amazon. We may earn a commission on purchases through those links. It never decides what
        we write, and the links are always labeled.
      </p>
    </section>
    <section>
      <h2>Updates and corrections</h2>
      <p>
        Each article shows the date it was last updated. If you spot a mistake, please tell us through our{' '}
        <Link to="/contact" className={linkClass}>
          contact page
        </Link>{' '}
        and we will correct it.
      </p>
    </section>
  </ContentPage>
);

export const PrivacyPolicy: React.FC = () => (
  <ContentPage title="Privacy policy" updated={UPDATED} intro="MyAutoSpex doesn't have accounts and doesn't ask for your name, email or phone number. Here is everything else.">
    <section>
      <h2>What you enter into the tools</h2>
      <p>
        Codes, vehicle details, ZIP codes, quote lines and photos you enter are used to answer your request. When a tool uses AI, what you
        entered is sent to our AI providers (OpenRouter, which routes the request to Anthropic or another model provider) to produce the
        answer. Photos are used for that one answer; we don&apos;t store them or your other inputs on our servers, with one exception below.
      </p>
      <p>
        <strong>Wrap Designer previews made without a photo.</strong> When you draw a wrap from a year, make and model (no photo), we keep that
        picture with the vehicle name and the options you chose, and it may be published in our public{' '}
        <a href="/wrap-gallery">wrap gallery</a> after we check it. Nothing about you is kept with it. We also count which wrap options
        people choose (for example how many chose matte black), without any personal data. Photos you upload are never kept or published.
      </p>
      <p>
        Recall, VIN and fuel economy lookups go to U.S. government services (NHTSA and fueleconomy.gov). Shop searches send the ZIP code you
        enter to Google Places.
      </p>
    </section>
    <section>
      <h2>Usage limits</h2>
      <p>
        To stop abuse of the free AI tools, we count how many requests come from each visitor per day. Visitors are identified only by a
        one-way scrambled (salted hash) form of their IP address, which can&apos;t be turned back into the address, and the counts are deleted
        after 30 days.
      </p>
    </section>
    <section>
      <h2>Analytics</h2>
      <p>
        We use Google Tag Manager to load analytics tools, including Microsoft Clarity, that show us how pages are used (for example which
        tools are popular and where pages are confusing). These tools may set cookies and collect your IP address, browser and device
        details under their own privacy policies. We use the results only to improve the site.
      </p>
    </section>
    <section>
      <h2>Stored on your device</h2>
      <p>
        Your browser keeps a few settings so you don&apos;t have to re-enter them: the light or dark theme, your ZIP code and your recent code
        lookups. They stay on your device and you can clear them in your browser settings at any time.
      </p>
    </section>
    <section>
      <h2>Links to other sites</h2>
      <p>
        Some links go to other sites, such as Amazon, Carvana, Upside or NHTSA. Their own privacy policies apply once you&apos;re there.
      </p>
    </section>
    <section>
      <h2>Children</h2>
      <p>MyAutoSpex is meant for adults and isn&apos;t directed at children under 13.</p>
    </section>
    <section>
      <h2>Questions</h2>
      <p>
        Ask us anything about privacy through our <ExternalA href={FEEDBACK_URL}>feedback form</ExternalA>.
      </p>
    </section>
  </ContentPage>
);

export const TermsOfService: React.FC = () => (
  <ContentPage title="Terms of service" updated={UPDATED}>
    <section>
      <h2>Information, not professional advice</h2>
      <p>
        MyAutoSpex explains car problems and costs for general information. Many answers are estimates, and some are written by AI and can be
        wrong. <strong>Have a qualified mechanic confirm a diagnosis before you pay for a repair</strong>, and get real quotes before you buy
        insurance, a car or a repair.
      </p>
    </section>
    <section>
      <h2>Your responsibility</h2>
      <p>
        You decide what to do with the information here. MyAutoSpex isn&apos;t liable for vehicle damage, injury or financial loss resulting from
        decisions made using the site, to the extent the law allows.
      </p>
    </section>
    <section>
      <h2>Fair use</h2>
      <p>
        The tools are free for personal use. Please don&apos;t use automated scripts to send requests, try to get around usage limits, or use the
        tools for anything other than their purpose. We may block traffic that does.
      </p>
    </section>
    <section>
      <h2>Affiliate links and other sites</h2>
      <p>
        Some links are affiliate links, labeled as such, and some go to other companies&apos; sites. Those companies, not MyAutoSpex, are
        responsible for their products, prices and offers.
      </p>
    </section>
    <section>
      <h2>Changes</h2>
      <p>We may update these terms. The date at the top shows when they last changed.</p>
    </section>
  </ContentPage>
);

export const CookiePolicy: React.FC = () => (
  <ContentPage title="Cookie policy" updated={UPDATED}>
    <section>
      <h2>Cookies we set</h2>
      <p>
        MyAutoSpex itself doesn&apos;t set cookies. Your browser&apos;s local storage keeps your theme, ZIP code and recent code lookups on your
        device.
      </p>
    </section>
    <section>
      <h2>Analytics cookies</h2>
      <p>
        The analytics tools we load through Google Tag Manager, including Microsoft Clarity, may set their own cookies to tell visits apart and
        measure how pages are used.
      </p>
    </section>
    <section>
      <h2>Your choices</h2>
      <p>
        You can block or delete cookies and site data in your browser settings. The tools keep working; you&apos;ll just need to re-enter
        saved settings.
      </p>
    </section>
  </ContentPage>
);

export const ContactUs: React.FC = () => (
  <ContentPage title="Contact us" intro="Questions, corrections, ideas for new tools or a problem with a result: we'd like to hear it.">
    <Panel>
      <h2 className="font-heading text-xl font-extrabold">Send us a message</h2>
      <p className="mt-1 text-muted-foreground">
        Our feedback form is the fastest way to reach us. If something on a page looks wrong, include the page address and what you entered.
      </p>
      <a
        href={FEEDBACK_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={cn('mt-4 inline-flex h-11 items-center gap-2 rounded-lg bg-sign-green px-5 font-bold text-white hover:bg-sign-green-strong', focusRing)}
      >
        Open the feedback form <ExternalLink className="size-4" aria-hidden="true" />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </Panel>
    <section>
      <h2>Before you write</h2>
      <ul>
        <li>
          For a recall on your car, call any franchised dealer for your brand: recall repairs are free. NHTSA&apos;s{' '}
          <ExternalA href="https://www.nhtsa.gov/recalls">recall lookup</ExternalA> checks your VIN.
        </li>
        <li>We can&apos;t diagnose a specific car or give quotes. A local shop can, and our tools help you check what they tell you.</li>
      </ul>
    </section>
  </ContentPage>
);
