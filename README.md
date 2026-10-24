# content-portfolio

Alex Xiao content portfolio. Static site, no build step.

## Files
- `index.html` – markup and content (edit video cards, roles, copy here)
- `styles.css` – design system (Robinhood Gold inspired: warm black, charcoal cards, muted gold)
- `script.js` – animations: count-ups, scroll reveals, gold card tilt, cursor spotlight, filters, dock, accordions, drawer, gauge
- `assets/` – video thumbnails (`thumb-01.jpg` … `thumb-09.jpg`)

## Deploy (GitHub Pages)
Replace the repo contents with this folder and push. Pages serves `index.html` from the root.

## Editing
- Add a video: copy a `.vcard` block in `index.html`, set `data-brand`, `href`, title, views, thumbnail, and the bar `--pct` (views / 2.2M).
- Add a brand filter: add a `<button data-filter="Name">` in `.filters`.
- Numbers that count up use `<span class="count" data-to="50" data-suffix="M+">`.
