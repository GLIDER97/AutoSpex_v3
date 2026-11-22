// GET /api/wraps?after=<id>&limit=<n> — saved wrap designs, metadata only (no images, nothing
// about visitors), plus anonymous counts of the wrap options people chose in the last 90 days.
// The daily growth run reads this to review new designs and publish the good ones in the wrap
// gallery (docs/WRAP-GALLERY.md). Not linked from any page.
import { json } from './_shared.js';
import { choiceStats, listDesigns } from './_wrapGallery.js';

export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const after = Math.max(0, Math.floor(Number(params.get('after')) || 0));
  const limit = Math.min(100, Math.max(1, Math.floor(Number(params.get('limit')) || 50)));
  try {
    const [designs, stats] = await Promise.all([listDesigns(after, limit), choiceStats(90)]);
    if (!designs) return json({ configured: false, designs: [], stats: null });
    return json({ configured: true, designs, stats }, 200, { 'Cache-Control': 'public, s-maxage=300', 'X-Robots-Tag': 'noindex' });
  } catch (err) {
    console.error('api/wraps: failed', err instanceof Error ? err.message : err);
    return json({ error: 'Could not read the wrap gallery.' }, 500);
  }
}
