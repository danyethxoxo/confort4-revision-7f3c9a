# Photo delivery: SDR and bandwidth budgets

All dynamic public photographs use `safeImage` / `propertyImageSource`, including
property cards, galleries, thumbnails, history and editorial photos. Navigation
links continue to use `safeURL`; it must never be used to embed an inventory photo.

| Profile | Longest side | Maximum bytes per file |
| --- | ---: | ---: |
| thumb | 360 px | 40,000 |
| mobile | 960 px | 250,000 |
| card | 1,440 px | 450,000 |
| large | 2,560 px | 1,000,000 |

Known optimized photos have four checked-in derivatives. New photos automatically
use the public `confort4-photo` Edge Function, which accepts only the approved public
KW image hosts, this site's public assets, and its public editorial uploads. It
fetches an explicitly resized WebP conversion from wsrv.nl **on the server**,
validates its byte length, RIFF chunks and dimensions, then caches it in the public
`confort4-property-sdr` bucket. Only the service role can write to that bucket.

The converter is an external best-effort dependency for cold cache entries;
already cached photos remain available from Supabase Storage. Cached responses
and immutable redirects have a one-year browser cache lifetime. Source URLs must
change when replacing a photo in place, or bump `PHOTO_VERSION` to invalidate.
No credentials, private documents or user sessions are sent to the converter.

Validation rejects profiles, EXIF, XMP, gain maps, animations and unknown chunks;
only static 8-bit WebP pixels and alpha are accepted. Conversion retries at lower
quality when necessary. On failure or unsupported input, return a small SVG
placeholder, **never the original image**. New source hosts must be deliberately
added to `originalPhotoURL`; do not introduce a permissive fallback.

Thumbnails use the thumb profile, rather than downloading each full-size gallery
photo. The property slideshow preloads at most the next large image. Save-Data or
2G pauses property autoplay by default; manual navigation and explicit resume
remain available. Native lazy loading is retained for galleries and cards.
The static contact-form background is a verified 234 KB sRGB JPEG without HDR.

Responsive srcset selects the appropriate size for screen width and pixel density. Gallery navigation updates srcset with the active photo; preloading uses the matching screen profile. Larger displays get higher-resolution files while phones avoid downloading the desktop version.

Regenerate known assets with `npm run photos:sdr`; pass `-- --refresh` to download
the original sources again. The script always encodes from cached originals, never a previously compressed derivative. It auto-orients before removing metadata and
enforces the same byte/dimension budgets. It writes the manifest, not the routing
policy. Build mirrors the shared policy into the Edge Function deployment folder.

Deploy `confort4-photo` with JWT verification **disabled** (public `<img>` GETs),
including `index.ts`, `media.mjs`, and `photo-policy.mjs`. Conversion cache misses
use the existing service-only rate gate; there is no public upload action.

Validation: `npm test` includes real asset byte/metadata checks, future-source
routing, conversion rejection/retries, streamed byte bounds, cache-only redirects,
safe failure, rate limits and source allowlists. Browser QA additionally verifies
that no property photo requests go directly to the original KW image hosts.
