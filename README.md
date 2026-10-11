# creativit.llc

Website for CreativIT, LLC: video storytelling, photography, social media, and web design by Justin Royse.

Static HTML/CSS/JS, no build step. Netlify publishes the `site/` folder (see `netlify.toml`).

## Local preview

```sh
npm install          # puppeteer, for screenshots only
node serve.mjs       # http://localhost:3000
node capture-full.mjs http://localhost:3000/video/ "temporary screenshots/video.png"
```

## Structure

- `site/`: everything that gets deployed
  - `index.html`, `video/`, `photography/`, `web-social/`, `about/`, `contact/`, `thanks/`, `404.html`
  - `assets/css/site.css`, `assets/js/site.js`: shared styles and interactions
  - `_redirects`: old GoDaddy URLs → new pages
- The header and footer are repeated in each page, so nav changes need to be made in every `index.html`.
- The contact form uses Netlify Forms (`data-netlify="true"`); submissions appear in the Netlify dashboard.
