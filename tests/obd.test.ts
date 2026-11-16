// The server's copy of the built-in code titles matches the decoder's list.
import { expect, it } from 'vitest';
import { OBD_TITLES } from '../api/_obd';
import { INITIAL_OBD_DATABASE } from '../data/obdCodes';

it('api/_obd.ts matches data/obdCodes.ts', () => {
  expect(OBD_TITLES).toEqual(Object.fromEntries(Object.values(INITIAL_OBD_DATABASE).map((d) => [d.code, d.title])));
});
