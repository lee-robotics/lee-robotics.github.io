// home.js — home page: hero slider + about copy, PI card, and the research list.
// The team blocks further down the page are rendered by team.js.

const DEFAULT_HERO_COPY_URL = 'content/hero.md';
const DEFAULT_HERO_IMAGE = 'media/hero/eir_gemini.jpg';
const DEFAULT_HERO_INTERVAL_MS = 6000;

// ---- Hero copy and about text ----------------------------------------------

function renderHeroCopy(url) {
  return fetchText(url)
    .then((markdown) => {
      const { meta } = parseFrontMatter(markdown);
      const kicker = document.getElementById('heroKicker');
      const title = document.getElementById('heroTitle');
      if (kicker) kicker.textContent = meta.kicker || '';
      if (title) title.textContent = meta.title || '';
    })
    .catch(() => {});
}

function renderAbout(url) {
  const target = document.getElementById('aboutContent');
  if (!url || !target) return Promise.resolve();
  return fetchText(url)
    .then((markdown) => { target.innerHTML = marked.parse(markdown); })
    .catch(() => {});
}

// ---- Hero image slider ------------------------------------------------------

/** Accepts {heroImages: [{src, alt}]} or the older single heroImage / heroImageAlt pair. */
function resolveHeroImages(config) {
  if (Array.isArray(config.heroImages) && config.heroImages.length) {
    return config.heroImages.filter((item) => item && item.src);
  }
  return [{ src: config.heroImage || DEFAULT_HERO_IMAGE, alt: config.heroImageAlt || '' }];
}

function renderHeroSlider(images, intervalMs) {
  const figure = document.getElementById('heroFigure');
  const track = document.getElementById('heroTrack');
  const dotsHost = document.getElementById('heroDots');
  if (!figure || !track || !dotsHost) return;

  track.innerHTML = '';
  dotsHost.innerHTML = '';
  images.forEach((item) => {
    const img = document.createElement('img');
    img.src = item.src;
    img.alt = item.alt || '';
    track.appendChild(img);
  });

  if (images.length <= 1) {
    dotsHost.hidden = true;
    return;
  }

  let index = 0;
  let paused = false;
  const dots = images.map((_, i) => {
    const dot = el('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Go to image ${i + 1}`);
    dot.addEventListener('click', () => show(i));
    dotsHost.appendChild(dot);
    return dot;
  });

  function show(i) {
    index = (i + images.length) % images.length;
    track.style.transform = `translateX(${-index * 100}%)`;
    dots.forEach((dot, j) => dot.setAttribute('aria-current', String(j === index)));
  }

  show(0);
  figure.addEventListener('mouseenter', () => { paused = true; });
  figure.addEventListener('mouseleave', () => { paused = false; });
  setInterval(() => { if (!paused) show(index + 1); }, intervalMs);
}

// ---- PI card ----------------------------------------------------------------

function renderPiCard(card) {
  const host = document.getElementById('piCard');
  if (!host || !card || !card.name) return;
  host.innerHTML = '';
  host.href = card.href || 'profile.html';

  const photo = el('div', 'pi-card-photo');
  if (card.photo) {
    const img = document.createElement('img');
    img.src = card.photo;
    img.alt = card.name;
    photo.appendChild(img);
  }
  host.appendChild(photo);

  const body = el('div', 'pi-card-body');
  if (card.kicker) body.appendChild(el('div', 'pi-card-kicker', card.kicker));
  body.appendChild(el('div', 'pi-card-name', card.name));
  if (card.summary) body.appendChild(el('div', 'pi-card-summary', card.summary));
  host.appendChild(body);

  host.appendChild(el('div', 'pi-card-cta', card.cta || 'Profile →'));
  host.hidden = false;
}

// ---- Research list ----------------------------------------------------------

const postList = document.getElementById('postList');
const postCount = document.getElementById('postCount');

function buildPostRow(post) {
  const row = el('a', 'post-row');
  // A post with a standalone project page (ProjectUrl: projects/<name>/) links there.
  row.href = post.projectUrl || postUrl(post.link);

  const thumbnail = createThumbnail(post);
  if (thumbnail) {
    const media = el('div', 'post-row-media');
    media.appendChild(thumbnail);
    row.appendChild(media);
  }

  const body = el('div', 'post-row-body');
  body.appendChild(createMetaLine(post, 'post-row-meta'));
  body.appendChild(el('h3', '', post.title));
  if (post.description) body.appendChild(el('p', 'post-row-desc', post.description));
  if (post.publication) body.appendChild(el('div', 'post-row-publication', post.publication));
  row.appendChild(body);
  return row;
}

function renderPosts(posts) {
  if (!postList) return;
  postList.innerHTML = '';
  posts.forEach((post) => postList.appendChild(buildPostRow(post)));
  observeVideos(postList);
  if (postCount) {
    postCount.textContent = `${posts.length} post${posts.length === 1 ? '' : 's'} · newest first`;
  }
}

// ---- Boot -------------------------------------------------------------------

loadHomeConfig()
  .then((config) => {
    const heroCopyUrl = typeof config.heroCopyUrl === 'string' && config.heroCopyUrl.trim()
      ? config.heroCopyUrl.trim()
      : DEFAULT_HERO_COPY_URL;
    renderHeroCopy(heroCopyUrl);
    renderAbout(typeof config.aboutUrl === 'string' ? config.aboutUrl.trim() : '');
    renderHeroSlider(resolveHeroImages(config), Number(config.heroIntervalMs) || DEFAULT_HERO_INTERVAL_MS);
    renderPiCard(config.piCard);
    return loadPosts(config.fallbackThumbnail || '');
  })
  .then(renderPosts)
  .catch(() => {
    if (postList) {
      postList.appendChild(el('p', 'list-empty',
        'No posts yet. Add Markdown files under /posts and list them in posts/posts.json.'));
    }
  });
