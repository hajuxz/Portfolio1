# Editable portfolio

Double-click **Start Portfolio.cmd** on Windows, or run `node server.mjs` with Node.js 22 or newer. Open the **Private editor** URL printed in the terminal. Use the shorter portfolio URL for the visitor view. Keep the terminal open while using the site.

In Portfolio Studio, change the sample name, portrait, biography, services, interests, project covers, skills, timeline, colors, and contact details. **Publish changes** saves them for all visitors to that server. The contact form opens a draft in the visitor’s email app once you enter your real email address. Add your résumé URL to enable the résumé button.

The local server stores published content in `.local/portfolio.json`. The private admin link changes after a restart unless you configure a strong `PORTFOLIO_ADMIN_TOKEN`. It listens on localhost by default. For shared server hosting, configure `HOST`, `PORT`, persistent disk, and HTTPS.

For a browser-only preview, open `dist/index.html` and select **Edit**. **Save to this device** stores changes in that browser. Export JSON includes uploaded images. Import that backup in the server editor and publish to share it.

The Sites deployment uses signed-in identity and bucket storage. On a newly deployed owner-private Site, publish once before sharing it. That first save binds the editor to your Site identity. Build its Worker with `node hosting/build.mjs` after changing the front end.

## Views and navigation

The single page opens at `#home`. The other routes are `#about`, `#work`, `#skills`, `#journey`, and `#contact`. Use the sidebar or press Ctrl+K (⌘K on Mac) to jump to a view, switch portraits, or change the theme. Each view remembers its desktop sidebar setting. The narrow-screen drawer always closes after navigation.

- `dist/navigation-config.js` defines the routes, sidebar defaults, optional Interests view, availability, links, version, colors, and timings. Blank contact or location overrides use the Portfolio Studio fields. Missing social links remain disabled until you supply an address.
- `dist/navigation.js` manages hash history, view transitions, focus, the sidebar, and the existing theme switch. `dist/navigation.css` styles the workspace.
- `dist/index.html` contains the view panels. `dist/app.js` renders editable content and handles Quick Jump. `dist/content.js` defines default content and validates saved portfolios. In Studio, open **Skills** to edit categories and their comma-separated skills.
- `dist/workspace-icons.js` contains the shared line icons. Bundled Simple Icons and local Inter and Space Mono font files are in `dist/assets/workspace/`.
- `dist/portrait.js`, `dist/portrait.css`, `dist/portrait-burst.js`, and `dist/portrait-shaders.js` retain the portrait setup. Press D on Home to check the alignment.

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
