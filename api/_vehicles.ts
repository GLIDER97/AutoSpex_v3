// Checks a year, make and model against NHTSA's vehicle database (vPIC, free,
// no key) so the wrap visualizer only draws cars by names NHTSA lists. Answers
// are cached per instance; when vPIC can't be reached the name is not used.

const VPIC = 'https://vpic.nhtsa.dot.gov/api/vehicles';
const MAKE_ALIASES: Record<string, string> = { chevy: 'chevrolet', vw: 'volkswagen', mercedes: 'mercedes-benz', benz: 'mercedes-benz', alfa: 'alfa romeo' };
const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

type Model = { make: string; model: string };
const cache = new Map<string, Promise<Model[]>>();

async function modelsFor(year: string, make: string): Promise<Model[]> {
  const res = await fetch(`${VPIC}/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`, {
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) throw new Error(`vPIC answered ${res.status}`);
  const body = await res.json();
  return (Array.isArray(body?.Results) ? body.Results : [])
    .filter((r: any) => typeof r?.Make_Name === 'string' && typeof r?.Model_Name === 'string')
    .map((r: any) => ({ make: r.Make_Name, model: r.Model_Name }));
}

/** "2019 Honda Civic" with NHTSA's model name, or '' when NHTSA doesn't list it. */
export async function verifyVehicle(v: { year: string; make: string; model: string }): Promise<string> {
  const make = MAKE_ALIASES[normalize(v.make)] ?? v.make;
  const key = `${v.year}|${normalize(make)}`;
  if (!cache.has(key)) {
    if (cache.size > 500) cache.clear();
    cache.set(key, modelsFor(v.year, make).catch((err) => {
      cache.delete(key);
      console.error('vehicles: vPIC lookup failed', err instanceof Error ? err.message : err);
      return [];
    }));
  }
  const wanted = normalize(v.model);
  const models = (await cache.get(key)!).filter((m) => normalize(m.make) === normalize(make));
  // An exact match, or the longest listed model the input starts with ("Civic Sport" -> "Civic").
  const match =
    models.find((m) => normalize(m.model) === wanted) ??
    models.filter((m) => normalize(m.model) && wanted.startsWith(normalize(m.model))).sort((a, b) => b.model.length - a.model.length)[0];
  if (!match) return '';
  const makeName = normalize(v.make) === normalize(match.make) ? v.make : match.make;
  return `${v.year} ${makeName} ${match.model}`;
}
