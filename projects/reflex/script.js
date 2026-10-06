'use strict';

// Scroll position is the source of truth, including when several sections are visible.
const sectionLinks = [...document.querySelectorAll('.section-nav .project-nav-inner > a')];
const sections = sectionLinks.map(link => document.querySelector(link.getAttribute('href')));
const subsectionMenus = sections.map((section, index) => {
  const headings = [...section.querySelectorAll('h3[id], h4[id]')]
    .filter(heading => !heading.closest('.insertion-videos'));
  if (!headings.length) return null;
  const menu = document.createElement('div');
  menu.className = 'subsection-nav';
  menu.id = `${section.id}-subnav`;
  menu.hidden = true;
  const links = headings.map(heading => {
    const link = document.createElement('a');
    link.href = `#${heading.id}`;
    link.textContent = heading.dataset.navLabel || heading.textContent;
    link.className = heading.tagName === 'H4' ? 'nested-subsection' : '';
    menu.append(link);
    return link;
  });
  sectionLinks[index].setAttribute('aria-controls', menu.id);
  sectionLinks[index].setAttribute('aria-expanded', 'false');
  sectionLinks[index].after(menu);
  return { menu, headings, links };
});
let scrollQueued = false;
function updateSection() {
  const threshold = window.innerHeight * 0.35;
  let active = sections[0];
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= threshold) active = section;
  }
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 5) active = sections.at(-1);
  for (const link of sectionLinks) {
    if (link.hash === `#${active.id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
  subsectionMenus.forEach((entry, index) => {
    if (!entry) return;
    const expanded = sections[index] === active;
    entry.menu.hidden = !expanded;
    sectionLinks[index].setAttribute('aria-expanded', String(expanded));
    let current = -1;
    if (expanded) entry.headings.forEach((heading, i) => {
      if (heading.getBoundingClientRect().top <= threshold) current = i;
    });
    entry.links.forEach((link, i) => {
      if (i === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  });
  scrollQueued = false;
}
window.addEventListener('scroll', () => {
  if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateSection); }
}, { passive: true });
window.addEventListener('resize', updateSection);
updateSection();

// Enhance each tolerance group with offset tabs comparing both methods together.
for (const group of document.querySelectorAll('.insertion-videos')) {
  const heading = group.querySelector('.tolerance-heading');
  const methods = [...group.querySelectorAll('.insertion-video-grid')].map(grid => ({
    grid,
    heading: grid.previousElementSibling,
    figures: [...grid.querySelectorAll('figure')]
  }));
  const tablist = document.createElement('div');
  tablist.className = 'offset-tabs';
  tablist.setAttribute('role', 'tablist');
  tablist.setAttribute('aria-label', `Offsets for ${heading.textContent}`);
  group.append(tablist);
  const tabs = [], panels = [];
  methods[0].figures.forEach((figure, index) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.id = `${heading.id}-tab-${index}`;
    tab.textContent = figure.querySelector('figcaption').textContent;
    tab.setAttribute('role', 'tab');
    const panel = document.createElement('div');
    panel.id = `${heading.id}-panel-${index}`;
    panel.className = 'insertion-columns offset-panel';
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.tabIndex = 0;
    tab.setAttribute('aria-controls', panel.id);
    for (const method of methods) {
      const column = document.createElement('div');
      column.className = 'insertion-column';
      const label = document.createElement('p');
      label.className = 'method-label';
      label.textContent = method.heading.textContent;
      column.append(label, method.figures[index]);
      panel.append(column);
    }
    tab.addEventListener('click', () => select(index));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      select(next);
      tabs[next].focus();
    });
    tabs.push(tab);
    panels.push(panel);
    tablist.append(tab);
    group.append(panel);
  });
  function select(index) {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
      if (i !== index) panels[i].querySelectorAll('video').forEach(video => video.pause());
    });
  }
  methods.forEach(method => { method.heading.remove(); method.grid.remove(); });
  select(0);
}

// Select a tolerance before choosing an offset within its comparison panel.
const toleranceGroups = [...document.querySelectorAll('#peg-results > .insertion-videos')];
if (toleranceGroups.length) {
  const tablist = document.createElement('div');
  tablist.className = 'offset-tabs tolerance-tabs';
  tablist.setAttribute('role', 'tablist');
  tablist.setAttribute('aria-label', 'Insertion tolerance');
  toleranceGroups[0].before(tablist);
  const tabs = toleranceGroups.map((group, index) => {
    const heading = group.querySelector('.tolerance-heading');
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.id = `${heading.id}-selector`;
    tab.textContent = heading.textContent.replace(' tolerance', '');
    tab.setAttribute('role', 'tab');
    group.id = `${heading.id}-videos`;
    group.setAttribute('role', 'tabpanel');
    group.setAttribute('aria-labelledby', tab.id);
    group.tabIndex = 0;
    tab.setAttribute('aria-controls', group.id);
    heading.hidden = true;
    tab.addEventListener('click', () => selectTolerance(index));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      selectTolerance(next);
      tabs[next].focus();
    });
    tablist.append(tab);
    return tab;
  });
  function selectTolerance(index) {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      toleranceGroups[i].hidden = i !== index;
      if (i !== index) toleranceGroups[i].querySelectorAll('video').forEach(video => video.pause());
    });
    updateSection();
  }
  selectTolerance(0);
}

// Hardware success counts have their own clearance selector, independent of video tabs.
for (const card of document.querySelectorAll('.insertion-success-card')) {
  const controls = card.querySelector('.insertion-success-controls');
  const tabs = [...card.querySelectorAll('[role="tab"]')];
  const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
  // This card style is also used by static tables with no clearance controls.
  if (!controls || !tabs.length || panels.some(panel => !panel)) continue;
  function selectSuccessTable(index) {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectSuccessTable(index));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      selectSuccessTable(next);
      tabs[next].focus();
    });
  });
  // The captions identify both tables when JavaScript is unavailable; tabs do so otherwise.
  card.querySelectorAll('caption').forEach(caption => { caption.hidden = true; });
  selectSuccessTable(0);
  controls.hidden = false;
}

// Load only the selected deployment clip; native radios provide arrow-key navigation.
const pegDeployment = document.querySelector('#peg-deployment');
if (pegDeployment) {
  const controls = pegDeployment.querySelector('.peg-video-controls');
  const video = pegDeployment.querySelector('video');
  const source = video.querySelector('source');
  const offsets = [...controls.querySelectorAll('[name="peg-offset"]')];
  const status = pegDeployment.querySelector('.peg-video-status');

  function selectPegVideo() {
    const clearance = controls.querySelector('[name="peg-clearance"]:checked');
    offsets.forEach(input => {
      const unavailable = input.value === '13' && clearance.value === '0_02';
      input.disabled = unavailable;
      input.closest('label').hidden = unavailable;
      if (unavailable && input.checked) offsets[0].checked = true;
    });
    const offset = controls.querySelector('[name="peg-offset"]:checked').value;
    const base = `${pegDeployment.dataset.videoRoot}/${clearance.value}-${offset}`;
    if (source.getAttribute('src') !== `${base}.mp4`) {
      video.pause();
      status.hidden = true;
      video.poster = `${base}.webp`;
      source.src = `${base}.mp4`;
      video.load();
    }
    video.setAttribute('aria-label', `Peg-in-hole policy deployment: ${clearance.dataset.label} mm clearance, ${offset} mm offset`);
    pegDeployment.querySelector('[data-peg-clearance]').textContent = clearance.dataset.label;
    pegDeployment.querySelector('[data-peg-offset]').textContent = offset;
  }
  controls.addEventListener('change', selectPegVideo);
  source.addEventListener('error', () => { status.hidden = false; });
  video.addEventListener('error', () => { status.hidden = false; });
  video.addEventListener('loadeddata', () => { status.hidden = true; });
  selectPegVideo();
  controls.hidden = false;
}

// Switch between the full-width flat- and rough-terrain plots for Q1.
for (const card of document.querySelectorAll('.surface-plot-card')) {
  const controls = card.querySelector('.surface-plot-controls');
  const tabs = [...card.querySelectorAll('.surface-terrain-tabs [role="tab"]')];
  const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
  const initial = Math.max(0, tabs.findIndex(tab => tab.getAttribute('aria-selected') === 'true'));
  function selectTerrain(index) {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTerrain(index));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      selectTerrain(next);
      tabs[next].focus();
    });
  });
  selectTerrain(initial);
  controls.hidden = false;
}

// Load one matched box-lifting pair at a time; tab values are commanded depths in cm.
const boxComparison = document.querySelector('#eir-results[data-video-root]');
if (boxComparison) {
  const controls = boxComparison.querySelector('.box-video-controls');
  const tabs = [...boxComparison.querySelectorAll('.box-depth-tabs [role="tab"]')];
  const panel = boxComparison.querySelector('#box-depth-panel');
  const videos = [...panel.querySelectorAll('video')];
  const playButton = boxComparison.querySelector('#box-play-both');
  const replayButton = boxComparison.querySelector('#box-replay-both');
  const status = boxComparison.querySelector('#box-video-status');
  let activeDepth = -1;
  let playbackRequest = 0;

  function showStatus(message) {
    status.textContent = message;
    status.hidden = !message;
  }
  function updatePlaybackButton() {
    playButton.textContent = videos.every(video => !video.paused && !video.ended) ? 'Pause both' : 'Play both';
  }
  function pauseBoth() {
    videos.forEach(video => video.pause());
    updatePlaybackButton();
  }
  function selectDepth(index) {
    if (index === activeDepth) return;
    playbackRequest++;
    pauseBoth();
    activeDepth = index;
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
    const tab = tabs[index];
    const depth = `${tab.dataset.depth} cm`;
    panel.setAttribute('aria-labelledby', tab.id);
    videos.forEach(video => {
      const method = video.dataset.method;
      const base = `${boxComparison.dataset.videoRoot}/${method}/${tab.dataset.clip}`;
      const source = video.querySelector('source');
      if (source.getAttribute('src') !== `${base}.mp4`) {
        video.poster = `${base}.webp`;
        source.src = `${base}.mp4`;
        video.load();
      }
      video.setAttribute('aria-label', `${method === 'ik' ? 'IK' : 'Ours'} at ${depth} commanded penetration depth`);
    });
    showStatus('');
  }
  async function playBoth(restart = false) {
    const request = ++playbackRequest;
    const time = restart || videos.some(video => video.ended) ? 0 : videos[0].currentTime;
    videos.forEach(video => { video.currentTime = time; });
    showStatus('');
    const results = await Promise.allSettled(videos.map(video => video.play()));
    // Switching depth invalidates pending playback promises from the previous pair.
    if (request !== playbackRequest) return;
    if (results.some(result => result.status === 'rejected')) {
      pauseBoth();
      showStatus('Playback could not start. Try again once the videos have loaded, or use their individual play controls.');
    }
    updatePlaybackButton();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectDepth(index));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      selectDepth(next);
      tabs[next].focus();
    });
  });
  playButton.addEventListener('click', () => {
    if (videos.every(video => !video.paused && !video.ended)) {
      playbackRequest++;
      pauseBoth();
    } else {
      playBoth();
    }
  });
  replayButton.addEventListener('click', () => playBoth(true));
  videos.forEach(video => {
    for (const event of ['play', 'pause', 'ended', 'emptied']) video.addEventListener(event, updatePlaybackButton);
  });
  selectDepth(0);
  controls.hidden = false;
}

// Show scrolling guidance only when a font-calibrated SVG is wider than its viewport.
const svgScrollRegions = [...document.querySelectorAll('.svg-scroll[data-scroll-hint]')];
if (svgScrollRegions.length) {
  function updateSvgScrollHints() {
    for (const region of svgScrollRegions) {
      const hint = document.getElementById(region.dataset.scrollHint);
      hint.hidden = region.clientWidth === 0 || region.scrollWidth <= region.clientWidth + 1;
    }
  }
  const svgResizeObserver = new ResizeObserver(updateSvgScrollHints);
  for (const region of svgScrollRegions) {
    svgResizeObserver.observe(region);
    const image = region.querySelector('img');
    if (image) {
      svgResizeObserver.observe(image);
      image.addEventListener('load', updateSvgScrollHints);
    }
  }
  updateSvgScrollHints();
}
