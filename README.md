# Sakura Terminal

A minimalist, retro monospace developer portfolio built for an Entry-Level Backend Engineer ([@indrmsp](https://github.com/indrmsp)). Engineered with pure vanilla web standards, zero build tools, zero dependencies, and dynamic GitHub REST API synchronization.

---

## Overview

Sakura Terminal is a single-page technical dossier presenting engineering capabilities, public code repositories, and career milestones. The project avoids frontend framework overhead, relying entirely on standard browser APIs (HTML5, CSS Custom Properties, ES2020+ JavaScript) for fast loading, accessible navigation, and resilient fallback states.

---

## Design Principles

- **Monospace Aesthetic**: Tabular layouts, ASCII dividers, and monospaced typography inspired by classic terminal workstations (PC-98, VT220).
- **Hard Edges (`border-radius: 0`)**: Enforced globally across all containers, inputs, buttons, and modal panels.
- **Factual Integrity**: No inflated metrics or unverified claims. Showcases only verified public repositories and authentic career milestones.
- **Zero Dependencies**: Pure HTML, CSS, and JavaScript. No compilers, bundlers, or third-party packages.
- **Resilient Fallback**: Gracefully defaults to static pre-rendered content when external APIs are rate-limited, unreachable, or when JavaScript is disabled.

---

## Features

- **Typewriter Boot Sequence**: Terminal initialization sequence (~20ms/char, capped under 4s), skippable via `Escape`, `Enter`, `Space`, or click, with per-tab completion cached in `sessionStorage`.
- **Accessible Modal Model**: While the boot screen is active, background landmarks (`header`, `main`, `footer`) are marked `inert`, with initial focus placed on the skip button and returned to `#profile-title` on dismiss.
- **Character Dossier**: Status card specifying class (`Backend Engineer`), subclass (`Cloud / DevOps`), level (`LVL 1 [0 YOE]`), and animated competency meters.
- **Verified Repository Sync**: Fetches live repository metrics from `@indrmsp/website-portofolio` (Role: `Fullstack Developer`) with structured mission specifications (`ROLE`, `DESCRIPTION`, `STACK`, `CHALLENGES`, `RESULTS`).
- **Grounded Career Milestones**: Chronological timeline displaying:
  1. `2022 — 2026`: Informatics · Telkom University Purwokerto
  2. `2026 — PRESENT`: Junior Backend Engineer
  3. `[FUTURE]`: To be Continued...
- **Interactive Shell (`SAKURA SHELL`)**: Embedded terminal emulator with input history (`↑`/`↓`), `Tab` autocomplete, and commands: `help`, `about`, `skills`, `projects`, `journey`, `contact`, `clear`, `whoami`, `date`, `theme`.
- **Theme Engine**: Toggle between dark and high-contrast light terminal themes via the `theme` shell command, persisted in `localStorage`.
- **3-Tier Clipboard Uplink**: Email copy utility with automated cascade (`navigator.clipboard` → `document.execCommand` → DOM selection).

---

## Tech Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Markup** | HTML5 | Semantic landmarks, accessible modal dialogs, `<time>` tags |
| **Styling** | CSS3 | Custom Properties (tokens), CSS Grid, Flexbox, 0 border-radius |
| **Scripting** | JavaScript (ES2020+) | Modular IIFE, strict mode, zero global variables |
| **Data Source** | GitHub REST API | `GET /users/indrmsp/repos` with static fallback |
| **Dependencies** | None | Zero external libraries, zero build tools |

---

## Accessibility (a11y)

Engineered following WCAG 2.1 AA best practices:

- **Keyboard Navigation**: Skip-to-content link, high-contrast `:focus-visible` rings with offset (`outline: 2px solid var(--color-focus); outline-offset: 2px`).
- **Reduced Motion**: Dual-layer handling (`@media (prefers-reduced-motion: reduce)` in CSS; instant boot sequence bypass in JavaScript).
- **Modal Semantics**: `role="dialog"` with `aria-modal="true"`, background landmark isolation via `inert`, and restrained screen-reader announcements without character-by-character live region spam.
- **Semantic Structure**: `role="log"` on terminal output buffer, `role="progressbar"` on attribute meters, and `<time datetime="...">` tags for all dates.
- **Visual Ergonomics**: Strict 12px minimum font size floor; natural left-aligned text (`text-align: left`) to prevent uneven spacing rivers.

---

## Browser Support & Progressive Enhancement

- **Browser Compatibility**: Chrome/Chromium 90+, Firefox 88+, Safari 14+, Edge 90+.
- **Responsive Layout**: Fluid CSS Grid down to 360px viewport widths with zero horizontal scroll overflow.
- **No-JavaScript Support (`<noscript>`)**:
  - Boot sequence overlay is hidden immediately.
  - Progress bars render static fallback widths based on attribute values.
  - Featured mission card displays complete project specifications.

---

## Getting Started

No build step required. Clone the repository and open directly:

```bash
# Clone repository
git clone https://github.com/indrmsp/website-portofolio.git
cd website-portofolio

# Open in browser
xdg-open index.html    # Linux
open index.html        # macOS
start index.html       # Windows
```

Or serve locally using any static web server:

```bash
# Python 3
python3 -m http.server 8080

# Node.js
npx serve -l 8080 .
```

Access the application at `http://localhost:8080`.

---

## Project Structure

```
.
├── index.html          # Semantic HTML5 document & static fallback content
├── css/
│   └── style.css       # Design tokens, reset, typography, and responsive grid
├── js/
│   └── script.js       # Modular client engine (boot, terminal, nav, API sync)
├── assets/
│   ├── favicon.svg     # 16x16 pixel sakura blossom vector
│   └── punpun.png      # Optimized operator avatar (96x96 PNG, ~12 KB)
└── README.md           # Engineering documentation
```

---

## Configuration

To personalize this dossier:

1. **Profile Data**: Update operator info, stats, and social endpoints in `index.html`.
2. **Avatar**: Replace `assets/punpun.png` with your avatar image.
3. **GitHub Handle**: Update `username` in `js/script.js` (`projectGallery` module) to your GitHub handle.
4. **Theme Tokens**: Modify `:root` color tokens in `css/style.css`.

---

## License

MIT License. Free to use and adapt.
