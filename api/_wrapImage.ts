// Turns a wrap preview from the image model into light, web-ready files for the wrap gallery
// (docs/WRAP-GALLERY.md): WebP at 1200 and 640 px wide, plus an on-demand JPEG for social
// shares. Every file carries IPTC/XMP metadata saying it is AI-generated, who made it, the
// credit line and the reuse license, so the details travel with the image wherever it is shared.
// Used by api/_wrapGallery.ts and scripts/wraps/starter.ts. Files in api/ starting with "_" are not endpoints.
import sharp from 'sharp';

export const SITE = 'https://www.myautospex.com';
export const GALLERY_URL = `${SITE}/wrap-gallery`;
export const LICENSE_URL = 'https://creativecommons.org/licenses/by/4.0/';
export const CREDIT = 'MyAutoSpex Wrap Designer (www.myautospex.com)';

const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** XMP packet: title, caption, creator, credit, license and IPTC "AI-generated" source type. */
export function wrapXmp({ title, caption, pageUrl = GALLERY_URL }: { title: string; caption: string; pageUrl?: string }): string {
  return `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
<rdf:Description rdf:about=""
 xmlns:dc="http://purl.org/dc/elements/1.1/"
 xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"
 xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/"
 xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/"
 xmlns:plus="http://ns.useplus.org/ldf/xmp/1.0/">
<dc:title><rdf:Alt><rdf:li xml:lang="x-default">${xml(title)}</rdf:li></rdf:Alt></dc:title>
<dc:description><rdf:Alt><rdf:li xml:lang="x-default">${xml(caption)}</rdf:li></rdf:Alt></dc:description>
<dc:creator><rdf:Seq><rdf:li>${xml(CREDIT)}</rdf:li></rdf:Seq></dc:creator>
<dc:rights><rdf:Alt><rdf:li xml:lang="x-default">Free to reuse with credit to MyAutoSpex (CC BY 4.0). AI-generated preview, not a photo of a real car.</rdf:li></rdf:Alt></dc:rights>
<photoshop:Credit>${xml(CREDIT)}</photoshop:Credit>
<photoshop:Source>${xml(pageUrl)}</photoshop:Source>
<xmpRights:Marked>True</xmpRights:Marked>
<xmpRights:WebStatement>${xml(LICENSE_URL)}</xmpRights:WebStatement>
<Iptc4xmpExt:DigitalSourceType>http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia</Iptc4xmpExt:DigitalSourceType>
<plus:Licensor><rdf:Seq><rdf:li rdf:parseType="Resource"><plus:LicensorName>MyAutoSpex</plus:LicensorName><plus:LicensorURL>${xml(pageUrl)}</plus:LicensorURL></rdf:li></rdf:Seq></plus:Licensor>
</rdf:Description></rdf:RDF></x:xmpmeta>
<?xpacket end="w"?>`;
}

export interface EncodedWrap {
  large: Buffer;
  small: Buffer;
  width: number;
  height: number;
}

/** 1200 px (page and share) and 640 px (cards) WebP versions of one preview, metadata included. */
export async function encodeWrap(input: Buffer, meta: { title: string; caption: string; pageUrl?: string }): Promise<EncodedWrap> {
  const xmp = wrapXmp(meta);
  const base = sharp(input, { failOn: 'error' }).rotate();
  const large = await base.clone().resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 72, effort: 6 }).withXmp(xmp).toBuffer({ resolveWithObject: true });
  const small = await base.clone().resize({ width: 640, withoutEnlargement: true }).webp({ quality: 72, effort: 6 }).withXmp(xmp).toBuffer();
  return { large: large.data, small, width: large.info.width, height: large.info.height };
}

/** JPEG copy for places that don't take WebP (some social networks), metadata kept. */
export async function shareJpeg(webp: Buffer): Promise<Buffer> {
  return sharp(webp).jpeg({ quality: 74, mozjpeg: true }).keepXmp().toBuffer();
}
