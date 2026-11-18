# Editable portfolio

Double-click **Start Portfolio.cmd** on Windows, or run `node server.mjs` with Node.js 22 or newer. Open the **Private editor** URL printed in the terminal. Use the shorter portfolio URL for the visitor view. Keep the terminal open while using the site.

In Portfolio Studio, change the sample name, portrait, biography, services, interests, project covers, skills, timeline, colors, and contact details. **Publish changes** saves them for all visitors to that server. The contact form opens a draft in the visitor’s email app once you enter your real email address. Add your résumé URL to enable the résumé button.

The local server stores published content in `.local/portfolio.json`. The private admin link changes after a restart unless you configure a strong `PORTFOLIO_ADMIN_TOKEN`. It listens on localhost by default. For shared server hosting, configure `HOST`, `PORT`, persistent disk, and HTTPS.

For a browser-only preview, open `dist/index.html` and select **Edit**. **Save to this device** stores changes in that browser. Export JSON includes uploaded images. Import that backup in the server editor and publish to share it.

The Sites deployment uses signed-in identity and bucket storage. On a newly deployed owner-private Site, publish once before sharing it. That first save binds the editor to your Site identity. Build its Worker with `node hosting/build.mjs` after changing the front end.
