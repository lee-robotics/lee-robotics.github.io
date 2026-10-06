// shared.js — helpers used by the page scripts.
// Loaded after layout.js and before the page script; everything here is a plain global.

const HOME_CONFIG_URL = 'content/home.json';
const POSTS_INDEX_URL = 'posts/posts.json';
const POSTS_DIR = 'posts/';
const RESEARCH_URL = 'index.html#research';
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg'];

// ---- Fetching ---------------------------------------------------------------

function checkResponse(res) {
  if (!res.ok) throw new Error(`${res.status} ${res.url}`);
  return res;
}

function fetchText(url) {
  return fetch(url).then(checkResponse).then((res) => res.text());
}

function fetchJson(url) {
  return fetch(url).then(checkResponse).then((res) => res.json());
}

/** Load content/home.json; resolves to {} when it is missing or invalid. */
function loadHomeConfig() {
  return fetchJson(HOME_CONFIG_URL).catch(() => ({}));
}

// ---- Markdown front matter --------------------------------------------------

const META_LINE = /^([A-Za-z][A-Za-z0-9 _-]*):\s*(.*)$/;

/** "Publication Link" → "publicationlink" */
function metaKey(name) {
  return name.trim().toLowerCase().replace(/\s+/g, '');
}

/**
 * Parse a markdown file's front matter.
 * Supports YAML-style front matter (--- ... ---) or the legacy layout
 * (# Title followed by key: value lines).
 * Returns { meta, body }.
 */
function parseFrontMatter(markdown) {
  const lines = markdown.split('\n');
  const meta = {};
  const setMeta = (match) => { meta[metaKey(match[1])] = match[2].trim(); };
  let i = 0;

  while (i < lines.length && !lines[i].trim()) i += 1;

  if (i < lines.length && lines[i].trim() === '---') {
    i += 1;
    while (i < lines.length) {
      const line = lines[i].trim();
      if (line === '---') { i += 1; break; }
      const match = line && line.match(META_LINE);
      if (match) setMeta(match);
      i += 1;
    }
  } else {
    if (i < lines.length && lines[i].trim().startsWith('#')) {
      meta.title = lines[i].replace(/^#+\s*/, '').trim();
      i += 1;
    }
    while (i < lines.length && !lines[i].trim()) i += 1;
    for (; i < lines.length; i += 1) {
      const line = lines[i].trim();
      if (!line) { i += 1; break; }
      const match = line.match(META_LINE);
      if (!match) break;
      setMeta(match);
    }
  }

  return { meta, body: lines.slice(i).join('\n').trim() };
}

// ---- Posts ------------------------------------------------------------------

function isVideoSource(path = '') {
  const normalized = path.split('?')[0].toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => normalized.endsWith(ext));
}

/** Normalise parsed front matter into the shape the renderers expect. */
function buildPostData(meta = {}, link = '', fallbackThumbnail = '') {
  const image = meta.thumbnailpath || meta.thumbnail || meta.image || meta.video || meta.videopath || '';
  const poster = meta.thumbnailposter || '';
  return {
    title: meta.title || link,
    description: meta.description || '',
    authors: meta.authors || meta.author || '',
    date: meta.date || '',
    publication: meta.publication || '',
    publicationLink: meta.publicationlink || '',
    doi: meta.doi || '',
    projectUrl: meta.projecturl || '',
    thumbnail: image || poster || fallbackThumbnail,
    thumbnailPoster: poster,
    link,
  };
}

function postUrl(filePath) {
  return `post.html?file=${filePath}`;
}

/**
 * Load every post listed in posts/posts.json, newest first.
 * A post whose file fails to load is kept and titled by its file name.
 */
function loadPosts(fallbackThumbnail = '') {
  return fetchJson(POSTS_INDEX_URL)
    .then((index) => Promise.all((Array.isArray(index) ? index : []).map((entry) => {
      const filePath = POSTS_DIR + entry.file;
      return fetchText(filePath)
        .then((md) => parseFrontMatter(md).meta)
        .catch(() => ({ title: entry.file }))
        .then((meta) => buildPostData(meta, filePath, fallbackThumbnail));
    })))
    .then((posts) => posts.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)));
}

// ---- DOM helpers ------------------------------------------------------------

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== '') node.textContent = text;
  return node;
}

/**
 * A still image, or a silent looping inline video (with poster) when the
 * source is a video file. Returns null when there is no source at all.
 */
function createMediaElement({ src, poster = '', alt = '' }) {
  if (!src) return null;
  if (!isVideoSource(src)) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    img.loading = 'lazy';
    return img;
  }
  const video = document.createElement('video');
  // Property and attribute both set: mobile browsers only autoplay when the
  // attributes are present in the DOM.
  video.muted = true;
  video.setAttribute('muted', '');
  video.loop = true;
  video.setAttribute('loop', '');
  video.autoplay = true;
  video.setAttribute('autoplay', '');
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.preload = 'metadata';
  if (poster) video.poster = poster;
  if (alt) video.setAttribute('aria-label', alt);
  video.src = src;
  return video;
}

/** The post's thumbnail: its video (with poster) when it has one, else the still. */
function createThumbnail(post) {
  return createMediaElement({ src: post.thumbnail, poster: post.thumbnailPoster });
}

// Play list videos only while they are on screen.
const mediaVisibilityObserver = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) target.play().catch(() => {});
      else target.pause();
    });
  }, { threshold: 0.1 })
  : null;

function observeVideos(root) {
  if (!mediaVisibilityObserver || !root) return;
  root.querySelectorAll('video').forEach((video) => mediaVisibilityObserver.observe(video));
}

/** Uppercase meta line: date in accent, authors muted. */
function createMetaLine(post, className) {
  const line = el('div', className);
  if (post.date) line.appendChild(el('span', '', post.date));
  if (post.authors) line.appendChild(el('span', 'post-row-authors', post.authors));
  return line;
}

/**
 * Append a minimal subset of inline markdown to `parent` as DOM nodes:
 *   [text](url)  →  <a href="url">text</a>   (external links open in a new tab)
 *   **text**     →  <strong>text</strong>
 * Everything else is inserted as plain text, so content never reaches innerHTML.
 */
function appendInlineMarkdown(parent, text) {
  const pattern = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) parent.append(text.slice(last, match.index));
    if (match[1] !== undefined) {
      const link = document.createElement('a');
      link.href = match[2];
      if (/^https?:/i.test(match[2])) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
      appendInlineMarkdown(link, match[1]);
      parent.appendChild(link);
    } else {
      const strong = document.createElement('strong');
      appendInlineMarkdown(strong, match[3]);
      parent.appendChild(strong);
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) parent.append(text.slice(last));
}

/** Split "[Label](url) | Institution | logo.png" into its parts. */
function splitPipes(text) {
  return text.split('|').map((part) => part.trim());
}

/** Pull the first [label](href) out of a line; returns null when there is none. */
function parseMarkdownLink(text) {
  const match = text.match(/\[([^\]]+)\]\(([^)]+)\)/);
  return match ? { label: match[1].trim(), href: match[2].trim() } : null;
}
