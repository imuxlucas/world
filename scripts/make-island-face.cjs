// Original vector artwork: exact type and editable Art Nouveau curves, rasterized for glTF.
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('/Users/lucas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '..');
const flourish = `<g fill="none" stroke="#bb6d8d" stroke-width="9" stroke-linecap="round">
  <path d="M0 115 C-30 35 -25 -65 0 -130 C53 -149 69 -87 23 -77 C-12 -72 -6 -41 0 -19"/>
  <path d="M-8 44 C-115 -80 -158 -22 -105 10 C-81 27 -58 15 -65 -1"/>
  <path d="M-2 61 C79 -37 139 -8 105 37 C82 61 56 39 71 27"/>
  <path d="M0 115 C25 154 85 150 111 115"/>
  <path d="M-44 83 C-175 35 -145 -105 -235 -137 C-291 -156 -325 -125 -298 -93" stroke="#a9c9eb" stroke-width="7"/>
  <path d="M-62 109 C-202 84 -187 151 -294 148" stroke="#dfacc4" stroke-width="7"/>
</g>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="4096" height="768" viewBox="0 0 4096 768">
<rect width="4096" height="768" fill="#f6f2f4"/>
<g stroke="#ddb3c8" fill="none" stroke-width="4">
<path d="M385 185 C650 225 646 104 885 105 L3211 105 C3450 104 3446 225 3711 185"/>
<path d="M455 646 C912 687 1300 650 2048 650 C2796 650 3184 687 3641 646"/>
</g>
<g transform="translate(565 423)">${flourish}</g>
<g transform="translate(3531 423) scale(-1 1)">${flourish}</g>
<text x="2048" y="467" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="185" fill="#335c94" textLength="2710" lengthAdjust="spacingAndGlyphs">Lucas = ½ Fun + ½ Math</text>
</svg>`;
(async () => {
 const out=path.join(root,'public/assets/island/v003'); await fs.mkdir(out,{recursive:true});
 await fs.writeFile(path.join(out,'front-formula.svg'),svg);
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try { const page=await browser.newPage({viewport:{width:4096,height:768},deviceScaleFactor:1});
 await page.setContent(`<style>body{margin:0}</style>${svg}`);await page.evaluate(()=>document.fonts.ready);
 await page.locator('svg').screenshot({path:path.join(out,'front-formula.png')});
 } finally {await browser.close();}
})();
