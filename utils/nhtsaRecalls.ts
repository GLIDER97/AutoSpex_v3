// Vehicle safety recalls from NHTSA's public recalls API (api.nhtsa.gov).
// It is free, needs no API key and accepts requests from the browser.
import { nhtsaDate, nhtsaResults, resolveVehicle } from './nhtsa';

export interface Recall {
  campaignNumber: string;
  modelYear: string;
  make: string;
  model: string;
  component: string;
  summary: string;
  consequence: string;
  remedy: string;
  /** Date NHTSA received the recall report, as YYYY-MM-DD. */
  reportDate: string;
  /** NHTSA advises owners not to drive the vehicle until it is repaired. */
  parkIt: boolean;
  /** NHTSA advises owners to park outside, away from structures (fire risk). */
  parkOutside: boolean;
}

interface NhtsaRecall {
  NHTSACampaignNumber: string;
  ModelYear: string;
  Make: string;
  Model: string;
  Component: string;
  Summary: string;
  Consequence: string;
  Remedy: string;
  ReportReceivedDate: string; // DD/MM/YYYY
  parkIt: boolean;
  parkOutSide: boolean;
}

function toRecall(r: NhtsaRecall): Recall {
  return {
    campaignNumber: r.NHTSACampaignNumber,
    modelYear: r.ModelYear,
    make: r.Make,
    model: r.Model,
    component: r.Component ?? '',
    summary: r.Summary ?? '',
    consequence: r.Consequence ?? '',
    remedy: r.Remedy ?? '',
    reportDate: nhtsaDate(r.ReportReceivedDate, 'dmy'),
    parkIt: Boolean(r.parkIt),
    parkOutside: Boolean(r.parkOutSide),
  };
}

/** Newest first, one entry per campaign. */
function newestFirst(recalls: Recall[]): Recall[] {
  const seen = new Set<string>();
  return [...recalls]
    .sort((a, b) => b.reportDate.localeCompare(a.reportDate))
    .filter((r) => !seen.has(r.campaignNumber) && seen.add(r.campaignNumber));
}

export async function recallsFor(make: string, model: string, year: number): Promise<Recall[]> {
  const q = new URLSearchParams({ make, model, modelYear: String(year) });
  const results = await nhtsaResults<NhtsaRecall>(`/recalls/recallsByVehicle?${q}`);
  return results.map(toRecall);
}

export interface RecallSearch {
  /** NHTSA's name for the make, or null if NHTSA has no recalls for it that year. */
  make: string | null;
  /** NHTSA model names that matched (e.g. "civic" matches CIVIC SEDAN and CIVIC HATCHBACK). */
  models: string[];
  recalls: Recall[];
}

/** Recalls for a year/make/model as the user typed them, newest first. */
export async function searchRecalls(year: number, make: string, model: string): Promise<RecallSearch> {
  const vehicle = await resolveVehicle(year, make, model, 'r');
  if (!vehicle.make) return { make: null, models: [], recalls: [] };
  const lists = await Promise.all(vehicle.models.map((m) => recallsFor(vehicle.make!, m, year)));
  return { make: vehicle.make, models: vehicle.models, recalls: newestFirst(lists.flat()) };
}

// Best-selling US vehicles, by their exact NHTSA names.
const FEATURED_VEHICLES: [make: string, model: string][] = [
  ['FORD', 'F-150'],
  ['CHEVROLET', 'SILVERADO 1500'],
  ['RAM', '1500'],
  ['TOYOTA', 'RAV4'],
  ['TESLA', 'MODEL Y'],
  ['FORD', 'EXPLORER'],
];

/** The newest recall for each featured vehicle (this and last model year), newest first. */
export async function latestFeaturedRecalls(): Promise<Recall[]> {
  const thisYear = new Date().getFullYear();
  const perVehicle = await Promise.allSettled(
    FEATURED_VEHICLES.map(async ([make, model]) => {
      const lists = await Promise.all([thisYear, thisYear - 1].map((year) => recallsFor(make, model, year)));
      return newestFirst(lists.flat())[0];
    }),
  );
  if (perVehicle.every((r) => r.status === 'rejected')) throw new Error('NHTSA is unavailable');
  return newestFirst(
    perVehicle.flatMap((r) => (r.status === 'fulfilled' && r.value ? [r.value] : [])),
  );
}
