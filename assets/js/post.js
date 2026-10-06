// post.js — renders one Markdown post, chosen with ?file=posts/<name>.md
// There was no design reference for this page; it follows the shared tokens.

const postContainer = document.getElementById('post');
const postFile = new URLSearchParams(window.location.search).get('file');

function buildPaper(post) {
  const paper = el('div', 'paper');

  if (post.publication) {
    const citation = el('div', 'paper-citation');
    const label = el('strong', '', 'Publication: ');
    citation.append(label);
    appendInlineMarkdown(citation, post.publication);
    paper.appendChild(citation);
  }

  const links = el('div', 'paper-links');
  if (post.projectUrl) {
    const project = el('a', '', 'Project page →');
    project.href = post.projectUrl;
    links.appendChild(project);
  }
  if (post.publicationLink) appendInlineMarkdown(links, post.publicationLink);
  if (post.doi) links.appendChild(el('span', '', `DOI: ${post.doi}`));
  if (links.childNodes.length) paper.appendChild(links);

  return paper;
}

function renderPost(post) {
  document.title = `${post.title} · Neuromeka AI Lab`;
  postContainer.innerHTML = '';

  const back = el('a', 'post-back', '← Research');
  back.href = RESEARCH_URL;
  postContainer.appendChild(back);

  const head = el('div', 'post-head');
  if (post.date || post.authors) head.appendChild(createMetaLine(post, 'post-head-meta'));
  head.appendChild(el('h1', '', post.title));
  if (post.description) head.appendChild(el('p', 'post-head-desc', post.description));
  postContainer.appendChild(head);

  if (post.publication || post.publicationLink || post.doi || post.projectUrl) {
    postContainer.appendChild(buildPaper(post));
  }

  const body = el('div', 'markdown');
  body.innerHTML = marked.parse(post.body);
  postContainer.appendChild(body);
}

if (postContainer && !postFile) {
  postContainer.appendChild(el('p', 'list-empty', 'No post specified. Use ?file=posts/your-post.md'));
} else if (postContainer) {
  fetchText(postFile)
    .then((markdown) => {
      const { meta, body } = parseFrontMatter(markdown);
      renderPost({ ...buildPostData(meta, postFile), body });
    })
    .catch(() => {
      postContainer.appendChild(el('p', 'list-empty', 'Could not load this post.'));
    });
}
