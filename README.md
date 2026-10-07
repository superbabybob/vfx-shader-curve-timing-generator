# VFX Shader Curve & Timing Generator

A modular web workbench for designing, visualizing, and exporting timing curves, Bézier curves, and math node graphs for **Unity** and **Unreal Engine**.

![VFX Curve Generator](https://img.shields.io/badge/VFX-Timing%20Curves-blue)
![Theme](https://img.shields.io/badge/Theme-Tempo%20Workbench%20Dark-15171C)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Features

- **24 VFX Curve Presets**: Easing, Flash & Glow, Physics/Impact, Oscillations, and Multi-phase Stagger curves.
- **Interactive Bézier Editor**: 4-point handle manipulation with real-time curve evaluation.
- **Live Particle Simulation**: Radial Burst, 1D Track, Sword Slash VFX, Vortex Orbit, and Floating particles.
- **Visual Node Graph**: Interactive SVG representation of shader math nodes with Pan and Zoom.
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
        ├── presets.js         # Library of 24 VFX curves
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
