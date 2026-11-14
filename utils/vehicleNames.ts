// Matches what a user types ("chevy", "f150", "civic") to the exact make and
// model names a government vehicle database uses ("CHEVROLET", "F-150",
// "CIVIC SEDAN"). Those APIs only answer for exact names.

export const normalizeName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

const MAKE_ALIASES: Record<string, string> = {
  chevy: 'chevrolet',
  vw: 'volkswagen',
  mercedes: 'mercedesbenz',
  benz: 'mercedesbenz',
  alfa: 'alfaromeo',
};

/**
 * Returns the names that match the input: an exact match (ignoring case, spaces
 * and punctuation) first, then names that start with the input, shortest first.
 * If neither exists, names that contain the input.
 */
export function matchNames(input: string, names: string[], max: number): string[] {
  const wanted = normalizeName(input);
  if (!wanted) return [];
  const unique = [...new Set(names)];
  const exact = unique.filter((name) => normalizeName(name) === wanted);
  const prefix = unique
    .filter((name) => normalizeName(name) !== wanted && normalizeName(name).startsWith(wanted))
    .sort((a, b) => a.length - b.length);
  if (exact.length || prefix.length) return [...exact, ...prefix].slice(0, max);
  // Last resort: names that contain the input ("cherokee" -> "GRAND CHEROKEE").
  if (wanted.length < 3) return [];
  return unique
    .filter((name) => normalizeName(name).includes(wanted))
    .sort((a, b) => a.length - b.length)
    .slice(0, max);
}

/** Finds the database's name for a make, accepting common nicknames like "Chevy". */
export function matchMake(input: string, makes: string[]): string | null {
  const alias = MAKE_ALIASES[normalizeName(input)];
  return matchNames(alias ?? input, makes, 1)[0] ?? null;
}
