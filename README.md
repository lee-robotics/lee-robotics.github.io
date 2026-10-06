# Neuromeka AI Lab pages

Static two-page site hosted on GitHub Pages (moved from the internal GitLab on 2026-09-17):

- **Home** (`index.html`): hero with image slider and about copy, PI card, research list (`#research`), and the team blocks (`#team`: team, collaborators and partner labs, open positions).
- **PI Profile** (`profile.html`): header, research mosaic, experience and education, selected publications, awards and students, invited talks.
- **Project pages** (`projects/<name>/index.html`): standalone paper pages for the soldering (`projects/solder/`) and reflex (`projects/reflex/`) work, on the same shell and design tokens as the rest of the site.

Individual research posts open on `post.html`. Content is markdown-first so updates are simple.

## Editing content

- **Hero**: `content/hero.md` holds `# Title` and `Kicker: …`. The paragraphs beside it come from `content/about.md` (markdown; `**bold**` renders in the accent colour). Slider images are `heroImages: [{ "src", "alt" }, …]` in `content/home.json`; with two or more the slider auto-advances (`heroIntervalMs`, default 6000), pauses on hover, and shows dots.
- **PI card** under the hero: the `piCard` object in `content/home.json` (photo, kicker, name, summary, link).
- **Research posts**: add a Markdown file under `posts/` and list it in `posts/posts.json`. Front matter keys: `Title`, `Date` (YYYY-MM-DD, used for newest-first ordering), `Author`, `Description`, `Image` (a still, or an `.mp4` that plays muted in the list, with `ThumbnailPoster` as its poster), optional `Publication`, `Publication Link` (`[Label](url)`, comma-separated), `DOI`, and `ProjectUrl` (e.g. `projects/solder/`): with it the card on the home page opens that project page instead of the post, and the post page gets a "Project page →" link.
- **Project pages**: `projects/solder/` is plain HTML (`index.html` + a short `styles.css`); edit it directly. `projects/reflex/` is generated: edit the text in `projects/reflex/content/*.md` or the structure in `projects/reflex/templates/`, then run `python3 projects/reflex/build.py` to regenerate its `index.html` (see `projects/reflex/README.md`). Both pages load the site stylesheet and the header/footer partials from `../../`, so `assets/css/styles.css` (the `Project pages` block holds the shared head, section nav and figure styles) and `assets/js/layout.js` are the places to change their shell. To add a page, copy `projects/solder/`, keep the `../../` references, and list it in `sitemap.xml`.
- **Team**: `team/team.md`
  - `# Group` starts a block (the first block's heading gets the "N members · Seoul" note from `Meta: Seoul`).
  - `## Name | Role` starts a person, followed by `Image: path`, optional `Link: [Google Scholar](url)`, optional `Profile: profile.html` (rendered as "Profile →"), and `- credential` bullets.
  - `### Partner labs` starts the logo grid; one bullet per lab: `- [Name](url) | Institution | media/partner_logos/x.svg` (the logo is optional and shows small to the right of the name; the three current marks are public-domain files from Wikimedia Commons).
- **Open positions**: `team/hiring.md`. `# Open positions` with a `Contact: …` line, then `## Title` per opening with `Location: …` and bullets: the first bullet is the requirement, the rest are joined with " · ". A `Hidden: true` line under the `# Open positions` heading (or under any `# Group` heading in `team/team.md`) switches the whole section off without deleting it; remove the line or set it to `false` to show it again.
- **PI profile**: `profile/profile.json`. Any entry in any of its lists can be switched off without deleting it by adding `"hidden": true`; a whole section is switched off by naming it in the top-level `hide` list, e.g. `"hide": ["students"]` (keys: `mosaic`, `career`, `funding`, `awards`, `publications`, `students`, `talks`). Header fields (`name`, `photo`, `role`, optional green `status` line, `bio`, `links`, `scholarUrl`), then `experience`, `education`, `funding` (when, title, program, role, partners, amount, optional link on the title, optional `press` list of `{label, href}` articles), `publications` (year, title, authors, venue, optional award and link, optional `project`: the path of an in-site project page such as `projects/reflex/`, shown as "Project page →"), `awards`, `students`, `talks` (date, title, venue, country, optional `link` to a recording, shown as "Video"; talks with `"selected": true` are the ones shown under "Selected talks", the rest sit behind the "Full list" toggle, and the CV always lists them all). The `mosaic` block lists the tiles, each with a `caption` (paper title), optional `sub` (venue · year), optional `href` (the tile links there; without it, a publication with the same title lends its `link`) and an optional `src` (image or `.mp4`, plus `poster`); tiles without a source show a placeholder. `mosaic.layout` is `custom` (each tile sets its own `cols`/`rows` on a grid of `mosaic.columns` columns, default 4, whose row height is `mosaic.rowHeight` px; optional `position` such as `"top"` picks the part of a photo that survives cropping, `fit: "contain"` letterboxes instead), `grid` (equal tiles, `mosaic.columns` per row, `mosaic.aspect`), or one of the fixed mosaics `hero`, `even`, `strip`, `feature`. Photos go under `media/profile/`, downscaled to about 1200px wide. The CV, `media/cv.pdf`, is generated from the same data: run `python3 tools/build_cv.py` (needs Chrome; add `--html` to keep the intermediate `tools/cv.html`). It respects the `hidden` and `hide` switches, so it always matches the page.
- **Header/footer**: `assets/header.html`, `assets/footer.html`.
- **Scripts**: `assets/js/shared.js` holds the helpers; `home.js` + `team.js` render the home page, `profile.js` the profile, `post.js` a post. Markdown is rendered in the browser by [marked](https://github.com/markedjs/marked), pinned to v15 on jsDelivr in `index.html` and `post.html`.
- **Design tokens** (colours, fonts, 960px column) live at the top of `assets/css/styles.css`. Fonts are Inter (body) and Barlow Condensed (headings) from Google Fonts.

`sources.html` (open-source repositories from `sources/repos.json`) is kept but not linked from the navigation.

## Hosting (GitHub Pages)

The site is served straight from the `main` branch root of `lee-robotics/lee-robotics.github.io`; there is no build step.

- Repository settings → **Pages** → Source: *Deploy from a branch* → Branch: `main`, folder `/ (root)`.
- Published URL: `https://lee-robotics.github.io/` (a user/organisation site, so it lives at the domain root).
- `.nojekyll` at the root tells GitHub to publish the files as-is instead of running Jekyll.
- All links and fetches are relative, so the site also works under a repository sub-path or a custom domain without any base-URL config. For a custom domain, add a `CNAME` file containing the domain and point the domain's DNS at `lee-robotics.github.io`.
- Videos are committed as regular files. Do **not** put them in Git LFS: GitHub Pages serves LFS pointer files, not the media.
- Keep media small: list thumbnails are 640px-wide H.264 MP4s, project videos 720p (540p for the multi-minute peg-insertion clips) at `-crf 28`, stills WebP or JPEG at no more than 1600px wide. The ffmpeg recipe used for every clip here was
  `ffmpeg -i in.mp4 -vf scale=960:-2 -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p -profile:v high -movflags +faststart -an out.mp4`
  (all the supplied clips had silent audio tracks, hence `-an`; use `-c:a aac -b:a 64k` when there is sound).

Every push to `main` redeploys the site within a minute or two.

## Search engines

`profile.html` and `index.html` carry canonical URLs, Open Graph tags and JSON-LD (`Person` / `ResearchOrganization`), and the profile header is also present as static HTML so crawlers see the name without running scripts. `robots.txt` and `sitemap.xml` list the pages. After content changes that add pages, regenerate the sitemap entries (posts are listed by file name). To get indexed and ranked for a name search: verify the site in Google Search Console and submit the sitemap, and link to `https://lee-robotics.github.io/profile.html` as the homepage on Google Scholar, LinkedIn, GitHub, ORCID and in paper author footers; links from those profiles are what rank a personal page for a common name.

## Run locally

This site is static. Serve the repo root with any local web server, for example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.
