// Official EPA fuel economy ratings from the fueleconomy.gov web services
// (U.S. Department of Energy and EPA). Free, no API key, and it accepts
// requests from the browser.
import { matchMake, matchNames } from './vehicleNames';

const API = 'https://www.fueleconomy.gov/ws/rest';

/** One EPA-rated version of a model, e.g. "Civic 4Dr" with "Auto (AV), 4 cyl, 2.0 L". */
export interface EpaVariant {
  id: string;
  model: string;
  description: string;
}

export interface EpaRating {
  city: number;
  hwy: number;
  combined: number;
  fuelType: string;
}

interface MenuItem {
  text: string;
  value: string;
}

async function getJson(path: string): Promise<any> {
  // The service occasionally answers 500; one retry usually succeeds.
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${API}${path}`, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const text = await res.text();
      return text && text !== 'null' ? JSON.parse(text) : null;
    }
    if (res.status < 500 || attempt >= 1) throw new Error(`fueleconomy.gov request failed (HTTP ${res.status})`);
  }
}

// Lists come back as an array, a single object when there is one item, or null when there are none.
function menuItems(body: any): MenuItem[] {
  const items = body?.menuItem;
  if (!items) return [];
  return Array.isArray(items) ? items : [items];
}

/** EPA-rated versions that match a year/make/model as the user typed them. */
export async function findEpaVariants(
  year: number,
  make: string,
  model: string,
): Promise<{ make: string | null; variants: EpaVariant[] }> {
  const makes = menuItems(await getJson(`/vehicle/menu/make?year=${year}`)).map((m) => m.value);
  const epaMake = matchMake(make, makes);
  if (!epaMake) return { make: null, variants: [] };

  const models = menuItems(
    await getJson(`/vehicle/menu/model?${new URLSearchParams({ year: String(year), make: epaMake })}`),
  ).map((m) => m.value);
  const matched = matchNames(model, models, 6);

  const perModel = await Promise.all(
    matched.map(async (epaModel) => {
      const q = new URLSearchParams({ year: String(year), make: epaMake, model: epaModel });
      return menuItems(await getJson(`/vehicle/menu/options?${q}`)).map((option) => ({
        id: option.value,
        model: epaModel,
        description: option.text,
      }));
    }),
  );
  return { make: epaMake, variants: perModel.flat() };
}

/** Makes with EPA ratings for a model year (for input suggestions). */
export async function listEpaMakes(year: number): Promise<string[]> {
  return menuItems(await getJson(`/vehicle/menu/make?year=${year}`)).map((m) => m.value);
}

/** Models with EPA ratings for a year and make (for input suggestions). */
export async function listEpaModels(year: number, make: string): Promise<string[]> {
  return menuItems(await getJson(`/vehicle/menu/model?${new URLSearchParams({ year: String(year), make })}`)).map((m) => m.value);
}

export async function getEpaRating(id: string): Promise<EpaRating> {
  const vehicle = await getJson(`/vehicle/${encodeURIComponent(id)}`);
  const rating = {
    city: Number(vehicle?.city08),
    hwy: Number(vehicle?.highway08),
    combined: Number(vehicle?.comb08),
    fuelType: String(vehicle?.fuelType1 ?? vehicle?.fuelType ?? ''),
  };
  if (!(rating.combined > 0)) throw new Error(`No EPA rating for vehicle ${id}`);
  return rating;
}
