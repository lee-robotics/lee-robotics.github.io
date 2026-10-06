// profile.js — PI profile page, rendered from profile/profile.json.

const PROFILE_URL = 'profile/profile.json';

// Mosaic presets: [columns, rows] per tile on a 4-column grid.
// "custom" takes each tile's own cols/rows from profile.json instead, on
// mosaic.columns columns (default 4).
// "grid" is the other exception: every tile is the same size on a grid of
// `mosaic.columns` columns (default 3) with a fixed aspect ratio.
const MOSAIC_LAYOUTS = {
  custom: [[1, 1]],
  grid: [[1, 1]],
  hero: [[2, 2], [2, 1], [1, 1], [1, 1], [1, 1], [3, 1]],
  even: [[2, 1], [2, 1], [2, 1], [2, 1], [2, 1], [2, 1]],
  strip: [[1, 1], [1, 1], [1, 1], [1, 1], [2, 1], [2, 1]],
  feature: [[4, 2], [1, 1], [1, 1], [1, 1], [1, 1], [4, 1]],
};

/** Whole sections listed in the top-level "hide" array are not rendered. */
function sectionHidden(profile, key) {
  return Array.isArray(profile.hide) && profile.hide.includes(key);
}

/** Entries with "hidden": true stay in the data but are not rendered. */
function visible(list) {
  return (Array.isArray(list) ? list : []).filter((item) => item && item.hidden !== true);
}

function headWithMeta(title, metaNode) {
  const head = el('div', 'section-head');
  head.appendChild(el('h2', '', title));
  if (metaNode) head.appendChild(metaNode);
  return head;
}

