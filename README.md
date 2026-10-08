# VFX Shader Curve & Timing Generator

A modular web workbench for designing, visualizing, and exporting timing curves, Bézier curves, and math node graphs for **Unity** and **Unreal Engine**.

![VFX Curve Generator](https://img.shields.io/badge/VFX-Timing%20Curves-blue)
![Theme](https://img.shields.io/badge/Theme-Tempo%20Workbench%20Dark-15171C)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Features

- **48 VFX Curve Presets**: Easing, Flash & Glow, Physics/Impact, Oscillations, and Multi-phase Stagger curves.
- **Polynomial Bézier Editor**: Y-only handle editing with fixed X and loop-free Horner evaluation.
- **Live Particle Simulation**: Horizontal and vertical tracks, Radial Burst, and Sword Slash VFX. Compare up to five snapshots of the current graph, click track frames to edit, and remove them with the corner ? button. Shared axes fit values outside 0?1; playback speed is adjustable from 0.05? to 3?.
- **Visual Node Graph**: Interactive SVG representation of shader math nodes with Pan and Zoom.
- **Realtime Optimization**: baked constants by default, shared multiplies for integer powers, constant folding and optional runtime parameters.
- **Shader Code Export**: Direct export to HLSL/GLSL, Unity Shader Function, Compact Math, and CSS timing functions.
- **Tempo Workbench UI**: Clean, data-dense neutral charcoal interface designed for graphics and technical artists.

---

## Live Demo (GitHub Pages)

This project runs completely client-side without build tools or external dependencies.

Once hosted via GitHub Pages, visit:
`https://<your-username>.github.io/<repository-name>/`

---

## Project Structure

```
├── index.html                 # Main web app entry point
├── README.md                  # Project documentation
├── .gitignore                 # Git ignore rules
└── src/
    ├── css/
    │   ├── variables.css      # Dark theme tokens (Tempo Workbench)
    │   ├── base.css           # Typography, reset, and scrollbars
    │   └── components.css     # Modular UI component styles
    └── js/
        ├── state.js           # Centralized reactive state
        ├── presets.js         # Library of 48 VFX curves
        ├── math-engine.js     # Bézier math & expression evaluators
        ├── node-graph-model.js# Node graph generator & step-by-step recipes
        ├── code-gen.js        # Shader code generator (HLSL, Unity, CSS)
        ├── app.js             # Main application orchestrator
        └── renderers/
            ├── curve-canvas.js# Canvas curve editor renderer
            ├── particle-sim.js# Multi-mode particle VFX simulator
            └── node-graph.js  # SVG node graph renderer
```

---

## Local Development

Since the app uses standard ES Modules (`import`/`export`), serve it using any local HTTP server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js (npx)
npx serve .
```

Then open `http://localhost:8000` in your browser.


## Verification

The app still runs without a build step or runtime dependencies. Development tests use Node.js and Playwright:

```sh
npm install
npm test
npm run test:browser
```

Browser tests use Microsoft Edge on Windows; elsewhere install Chromium with `npx playwright install chromium`. See [AUDIT.md](AUDIT.md) for the documentation audit and validation limits.
