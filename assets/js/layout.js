// layout.js — injects the shared header/footer partials and marks the current nav link.
// Pages in sub-folders (projects/<name>/index.html) load this script from ../../;
// the partials are fetched from that same root and their relative links rebased.

const SITE_ROOT = (() => {
  const src = (document.currentScript && document.currentScript.getAttribute('src')) || '';
  const match = src.match(/^(.*?)assets\/js\/layout\.js/);
  return match ? match[1] : '';
})();

function markCurrentNav(container) {
  const file = window.location.pathname.split('/').pop() || 'index.html';
  // The home page marks no link as current (the design leaves Home unmarked
  // even though "Team" now points there); other pages mark their own link.
  if (file === 'index.html') return;
  container.querySelectorAll('nav a').forEach((link) => {
    if (link.getAttribute('href') === file) link.setAttribute('aria-current', 'page');
  });
}

/** Prefix relative href/src values in a partial so they resolve from a sub-folder. */
function rebaseLinks(container) {
  if (!SITE_ROOT) return;
  container.querySelectorAll('[href], [src]').forEach((node) => {
    ['href', 'src'].forEach((attr) => {
      const value = node.getAttribute(attr);
      if (value && !/^(?:[a-z][a-z0-9+.-]*:|\/\/|\/|#)/i.test(value)) node.setAttribute(attr, SITE_ROOT + value);
    });
  });
}

function loadPartial(hostId, path, onLoad) {
  const host = document.getElementById(hostId);
  if (!host) return;
  fetch(SITE_ROOT + path)
    .then((res) => (res.ok ? res.text() : Promise.reject(new Error(res.status))))
    .then((markup) => {
      host.innerHTML = markup;
      rebaseLinks(host);
      if (onLoad) onLoad(host);
    })
    .catch(() => {});
}

loadPartial('siteHeader', 'assets/header.html', markCurrentNav);
loadPartial('siteFooter', 'assets/footer.html');
