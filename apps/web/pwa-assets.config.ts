import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// The tent icon (pwa-assets/icon-source.svg) is the single source every
// installed-app icon size is generated from — favicon, apple-touch-icon,
// and the manifest's regular + maskable Android icons — so there's one
// place to update the brand mark, not six differently-sized PNGs to
// regenerate by hand.
//
// `npx pwa-assets-generator` writes its output next to the source (in
// pwa-assets/, not public/) — there's no CLI flag to redirect that. After
// regenerating, move everything it produced except icon-source.svg itself
// into public/ (and copy icon-source.svg there too, for the SVG favicon
// link) — see public/ for the current generated set.
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: minimal2023Preset,
  images: ['pwa-assets/icon-source.svg'],
});
