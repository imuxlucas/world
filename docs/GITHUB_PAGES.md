# GitHub Pages

- Source: https://github.com/imuxlucas/world
- Website: https://imuxlucas.github.io/world/
- Publish branch: `main`; GitHub Actions builds and deploys after each push.
- Local development stays at http://127.0.0.1:5178/ with `npm run dev`.
- Production check: `npm run build:pages`, `node scripts/check-pages.mjs`, then `npm run preview:pages` and open http://127.0.0.1:4178/world/.

## Updating

Review `git status` and `git diff`, stage the intended files, commit, then run `git push origin main`. Check the Actions deployment before sharing changes. Do not commit credentials or local `.env` / `.npmrc` files.

`src/publicUrl.ts` prefixes runtime public URLs with Vite's configured base; CSS and HTML asset references are handled by Vite. Use `publicUrl('/media/...')` for new JavaScript/React asset URLs. Keep hash-based navigation so direct links work on static hosting.

## Local-only files

`artifacts/`, `asset-sources/`, and `design/` remain on the original computer and are excluded from Git. Historical GLB revisions are also excluded; current runtime models, textures, licensing, code, and site media are tracked. GitHub is not a backup of the editable Blender archives. When upgrading a model, update its exception in `.gitignore` and the asset manifest together.

The public copy of the Finder Markdown example has login details and the internal admin URL removed. The unredacted backup is local-only in `artifacts/private-publication-backup/` and must never be committed or deployed.

## External resources and credits

The AI SEE and tad-universal documentation destinations may require corporate network access; the site cannot grant access to those external systems. Embedded local component demos and local screenshots are deployed with this website.

The adapted carousel retains the original Carousel Lamp license in `public/assets/carousel/LICENSE.txt` and visible attribution linking to its author. Third-party components and media retain their own rights; publication does not grant additional reuse rights.
