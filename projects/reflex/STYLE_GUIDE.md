# Academic page style guide

## Direction

Use a restrained, evidence-first academic style: white background, dark text, one blue accent, generous whitespace, and no decorative shadows or gradients. Prioritize reading and comparing results over promotional styling. Preserve research wording, values, units, caveats, and hardware/simulation distinctions.

## Typography

- Use local Arial/Helvetica sans-serif throughout; no external font dependency. Reserve serif italics for mathematical expressions and monospace for citations/code.
- Body: **17px / 1.65**, left aligned. Avoid justified paragraphs and automatic hyphenation.
- Reading measure: **44rem (704px)** maximum. Figures and tables may use the wider **960px** page shell (including side padding).
- Heading scale: title **36px**, section **28px**, subsection **24px**, task/question **20px**, evidence **18px**. Use weight 600 and line-height 1.3. Maintain semantic heading order, not just visual size.
- Labels and buttons: **15px**. Captions, table cells, notes, and navigation: **14px**. Do not shrink these on mobile. Compact labels embedded in diagrams may use 12px.
- Center only the title, authors, resources, and short comparison labels. Left-align section headings, prose, and explanatory captions.
- Bold sparingly for key terms and reported comparisons, not whole paragraphs.

## Color and spacing

Canonical values live in `theme.css`:

| Token | Value | Use |
| --- | --- | --- |
| `--text` | `#242b33` | Body and headings |
| `--muted` | `#56616d` | Captions and secondary text |
| `--link` | `#205b8d` | Links, selection, focus |
| `--link-hover` | `#17446b` | Hovered text links |
| `--line` | `#d9dfe5` | Subtle structural separators |
| `--control-border` | `#7b8793` | Interactive boundaries |
| `--soft` | `#f4f6f8` | Quiet supporting surfaces |
| `--accent-soft` | `#edf3f8` | Control hover background |

Use a 4px spacing rhythm, usually 8, 12, 16, 24, or 32px. Paragraph gap: 16px; section padding: 32px. Borders: 1px, except 2px table outer rules. Control corners: 4px. Keep text contrast at least 4.5:1 and control/focus indicators at least 3:1 against adjacent backgrounds.

## Figures and video

- Use semantic `figure`, informative image `alt`, and a caption below the media. Captions use 14px / 1.6 with an 8px gap.
- Explain what is shown, relevant conditions, and the takeaway. Preserve paper figure references; do not invent findings or imply placeholders contain evidence.
- Align comparison media and use equal columns where space permits. Stack on narrow screens. Preserve image aspect ratio; contain scientific figures rather than cropping axes or legends.
- SVG display widths are calibrated with the `--*-figure-width` tokens in `theme.css` so regular diagram text and plot axis labels match `--body-font-size`. Preserve their original heading/tick hierarchy. Use `.svg-scroll` on narrow layouts instead of shrinking labels, and show scrolling hints only when the figure overflows.
- Use 16:9 for video frames, native controls where supplied, and static posters. Do not add forced autoplay.
- Plots should label axes and units, use readable legends, and distinguish series by labels/line styles as well as color. Raster/vector figure internals require separate asset editing.
- Unavailable media must remain explicitly marked as a placeholder.

## Tables

- Put a visible semantic `caption` above every table and explanatory notes below it. Include the task, metric, and experimental condition.
- Use `th scope="col"` and `th scope="row"`. Left-align row labels; right-align numeric columns and their headers. Use tabular numerals.
- Use 14px text, 12px cell padding, subtle header shading, strong top/bottom rules, and light horizontal row rules. No vertical gridlines.
- Preserve reported precision, units, uncertainty, and missing-data markers. Explain ambiguous markers in notes rather than assuming they mean zero.
- Bold only the intended comparison values; do not rely on color alone.
- On small screens, scroll the table within a labeled, keyboard-focusable region instead of compressing its text or overflowing the page.

## Links, buttons, and inputs

- Underline inline links. Resource links may look like buttons; navigation uses active borders and weight instead of underlines.
- Use a shared 44px minimum height, 15px semibold labels, 8px × 16px padding, and 4px radius for buttons and resource links.
- Default: white surface with a visible gray border. Hover: pale blue surface and blue border. Selected tabs: blue surface, white text, and `aria-selected="true"`.
- Every keyboard target needs a visible 2px focus outline with space around it. Never remove an outline without a replacement.
- Associate inputs with labels; retain native radio/slider keyboard behavior. Use 44px radio-label and range-input hit areas.
- Tabs support arrows and Home/End, with only the selected tab in the normal Tab sequence. Selected state must be exposed to assistive technology.

## Responsive and accessible behavior

- Keep the fixed right-hand contents sidebar at viewport widths of 1100px and above, including active section/subsection tracking. Reserve space for it on laptop screens rather than overlaying the article. Below 1100px, use compact top navigation.
- Maintain body/caption sizes on phones; scale headings modestly. Wrap resource buttons and tab groups.
- Collapse multi-column interactive content before controls become cramped. Allow horizontal scrolling only inside tables, code, and compact navigation.
- Keep skip navigation, visible keyboard focus, meaningful link labels, and reduced-motion support.
- Verify at 390px, 768px, and desktop widths, plus enlarged text/zoom. Check horizontal overflow, captions, tab switching, slider labels, and table scrolling.

## Maintenance

- `theme.css`: typography, spacing, color, and control tokens.
- `styles.css`: shared components and responsive layout.
- `templates/sections/*.html`: semantic structure and tables.
- `content/*.md`: research prose; keep block keys unchanged.
- `index.html`: generated; run `python3 build.py` after template/content edits.

Prefer existing component rules and tokens to one-off inline styles. Validate the build and inspect both desktop and mobile after changes. CSS does not require a rebuild.
