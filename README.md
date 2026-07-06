# Forwardsols — Landing Page Recreation

A front-end recreation of a modern SaaS/agency landing page, built entirely from scratch in **vanilla HTML, CSS, and JavaScript** — no frameworks, no build step, no dependencies. Every animation (particle networks, starfield, scroll-driven reveals, carousels) is hand-written with the Canvas API and native JS.

This project was built as a practice/study exercise in recreating a real-world site's structure, layout, and motion design using original code and assets.

## Features

- **Animated hero background** — a canvas-based particle network with drifting nodes, connecting lines, and cursor-repulsion physics
- **Scroll-driven "About" reveal** — a heading that splits open vertically as you scroll, revealing paragraph text through the gap
- **Preloader** — a starfield loading screen with a wordmark logo and animated progress bar
- **Sticky crossfade transition** — a bracket/glow animation that fades in place into a starfield client-logos section (no separate scroll stop)
- **Accessible navigation** — keyboard-operable mega-menus, a mobile slide-in drawer, skip-to-content link, and visible focus states
- **Interactive components** — tabbed tech-stack grid, testimonial carousel, business-stats carousel with SVG dashboard mockups
- **Contact form** — fully labeled for screen readers, with client-side submit handling
- **Responsive design** — works down to mobile, with a dedicated hamburger nav
- **Reduced-motion support** — every animation respects `prefers-reduced-motion`
- **Performance-conscious** — canvases pause when scrolled off-screen or the tab is backgrounded, use spatial-grid partitioning for particle connections, and scale resolution with `devicePixelRatio`

## Tech stack

- HTML5 (semantic markup, ARIA where needed)
- CSS3 (custom properties, Grid, Flexbox, `clip-path`, `clamp()`)
- Vanilla JavaScript (Canvas API, IntersectionObserver, no libraries)

No npm install, no build tools — open `index.html` in a browser and it runs.

## File structure

```
.
├── index.html      # Markup
├── styles.css      # All styling
├── script.js       # All interactivity and canvas animations
└── README.md
```

## Getting started

Clone the repo and open the file directly, or serve it locally:

```bash
git clone <https://github.com/ahmedabbas52233-a11y/Forwardsols>
cd <Forwardsols>
python3 -m http.server 8000
# then visit http://localhost:8000
```

All three files must stay in the same folder — `index.html` links to `styles.css` and `script.js` by relative path.

## Browser support

Built for modern evergreen browsers (Chrome, Firefox, Safari, Edge). Uses `-webkit-` fallbacks for `backdrop-filter`, `background-clip: text`, and `user-select` for broader Safari support.

## Notes

This is an independent, from-scratch recreation built for learning purposes — all code, assets, and copy variations are original. It is not affiliated with, and does not reuse any code or assets from, any real company or website.

## License

MIT — feel free to use this as a reference or starting point for your own projects.
