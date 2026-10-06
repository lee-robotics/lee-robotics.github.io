# Learning Reflexive Behavior — paper website

A static academic project page, hosted as part of `lee-robotics.github.io`: it loads the site stylesheet, fonts and header/footer from `../../`, and `theme.css` maps the site tokens onto the names used here. No JavaScript framework, analytics, or package installation.

## Visual style

See [STYLE_GUIDE.md](STYLE_GUIDE.md) for the academic typography, figures, tables, controls, and accessibility conventions. Shared visual tokens live in `theme.css`; component rules live in `styles.css`.

## The two places to edit

### 1. Appearance: `theme.css`

The main settings are at the top of this file:

```css
--font-family: var(--font-body);  /* Inter, from the site stylesheet */
--body-font-size: 15px;
--line-height: 1.6;
--reading-width: 720px;
```

Other settings control heading/caption sizes, paragraph gaps, section padding, colors, and the wider media layout. Change the values, save, and refresh the browser. **No rebuild needed for CSS.** Use Ctrl+Shift+R if the browser caches the previous styles.

Examples:

- Wider prose: `--reading-width: 46rem;` (736px).
- Larger body text and TL;DR: `--body-font-size: 18px;`.
- Serif typography: `--font-family: Georgia, 'Times New Roman', serif;`.
- Less vertical space: `--line-height: 1.4;`.
- Left alignment: `--text-align: left;`.

Reading width and font size are deliberately independent. `rem` is based on the root size (normally 16px), not `--body-font-size`. Keep reading width smaller than the media layout width. Narrow screens automatically constrain both to the viewport. Headings scale down on smaller screens; body text uses your chosen size on desktop and mobile.

### 2. Text: `content/*.md`

| File | Editable content |
| --- | --- |
| `content/overview.md` | Paper title, authors, TL;DR, collapsible abstract, video caption |
| `content/motivation.md` | Motivation paragraphs, placeholder label, comparison text/captions |
| `content/primitives.md` | Section introduction and all three interactive primitive descriptions |
| `content/training.md` | Training text, pipeline descriptions, figure caption |
| `content/results.md` | EIR, peg-in-hole, surface tracking, table note, limitations |

Each file is split into named text blocks:

```markdown
## intro

Your paragraph goes here. Use **bold** or *emphasis* if needed.

A blank line adds another paragraph in a body-text block.
```

**Keep the `## key` lines unchanged**: they tell the layout where each block belongs. Edit the text underneath them. Headings, captions, and other inline fields should contain a single paragraph. A single newline creates a line break (useful for the paper title); for normal prose, keep each paragraph on one source line and enable your editor’s word wrap.

The supported Markdown subset is **bold**, *emphasis*, and `[link text](URL)`. Raw HTML is displayed as text, not executed. Lists, Markdown tables, and additional heading syntax are not supported inside blocks. Interactive primitive fields (`spring-*`, `plane-*`, `rail-*`) must be single-line **plain text**, so initial rendering and primitive switching stay consistent.

The `abstract` block in `content/overview.md` appears in an “Abstract” disclosure before the overview video. It is collapsed by default and can be toggled by mouse or keyboard, without JavaScript.

The numerical results table, media paths, diagram drawings, and UI controls remain in `templates/sections/*.html` / `script.js`; these are layout/data edits rather than prose edits.

After changing text, run:

```sh
python3 build.py
```

Then refresh the page. The build requires only Python 3’s standard library. It reports missing, duplicate, unused, or empty content keys rather than silently dropping text; an invalid build leaves the previous `index.html` intact.

For frequent editing, leave the watcher running in another terminal:

```sh
python3 build.py --watch
```

The watcher rebuilds when you save content or any template, and detects added/removed section files. **Refresh the browser manually** to see the result. CSS does not need the watcher. If a watcher was already running before the section-template feature was added, restart it once.

## HTML structure: one file per section

```text
templates/
  index.html                  # Shared page shell: head, navigation, main, footer
  sections/
    10-overview.html           # Uses content/overview.md
    20-motivation.html         # Uses content/motivation.md
    30-primitives.html         # Uses content/primitives.md
    40-training.html           # Uses content/training.md
    50-results.html            # Uses content/results.md
```

Edit the corresponding section HTML for structural changes. `templates/index.html` contains `{{sections}}` and `{{navigation}}` slots; the build fills both automatically. You do not need to list section files in the shell or in Python/JavaScript.

### Add a section using just two files

**1. Create `templates/sections/60-discussion.html`:**