function externalLink(label, href, className = '') {
  const link = el('a', className, label);
  link.href = href;
  // Off-site links and PDFs open in a new tab.
  if (/^https?:/i.test(href) || /\.pdf($|[?#])/i.test(href)) {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }
  return link;
}

// ---- Header -----------------------------------------------------------------

function renderHead(profile) {
  const host = document.getElementById('profileHead');
  if (!host) return;
  host.innerHTML = ''; // replaces the static fallback markup kept for crawlers
  document.title = `${profile.name} · Neuromeka AI Lab`;

  const photo = el('div', 'profile-photo');
  if (profile.photo) {
    const img = document.createElement('img');
    img.src = profile.photo;
    img.alt = profile.name;
    photo.appendChild(img);
  }
  host.appendChild(photo);

  const body = el('div', 'profile-body');
  const identity = el('div', 'profile-identity');
  identity.appendChild(el('h1', 'page-title', profile.name));
  if (profile.role) identity.appendChild(el('div', 'profile-role', profile.role));
  if (profile.status) identity.appendChild(el('div', 'profile-status', profile.status));
  body.appendChild(identity);
  if (profile.bio) body.appendChild(el('p', 'profile-bio', profile.bio));
  if (Array.isArray(profile.links) && profile.links.length) {
    const links = el('div', 'profile-links');
    profile.links.forEach((item) => links.appendChild(externalLink(item.label, item.href)));
    body.appendChild(links);
  }
  host.appendChild(body);
}

// ---- Research mosaic --------------------------------------------------------

let profileData = {};

function renderMosaic(mosaic = {}) {
  const host = document.getElementById('profileMosaic');
  if (!host) return;
  const tiles = sectionHidden(profileData, 'mosaic') ? [] : visible(mosaic.tiles);
  if (!tiles.length) { host.hidden = true; return; }

  const layout = MOSAIC_LAYOUTS[mosaic.layout] ? mosaic.layout : 'hero';
  const spans = MOSAIC_LAYOUTS[layout];
  if (layout === 'grid') {
    host.classList.add('mosaic-grid');
    host.style.setProperty('--mosaic-cols', String(Number(mosaic.columns) || 3));
    host.style.setProperty('--mosaic-aspect', mosaic.aspect || '4 / 3');
  } else {
    if (layout === 'custom') host.style.setProperty('--mosaic-cols', String(Number(mosaic.columns) || 4));
    const rowHeight = Number(mosaic.rowHeight) || 150;
    host.style.setProperty('--mosaic-row', `${rowHeight}px`);
    // Row height as a fraction of the 912px desktop content width, so narrow
    // screens can scale the same layout down instead of restacking it.
    host.style.setProperty('--mosaic-row-frac', String(rowHeight / 912));
  }

  // A tile links to its paper: an explicit href, else the project link of the
  // publication with the same title.
  const linkFor = (tile) => tile.href
    || (visible(profileData.publications).find((pub) => pub.title === tile.caption) || {}).link
    || '';

  tiles.forEach((tile, i) => {
    const preset = spans[i % spans.length];
    const cols = layout === 'custom' ? Number(tile.cols) || 1 : preset[0];
    const rows = layout === 'custom' ? Number(tile.rows) || 1 : preset[1];
    const href = linkFor(tile);
    const cell = el(href ? 'a' : 'div', 'mosaic-tile');
    if (href) {
      cell.href = href;
      if (/^https?:/i.test(href)) {
        cell.target = '_blank';
        cell.rel = 'noopener noreferrer';
      }
      cell.setAttribute('aria-label', tile.caption || 'Paper');
    }
    cell.style.gridColumn = `span ${cols}`;
    cell.style.gridRow = `span ${rows}`;
    cell.dataset.cols = String(cols);

    const media = createMediaElement({ src: tile.src, poster: tile.poster, alt: tile.caption || '' });
    if (media) {
      // Per-tile framing: fit "contain" letterboxes instead of cropping;
      // position e.g. "top" or "50% 30%" chooses which part survives a crop.
      if (tile.fit) media.style.objectFit = tile.fit;
      if (tile.position) media.style.objectPosition = tile.position;
      cell.appendChild(media);
    }
    else cell.appendChild(el('span', 'mosaic-placeholder', `Research image ${i + 1}`));
    if (tile.caption) {
      const caption = el('div', 'mosaic-caption');
      caption.appendChild(el('div', 'mosaic-caption-title', tile.caption));
      if (tile.sub) caption.appendChild(el('div', 'mosaic-caption-sub', tile.sub));
      cell.appendChild(caption);
    }
    host.appendChild(cell);
  });
  observeVideos(host);
}

// ---- Two-column list blocks -------------------------------------------------

function dateRow(when, primary, secondary, dateClass = 'date-120') {
  const row = el('div', `dated-row ${dateClass}`);
  row.appendChild(el('div', 'dated-row-when', when));
  const body = el('div');
  body.appendChild(el('div', 'dated-row-primary', primary));
  if (secondary) body.appendChild(el('div', 'dated-row-secondary', secondary));
  row.appendChild(body);
  return row;
}

function column(title, rows) {
  const col = el('div', 'section-rows');
  col.appendChild(headWithMeta(title));
  rows.forEach((row) => col.appendChild(row));
  return col;
}

function renderCareer(profile) {
  const host = document.getElementById('profileCareer');
  if (!host) return;
  if (sectionHidden(profile, 'career')) { host.hidden = true; return; }
  host.appendChild(column('Experience',
    visible(profile.experience).map((w) => dateRow(w.when, w.org, w.role))));
  host.appendChild(column('Education',
    visible(profile.education).map((e) => dateRow(e.when, e.org, e.degree))));
}

// ---- Funding and awards (side by side) ---------------------------------------

function buildFundingColumn(grants) {
  const col = el('div', 'section-rows');
  col.appendChild(headWithMeta('Funding'));
  grants.forEach((g) => {
    const row = el('div', 'funding-row');
    row.appendChild(el('div', 'dated-row-when', g.when || ''));
    const body = el('div', 'funding-body');
    body.appendChild(g.link ? externalLink(g.title, g.link, 'funding-title') : el('div', 'funding-title', g.title));
    if (g.program) body.appendChild(el('div', 'funding-program', g.program));
    if (g.role) body.appendChild(el('div', 'funding-role', g.role));
    if (g.partners) body.appendChild(el('div', 'funding-meta', `Partners: ${g.partners}`));
    const press = visible(g.press).filter((item) => item.label && item.href);
    if (press.length) {
      const line = el('div', 'funding-meta funding-press', 'Press:');
      press.forEach((item) => line.appendChild(externalLink(item.label, item.href)));
      body.appendChild(line);
    }
    if (g.amount) body.appendChild(el('div', 'funding-amount', g.amount));
    row.appendChild(body);
    col.appendChild(row);
  });
  return col;
}

function renderFundingAwards(profile) {
  const host = document.getElementById('profileFundingAwards');
  if (!host) return;
  const grants = sectionHidden(profile, 'funding') ? [] : visible(profile.funding);
  const awards = sectionHidden(profile, 'awards') ? [] : visible(profile.awards);
  if (grants.length) host.appendChild(buildFundingColumn(grants));
  if (awards.length) {
    host.appendChild(column('Awards',
      awards.map((h) => dateRow(String(h.year), h.title, h.by, 'date-48'))));
  }
  if (!grants.length && !awards.length) host.hidden = true;
}

function renderStudents(profile) {
  const host = document.getElementById('profileStudents');
  if (!host) return;
  const students = sectionHidden(profile, 'students') ? [] : visible(profile.students);
  if (!students.length) { host.hidden = true; return; }
  host.appendChild(headWithMeta('Former students & mentees'));
  students.forEach((s) => {
    const row = el('div', 'student-row');
    row.appendChild(s.link ? externalLink(s.name, s.link, 'student-name') : el('div', 'student-name', s.name));
    if (s.note) row.appendChild(el('div', 'student-note', s.note));
    host.appendChild(row);
  });
}

// ---- Publications -----------------------------------------------------------

/** Author list with the profile owner's name set in <strong>. */
function buildAuthors(authors, ownName) {
  const node = el('div', 'pub-authors');
  if (!ownName || !authors.includes(ownName)) {
    node.textContent = authors;
    return node;
  }
  authors.split(ownName).forEach((part, index) => {
    if (index) node.appendChild(el('strong', '', ownName));
    if (part) node.append(part);
  });
  return node;
}

function renderPublications(profile) {
  const host = document.getElementById('profilePubs');
  if (!host) return;
  if (sectionHidden(profile, 'publications')) { host.hidden = true; return; }
  const scholar = profile.scholarUrl
    ? externalLink('Full list on Google Scholar →', profile.scholarUrl, 'section-head-link')
    : null;
  host.appendChild(headWithMeta('Selected publications', scholar));

  visible(profile.publications).forEach((pub) => {
    const row = el('div', 'pub-row');
    row.appendChild(el('div', 'pub-year', String(pub.year)));
    const body = el('div', 'pub-body');
    body.appendChild(el('div', 'pub-title', pub.title));
    if (pub.authors) body.appendChild(buildAuthors(pub.authors, profile.name));
    const meta = el('div', 'pub-meta');
    if (pub.venue) meta.appendChild(el('span', 'pub-venue', pub.venue));
    if (pub.award) meta.appendChild(el('span', 'badge', pub.award));
    // An in-site project page (projects/<name>/) comes before the paper link.
    if (pub.project) meta.appendChild(externalLink('Project page →', pub.project));
    if (pub.link) meta.appendChild(externalLink('Link', pub.link));
    body.appendChild(meta);
    row.appendChild(body);
    host.appendChild(row);
  });
}

// ---- Talks ------------------------------------------------------------------

function renderTalks(profile) {
  const host = document.getElementById('profileTalks');
  if (!host) return;
  const talks = sectionHidden(profile, 'talks') ? [] : visible(profile.talks);
  if (!talks.length) { host.hidden = true; return; }

  // Talks marked "selected": true are shown; the full list sits behind a toggle.
  // With nothing marked, every talk is shown and there is no toggle.
  const selected = talks.filter((t) => t.selected === true);
  const collapsible = selected.length > 0 && selected.length < talks.length;
  const heading = el('h2', '', collapsible ? 'Selected talks' : 'Invited talks & lectures');
  const head = el('div', 'section-head');
  head.appendChild(heading);
  if (collapsible) {
    const toggle = el('button', 'section-head-link section-toggle');
    toggle.type = 'button';
    const sync = (expanded) => {
      toggle.setAttribute('aria-expanded', String(expanded));
      toggle.textContent = expanded ? 'Show selected' : `Full list (${talks.length}) →`;
      heading.textContent = expanded ? 'Invited talks & lectures' : 'Selected talks';
      host.querySelectorAll('.talk-row-extra').forEach((row) => { row.hidden = !expanded; });
    };
    toggle.addEventListener('click', () => sync(toggle.getAttribute('aria-expanded') !== 'true'));
    head.appendChild(toggle);
    host.appendChild(head);
    queueMicrotask(() => sync(false));
  } else {
    head.appendChild(el('span', 'section-meta', `${talks.length} talk${talks.length === 1 ? '' : 's'}`));
    host.appendChild(head);
  }

  talks.forEach((t) => {
    const row = el('div', collapsible && t.selected !== true ? 'talk-row talk-row-extra' : 'talk-row');
    row.appendChild(el('div', 'talk-date', t.date));
    const title = el('div', 'talk-title');
    title.appendChild(el('span', 'talk-title-text', t.title));
    if (t.link) title.appendChild(externalLink('Video', t.link));
    row.appendChild(title);
    const venue = el('div', 'talk-venue', t.venue || '');
    if (t.country) venue.appendChild(el('span', 'talk-country', t.country));
    row.appendChild(venue);
    host.appendChild(row);
  });
}

// ---- Boot -------------------------------------------------------------------

fetchJson(PROFILE_URL)
  .then((profile) => {
    profileData = profile;
    renderHead(profile);
    renderMosaic(profile.mosaic);
    renderCareer(profile);
    renderFundingAwards(profile);
    renderPublications(profile);
    renderStudents(profile);
    renderTalks(profile);
  })
  .catch(() => {
    const host = document.getElementById('profileHead');
    if (host) host.appendChild(el('p', 'list-empty', 'Could not load profile/profile.json.'));
  });
