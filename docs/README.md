# m0x-flow static site (docs/)

This directory holds the static landing page for the m0x-flow repository:

- `index.html` — the page (single-file content, no build step)
- `styles.css` — styles mirroring the app's Obsidian design system (see `../DESIGN.md`)
- `main.js` — nav state, scroll reveal, and code-snippet copy buttons
- `assets/logo.png` — app logo used by the page

## Preview locally

```powershell
python -m http.server 8080 --directory docs
# then open http://localhost:8080
```

## Publish on GitHub Pages

1. In the repo, go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **Deploy from a branch**.
3. Select branch `main` and folder `/docs`.
4. Save. The site appears at `https://<owner>.github.io/<repo>/` after the first build.

Note: GitHub Pages serves only static files — the Python sidecar never runs in this context.
