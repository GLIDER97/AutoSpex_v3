// GET /images/wraps/v/<id>/<name>-1200.webp | -640.webp | -share.jpg (rewritten here by vercel.json)
// Serves one saved wrap preview from the database. The descriptive file name is for people and
// image search; only the id and the size suffix matter. Responses never change, so the CDN keeps them.
import { json } from './_shared.js';
import { designImage } from './_wrapGallery.js';
import { shareJpeg } from './_wrapImage.js';

const FOREVER = 'public, max-age=31536000, s-maxage=31536000, immutable';

export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const id = Number(params.get('id'));
  const file = params.get('file') ?? '';
  const m = /^[a-z0-9-]{1,160}-(1200\.webp|640\.webp|share\.jpg)$/.exec(file);
  if (!Number.isInteger(id) || id < 1 || !m) return json({ error: 'Not found' }, 404);
  try {
    const webp = await designImage(id, m[1] === '640.webp' ? 'small' : 'large');
    if (!webp) return json({ error: 'Not found' }, 404);
    const body = m[1] === 'share.jpg' ? await shareJpeg(webp) : webp;
    return new Response(new Uint8Array(body), {
      headers: { 'Content-Type': m[1] === 'share.jpg' ? 'image/jpeg' : 'image/webp', 'Cache-Control': FOREVER },
    });
  } catch (err) {
    console.error('api/wrap-image: failed', err instanceof Error ? err.message : err);
    return json({ error: 'Could not load the image.' }, 500);
  }
}