```html
<section id="discussion" class="content-section" aria-labelledby="discussion-title">
  <div class="section-heading">
    <h2 id="discussion-title">{{discussion.heading}}</h2>
  </div>
  <p>{{discussion.intro}}</p>
</section>
```

**2. Create `content/discussion.md`:**

```markdown
# Discussion content

## heading

Discussion

## intro

Your discussion text goes here.

You can add more paragraphs here.
```

Run `python3 build.py` (or let the watcher rebuild), then refresh. The section appears after Results and gets its own navigation link and active-section tracking automatically.

**Naming and ordering:**

- HTML filenames follow `NUMBER-name.html`; numbers determine order, with name as the tie-breaker. Use `25-background.html` to insert between Motivation (20) and Primitives (30).
- The Markdown filename, outer section ID, and placeholder prefix use the same name **without the number**: `background.md`, `id="background"`, `{{background.intro}}`.
- Use lowercase names with hyphens, and unique HTML IDs. The HTML must start with its outer `<section>` element (comments before it are fine).
- Navigation defaults to the Markdown `## heading` text. Optionally set `data-nav="Short label"` on the outer section for a shorter navigation label.
- Reorder by renaming the HTML file's numeric prefix; Markdown names and links do not change.
- Use every Markdown key in the HTML (or remove unused keys); the build reports typos and missing files.
- To remove a custom section, remove its HTML and Markdown files together. Built-in Overview and Primitives also provide shared metadata and interactive content, so removing those requires updating the shell/scripts.

No code changes are needed to add ordinary text/media sections using existing layout classes. New interactive behavior or custom visual styles may still require JavaScript/CSS.

## Preview

From this directory:

```sh
python3 build.py
python3 -m http.server 8000
```

Open **http://localhost:8000**. The server only serves files; use the build command or watcher to apply Markdown edits.

## Peg-in-hole deployment videos

The card after the insertion success-rate table uses `assets/peg-in-hole/`:

- `0_02-{offset}.mp4`: 0.02 mm clearance, offsets 0, 2, 5, and 9 mm.
- `0_1-{offset}.mp4`: 0.1 mm clearance, offsets 0, 2, 5, 9, and 13 mm.
- Matching `.webp` files are first-frame posters.

The nine supplied videos retain their original H.264/AAC streams, remuxed with MP4 fast-start metadata for web playback. Only the selected clip is loaded, with no autoplay. Clearance changes preserve valid offsets; switching from 13 mm to 0.02 mm clearance resets the offset to 0 mm. These controls are independent of the success-rate table. Without JavaScript, the default 0.02 mm / 0 mm video remains playable.

Edit the card title in `content/results.md` (`peg-video-heading`), its structure in `templates/sections/50-results.html`, and its selection behavior in `script.js`.

## Source and generated files

- `theme.css` — editable typography, sizing, spacing, colors.
- `content/*.md` — editable section text.
- `templates/index.html` — shared page shell with automatic section/navigation slots.
- `templates/sections/*.html` — one HTML structure per section, ordered by filename.
- `build.py` — content validation and static HTML generation.
- `index.html` — **generated output; do not edit it directly**.
- `styles.css` — layout and responsive rules, consuming `theme.css` settings.
- `script.js` — section tracking.
- `primitive-viewer.js` — interactive Three.js force-field viewer, radio selection, axis dragging, position sliders, and spring–damper force laws.
- `assets/vendor/three.min.js` — locally vendored Three.js 0.158.0 (MIT license alongside it); no CDN required at runtime.
- `assets/` — supplied paper, figure, videos, and posters.

To deploy, run `python3 build.py` and commit `index.html` with the rest of the site; the page relies on `../../assets/` (stylesheet, header/footer) and `../../favicon.ico`. No Python or Markdown processing is needed on the host.

## Research content

The supplied PDF identifies **Anonymous Authors**. No venue, acceptance status, code-release link, or affiliation has been invented. Reported results come from Sections IV-B and IV-D and Table II. Hardware and simulation results are labeled separately; insertion forces are estimates, not direct measurements. The primitive explorer is conceptual, not a physics simulation.

Videos use H.264 MP4 rather than GIF for size and quality. All clips were re-encoded for this site (peg-in-hole at 540p, the rest at 720p, `-crf 28`, silent tracks dropped), which took the assets from 263 MB to under 50 MB. The paper PDF is not bundled; the page links to arXiv.

Before public release, confirm author details and permission to distribute the supplied paper/media. Add reviewed video captions if available.
