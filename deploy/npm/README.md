# YuriRTC static carrier

This package's npm name is a distribution coordinate retained for existing CDN
and deployment links. The package contains the two path-portable files a
static host needs: `index.html` and `sw.js`.

The release pipeline also produces `bundled/`, a CDN-independent loader
variant for networks that cannot reach jsDelivr or unpkg. Its `index.html`
contains the exact current loader client and display font inline; `sw.js` is
the full same-version loader worker, and the colocated `client.js` is the
durable recovery module used by transported documents. Upload all six files in
that directory together. `LICENSE`, `FONT-LICENSE.txt`, and `SOURCE.txt` carry
the notices required by the bundled AGPL loader and font.

Build a non-deployable placeholder artifact with `npm run build`. A release
build requires these environment variables:

- `YURIRTC_FIREBASE_API_KEY`
- `YURIRTC_FIREBASE_PROJECT_ID`
- `YURIRTC_FIREBASE_DATABASE_URL`

The former `FIREBASE_*` spellings remain accepted as compatibility aliases.
The resulting JavaScript is heavily minified and obfuscated, visible DOM copy
remains ROT13-encoded, and UI icons use Google's hosted Material Symbols
stylesheet without glow effects. The carrier verifies the ECDSA-signed
`shaintloadingcheckpak` pointer and SHA-256 of the immutable `@advwebrec/grainloading`
client before execution. Signature or hash failures require a three-second
explicit continuation; complete CDN failure shows the support message.

## Carrier network-state API

The loader reports connection state without exposing ICE candidates or network
addresses:

```js
window.dispatchEvent(new CustomEvent("yurirtc:network-state", {
  detail: {
    state: "connected",
    route: { transport: "udp", portClass: "standard" }
  }
}));
```

`state` is `testing`, `connected`, `disconnected`, or `unavailable`. A classified
connected route uses `udp` or `tcp` and a `portClass` of `standard` (a configured
non-443 port) or `443`. A disconnected update may include bounded numeric
`attempt` and `retryInMs` values so the carrier can display automatic retry
feedback. Every other field is ignored and must never be rendered or logged.

When Chrome has connected but has not yet exposed the selected pair in stats,
the loader may report `unknown` for either coarse field. The carrier reveals the
application with a neutral “route unknown” value and no selected tier; it never
falls back to displaying candidate details.

The reconnect button emits a cancelable `yurirtc:reconnect-request` event whose
detail is exactly `{ reason: "manual" }`. Automatic retry remains owned by the
loader; it should emit `testing` when the next attempt begins. A loader that
handles the manual request must call `preventDefault()` on the event. If no
handler accepts it, the carrier safely reloads its own path as a fallback.

Release builds stamp both generated files with opaque source fingerprints.
`verify:package` rejects a stale pair, a placeholder/development build, or files
built before the current loader/package versions. Rebuild with the production
Firebase web configuration before verification and upload `index.html` and
`sw.js` together.

`npm run build:release:bundled` creates the alternate carrier under `bundled/`,
and `npm run verify:bundled` verifies its inline client, durable client, full
worker, font, notices, loader version, and source fingerprints. “Current” means
the loader version in this checkout at build time; the bundled carrier does not
follow an npm dist-tag after upload, so rebuild and redeploy it for each loader
release. The normal npm package remains the signed-CDN two-file carrier and is
unchanged by this alternate artifact.

### SVG carrier

The third carrier uses an SVG entry document with a full-window XHTML
`foreignObject` iframe. The existing HTML shell is embedded as UTF-8/base64;
its loader integrity checks, UI, and directory-relative service worker
behavior are retained. The inner document shares the outer SVG client's
service-worker interface, and shell reloads target the outer SVG. No separate `index.html` is needed.

```sh
npm run build:svg -w learnmathedu
# With the same public Firebase configuration used for other release builds:
npm run build:release:svg -w learnmathedu
npm run verify:svg -w learnmathedu

# Non-bundled SVG: load the client, font, and worker runtime from CDNs.
npm run build:svg:cdn -w learnmathedu
npm run build:release:svg:cdn -w learnmathedu
npm run verify:svg:cdn -w learnmathedu
```

| Variant | Output directory | Files to upload |
| --- | --- | --- |
| Bundled SVG | `deploy/npm/svg/` | All six files |
| CDN SVG | `deploy/npm/svg-cdn/` | `index.svg` and `sw.js` |

The CDN SVG contains the bootstrap shell, but no embedded loader client or
font. Its neighboring `sw.js` imports the worker runtime through the existing
CDN fallback list. Both variants open directly at `index.svg`.

Upload the contents of `deploy/npm/svg/` to one HTTPS directory, and open
`index.svg` directly. This includes `sw.js`, the durable recovery `client.js`,
and the license/source notices. Serve the SVG as
`image/svg+xml` and the worker as `application/javascript`. Localhost HTTP is
also supported for testing. The host must allow inline scripts and same-origin
frames. An SVG displayed through `<img>` will not run the application.

The default SVG scripts bundle the current client, font, and worker, so they
work without waiting for a loader npm release. Build the loader first with
`npm run build -w @advwebrec/grainloading` after changing its source.
The CDN-backed variant requires loader `0.5.5` or newer, which supports the
`reloadShell` boot callback. Generated SVG output is ignored by Git and is not added to the
existing npm package.

A single uploaded static SVG cannot install its embedded service worker:
browsers require a same-origin HTTP(S) worker URL with a JavaScript MIME type;
`blob:`/`data:` workers and an SVG response do not meet those requirements.
An image-only upload host therefore cannot host this carrier by itself. Keep
`sw.js` alongside the SVG. The extra iframe also means cross-origin isolation
and SharedArrayBuffer availability depend on the host's document/frame headers;
do not assume an SVG deployment enables SAB games without browser validation.
