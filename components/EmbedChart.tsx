// /embed/chart/:id — one chart, its source and a credit link, made to sit in an iframe on other sites
// (docs/PUBLISHING-STANDARD.md section 4, "Embed this chart"). Rendered without the site header and footer
// (App.tsx), never indexed (canonical points to the page the chart comes from), and the only path
// other sites may frame (vercel.json). Add a chart by adding an entry to EMBEDS.
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { SITE_URL } from '../seo/site';
import { num } from '../data/vehicles';
import { STUDY_AS_OF, STUDY_ROWS, STUDY_YEARS, SUV_STUDY_PATH, modelName, rowName, studyFacts } from '../data/studies';
import { type EmbedId } from '../data/embedIds';
import NotFound from './NotFound';
import { BarList, Heatmap, MeterList } from './tool/charts';

export interface EmbedDef {
  /** States the takeaway. */
  title: string;
  /** Page the chart comes from (the credit link and the canonical URL). */
  page: string;
  pageTitle: string;
  source: string;
  asOf: string;
  /** Suggested iframe height in px. */
  height: number;
  render: () => React.ReactNode;
}

const STUDY_CREDIT = 'MyAutoSpex analysis of NHTSA owner complaint data';

export const EMBEDS: Record<EmbedId, EmbedDef> = {
  'suv-complaints-top-model-years': {
    get title() {
      const top = studyFacts().byModelYear[0];
      return top ? `The ${rowName(top)} has the most owner complaints of 160 popular SUV model-years` : 'SUV model-years with the most owner complaints';
    },
    page: SUV_STUDY_PATH,
    pageTitle: STUDY_CREDIT,
    source: 'NHTSA complaints API',
    asOf: STUDY_AS_OF,
    height: 560,
    render: () => <BarList items={studyFacts().byModelYear.slice(0, 12).map((r) => ({ label: rowName(r), value: r.complaints }))} format={num} />,
  },
  'suv-complaints-heatmap': {
    title: `Owner complaints by model and model-year, ${STUDY_YEARS[0]}–${STUDY_YEARS[STUDY_YEARS.length - 1]}: problem years stand out`,
    page: SUV_STUDY_PATH,
    pageTitle: STUDY_CREDIT,
    source: 'NHTSA complaints API',
    asOf: STUDY_AS_OF,
    height: 900,
    render: () => {
      const f = studyFacts();
      return (
        <Heatmap
          title="Owner complaints per model and model-year"
          rows={f.byModel.map((m) => m.name)}
          columns={STUDY_YEARS}
          steps={[100, 250, 500, 1000]}
          value={(row, col) => STUDY_ROWS.find((x) => modelName(x) === row && x.year === col)?.complaints ?? null}
        />
      );
    },
  },
  'suv-complaints-problem-areas': {
    get title() {
      const f = studyFacts();
      const top = f.topComponents[0];
      return top ? `${Math.round((top.count / f.total) * 100)}% of SUV owner complaints name the ${top.name.toLowerCase()}` : 'What SUV owners complain about';
    },
    page: SUV_STUDY_PATH,
    pageTitle: STUDY_CREDIT,
    source: 'NHTSA complaints API',
    asOf: STUDY_AS_OF,
    height: 620,
    render: () => {
      const f = studyFacts();
      return <MeterList items={f.topComponents.slice(0, 8).map((c) => ({ label: c.name, value: c.count }))} total={f.total} />;
    },
  },
};


const EmbedChart: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const e = (EMBEDS as Record<string, EmbedDef | undefined>)[id];
  // Follow the embedding visitor's light or dark setting (?theme=dark|light overrides it).
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('theme');
    const dark = t ? t === 'dark' : window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', Boolean(dark));
  }, []);
  if (!e) return <NotFound />;
  const asOf = e.asOf ? new Date(`${e.asOf}T00:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : '';
  return (
    <figure className="mx-auto w-full max-w-3xl" aria-labelledby="embed-title">
      <h1 id="embed-title" className="mb-4 font-heading text-lg leading-snug font-extrabold">
        {e.title}
      </h1>
      {e.render()}
      <p className="mt-4 text-xs text-muted-foreground">
        Source: {e.source}, data as of {asOf}. Chart:{' '}
        <a href={`${SITE_URL}${e.page}`} target="_blank" rel="noopener" className="font-semibold text-foreground underline underline-offset-4">
          {e.pageTitle}
        </a>
      </p>
    </figure>
  );
};

export default EmbedChart;
