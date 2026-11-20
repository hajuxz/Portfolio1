# Editable portfolio

Double-click **Start Portfolio.cmd** on Windows, or run `node server.mjs` with Node.js 22 or newer. Open the **Private editor** URL printed in the terminal. Use the shorter portfolio URL for the visitor view. Keep the terminal open while using the site.

In Portfolio Studio, change the sample name, biography, services, interests, project covers, skills, timeline, colors, and contact details. **Publish changes** saves them for all visitors to that server. The contact form opens a draft in the visitor’s email app once you enter your real email address.

The local server stores published content in `.local/portfolio.json`. The private admin link changes after a restart unless you configure a strong `PORTFOLIO_ADMIN_TOKEN`. It listens on localhost by default. For shared server hosting, configure `HOST`, `PORT`, persistent disk, and HTTPS.

For a browser-only preview, open `dist/index.html` and use **Quick Jump → Edit portfolio**. **Save to this device** stores changes in that browser. Export JSON includes uploaded images. Import that backup in the server editor and publish to share it.

The Sites deployment uses signed-in identity and bucket storage. On a newly deployed owner-private Site, publish once before sharing it. That first save binds the editor to your Site identity. Build its Worker with `node hosting/build.mjs` after changing the front end.

## Views and navigation

The single page opens at `#home`. The other routes are `#about`, `#work`, `#skills`, `#journey`, and `#contact`. Use the sidebar or press Ctrl+K (⌘K on Mac) to jump to a view or change the theme. Each view remembers its desktop sidebar setting. The narrow-screen drawer always closes after navigation.

- `dist/navigation-config.js` defines the routes, sidebar defaults, optional Interests view, availability, links, version, colors, and timings. Blank contact or location overrides use the Portfolio Studio fields. Missing social links remain disabled until you supply an address.
- `dist/navigation.js` manages hash history, view transitions, focus, the sidebar, and the existing theme switch. `dist/navigation.css` styles the workspace.
- `dist/index.html` contains the view panels. `dist/app.js` renders editable content and handles Quick Jump. `dist/content.js` defines default content and validates saved portfolios. In Studio, open **Skills** to edit categories and their comma-separated skills.
- `dist/workspace-icons.js` contains the shared line icons. Bundled Simple Icons and local Inter and Space Mono font files are in `dist/assets/workspace/`.
- Home scrubs 161 paired JPEGs with scroll. Put the dark export in `dist/assets/frames/dark/` and the matching light export in `dist/assets/frames/white pic/`, named `ezgif-frame-001.jpg` through `ezgif-frame-161.jpg`. Edit `dist/sequence-config.js` for paths, frame count, focal point and theme fade duration. A blank light path derives both looks from the dark frames. Reduced motion keeps one still frame.

### Frame playback and optional WebP export

The four playback settings are at the top of `dist/sequence-config.js`. `LERP_SPEED` controls catch-up per 60 Hz tick (default 0.18), `MAX_DPR` caps device density (2), `MAX_CANVAS_WIDTH` caps the backing width (1920), and `PRELOAD_BATCH_SIZE` sets the number of frame pairs per background batch (8). The player also caps the backing width at the original frame width. The photograph's crop and the 700 ms theme fade use their existing settings.

Every shipped JPEG is 1280 × 720. Keep this size for both exports. For a smaller transfer, run `.\tools\Convert-HeroFrames.ps1` in PowerShell with the `cwebp` encoder on PATH. The script writes quality-78 WebPs in matching `dark` and `white pic` folders under `.local/webp-frames/`. To use them, point the two public frame folders at the converted sets for your build, change both `FRAME_PATH` extensions to `.webp`, and rebuild with `node hosting/build.mjs`. Keep the JPEG originals in your source backup.

### Add a view

Add the route to `NAV_CONFIG.views` in the desired menu order. An example entry follows.

```js
{id: "writing", label: "Writing", icon: "edit", group: "Workspace"}
```

Place a matching direct child inside `main#main-content` in `dist/index.html`. The ID and `data-view` must match the route.

```html
<section class="section" id="writing" data-view="writing" aria-labelledby="writingTitle" hidden>
  <header class="section-heading">
    <div>
      <p class="kicker">Field notes</p>
      <h1 id="writingTitle" tabindex="-1">Writing</h1>
    </div>
  </header>
  <!-- Your articles go here. -->
</section>
```

The sidebar, Quick Jump, browser title, Back/Forward, heading focus, and transition pick up the new view automatically. Set `collapsed: true` on its route to start with the sidebar closed. Set `features.interests` to `true` to enable the existing Interests panel.
