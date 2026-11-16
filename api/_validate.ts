// Field validators for the AI tools (api/_tools.ts). Every value a page sends
// is checked here: known keys only, fixed choices from lists, numbers in
// range and short, single-line text. Nothing a visitor sends is used as a
// prompt; the prompts are written on the server from these fields.
//
// Pure functions with no server-only imports, so pages can use the same
// cleaners (cleanName, cleanLine) before sending.
import { BadRequest, isPlainObject, onlyKeys } from './_shared.js';

/** Letters, digits, spaces and the punctuation found in vehicle and trim names ("F-150", "Mercedes-Benz", "C300 4MATIC"). */
const NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} .,'&/()+-]*$/u;
const NAME_STRIP = /[^\p{L}\p{N} .,'&/()+-]+/gu;
// Control characters (including newlines) and other invisible format characters.
const CONTROL = /[\p{Cc}\p{Cf}\u2028\u2029]/u;
const CONTROL_ALL = /[\p{Cc}\p{Cf}\u2028\u2029]+/gu;

/** Cleans a name the way the server expects it: allowed characters only, single spaces, at most `max` characters. */
export const cleanName = (value: string, max = 40) =>
  value.replace(NAME_STRIP, ' ').replace(/\s+/g, ' ').trim().replace(/^[^\p{L}\p{N}]+/u, '').slice(0, max).trim();

/** Cleans one line of text: no line breaks or control characters, single spaces, at most `max` characters. */
export const cleanLine = (value: string, max: number) => value.replace(CONTROL_ALL, ' ').replace(/\s+/g, ' ').trim().slice(0, max).trim();

/** Cleans a chat message: keeps line breaks, turns other control characters into spaces, at most `max` characters. */
export const cleanMessage = (value: string, max: number) =>
  value
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(CONTROL_ALL, ' '))
    .join('\n')
    .trim()
    .slice(0, max)
    .trim();

/** A JSON object with only the listed keys. */
export function object(value: unknown, label: string, allowed: string[]): Record<string, unknown> {
  if (!isPlainObject(value)) throw new BadRequest(`${label} must be an object`);
  onlyKeys(value, allowed, label);
  return value;
}

interface TextRules {
  max: number;
  optional?: boolean;
  pattern?: RegExp;
  /** Allows line breaks (chat messages only). */
  multiline?: boolean;
}

/** A string within the length limit, with no control characters. Optional fields may be missing or empty. */
export function text(value: unknown, label: string, rules: TextRules): string {
  if (value === undefined || value === null || value === '') {
    if (rules.optional) return '';
    throw new BadRequest(`${label} is required`);
  }
  if (typeof value !== 'string') throw new BadRequest(`${label} must be a string`);
  if (value.length > rules.max) throw new BadRequest(`${label} must be at most ${rules.max} characters`);
  const checked = rules.multiline ? value.replace(/\r?\n/g, ' ') : value;
  if (CONTROL.test(checked)) throw new BadRequest(`${label} must be a single line of text`);
  const trimmed = rules.multiline ? value.replace(/\r\n/g, '\n').trim() : value.replace(/\s+/g, ' ').trim();
  if (!trimmed) {
    if (rules.optional) return '';
    throw new BadRequest(`${label} is required`);
  }
  if (rules.pattern && !rules.pattern.test(trimmed)) throw new BadRequest(`${label} has characters that are not allowed`);
  return trimmed;
}

/** A vehicle make, model or trim name. */
export const name = (value: unknown, label: string, max: number, optional = false) =>
  text(value, label, { max, optional, pattern: NAME_PATTERN });

/** One of a fixed list of choices. */
export function oneOf<T extends string>(value: unknown, label: string, choices: readonly T[]): T {
  if (typeof value !== 'string' || !choices.includes(value as T)) throw new BadRequest(`${label} must be one of: ${choices.join(', ')}`);
  return value as T;
}

/** A finite number in range. */
export function number(value: unknown, label: string, min: number, max: number, integer = false): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) {
    throw new BadRequest(`${label} must be ${integer ? 'a whole number' : 'a number'} from ${min} to ${max}`);
  }
  return value;
}

/** An array with between min and max entries. */
export function list(value: unknown, label: string, min: number, max: number): unknown[] {
  if (!Array.isArray(value)) throw new BadRequest(`${label} must be a list`);
  if (value.length < min || value.length > max) throw new BadRequest(`${label} must have ${min}-${max} entries`);
  return value;
}

export const YEAR_PATTERN = /^(19|20)\d\d$/;
export const ZIP_PATTERN = /^\d{5}$/;

export const zip = (value: unknown, label: string) => text(value, label, { max: 5, optional: true, pattern: ZIP_PATTERN });

export interface VehicleName {
  year: string;
  make: string;
  model: string;
}

/** { year, make, model }: a 4-digit year (or empty when optional) and short names. */
export function vehicle(value: unknown, label: string, required: boolean): VehicleName {
  if (value === undefined && !required) return { year: '', make: '', model: '' };
  const v = object(value, label, ['year', 'make', 'model']);
  const result = {
    year: text(v.year, `${label}.year`, { max: 4, optional: !required, pattern: YEAR_PATTERN }),
    make: name(v.make, `${label}.make`, 40, !required),
    model: name(v.model, `${label}.model`, 60, !required),
  };
  return result;
}

/** "2019 Honda Civic", leaving out empty parts (the pages' vehicleLabel). */
export const vehicleLabel = (v: VehicleName) => [v.year, v.make, v.model].filter(Boolean).join(' ');

// Base64 JPEG from the pages (resized in the browser to at most 1600 px).
const MAX_PHOTO_BASE64 = 3_000_000;

/** A base64-encoded JPEG, PNG or WebP image (no data: prefix), checked by its leading bytes. */
export function photo(value: unknown, label: string): { mimeType: string; data: string } {
  if (typeof value !== 'string' || value.length < 100 || value.length > MAX_PHOTO_BASE64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
    throw new BadRequest(`${label} must be a base64 image under about 2 MB`);
  }
  const mimeType = value.startsWith('/9j/') ? 'image/jpeg' : value.startsWith('iVBOR') ? 'image/png' : value.startsWith('UklGR') ? 'image/webp' : null;
  if (!mimeType) throw new BadRequest(`${label} must be a JPEG, PNG or WebP image`);
  return { mimeType, data: value };
}
