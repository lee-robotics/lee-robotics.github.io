#!/usr/bin/env python3
"""Build the static page from editable text. Python 3, standard library only."""
import argparse
import html
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import time
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent
FIELD = re.compile(r"^## ([a-z0-9-]+)\s*$", re.MULTILINE)
TOKEN = re.compile(r"\{\{(?:(plain):)?([\w.-]+)\}\}")
PARAGRAPH = re.compile(r"<p([^>]*)>\{\{([\w.-]+)\}\}</p>")


def read_content(directory):
    fields = {}
    for path in sorted(directory.glob('*.md')):
        text = path.read_text(encoding='utf-8')
        headings = list(FIELD.finditer(text))
        if not headings:
            raise ValueError(f'{path.name}: no content keys (## key) found')
        for i, heading in enumerate(headings):
            end = headings[i + 1].start() if i + 1 < len(headings) else len(text)
            value = text[heading.end():end].strip()
            key = f'{path.stem}.{heading.group(1)}'
            if key in fields:
                raise ValueError(f'Duplicate content key: {key}')
            if not value:
                raise ValueError(f'Empty content key: {key}')
            fields[key] = value
    return fields


class SectionInfo(HTMLParser):
    """Read section metadata without depending on attribute order or quote style."""
    def __init__(self):
        super().__init__()
        self.first_tag = None
        self.attributes = {}
        self.ids = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if self.first_tag is None:
            self.first_tag = tag
            self.attributes = attrs
        if 'id' in attrs:
            self.ids.append(attrs['id'])


def assemble_template(root):
    shell = (root / 'templates/index.html').read_text(encoding='utf-8')
    sections = []
    for path in (root / 'templates/sections').glob('*.html'):
        match = re.fullmatch(r'(\d+)-([a-z][a-z0-9-]*)', path.stem)
        if not match:
            raise ValueError(f'{path.name}: use an ordered filename such as 60-discussion.html')
        sections.append((int(match[1]), match[2], path))
    if not sections:
        raise ValueError('No section templates found in templates/sections/')
    parts, navigation, ids, slugs = [], [], set(), set()
    for index, (_, slug, path) in enumerate(sorted(sections)):
        if slug in slugs:
            raise ValueError(f'Duplicate section name: {slug}')
        slugs.add(slug)
        if not (root / 'content' / f'{slug}.md').is_file():
            raise ValueError(f'{path.name}: missing content/{slug}.md')
        fragment = path.read_text(encoding='utf-8')
        info = SectionInfo()
        info.feed(fragment)
        if info.first_tag != 'section' or info.attributes.get('id') != slug:
            raise ValueError(f'{path.name}: start with <section id="{slug}" ...>')
        for anchor in info.ids:
            if anchor in ids:
                raise ValueError(f'Duplicate HTML id: {anchor}')
            ids.add(anchor)
        # data-nav is optional; by default use the Markdown heading field.
        label = info.attributes.get('data-nav', '{{plain:' + slug + '.heading}}')
        current = ' aria-current="location"' if index == 0 else ''
        navigation.append(f'    <a href="#{slug}"{current}><span>{index + 1:02d}</span> {html.escape(label)}</a>')
        parts.append(fragment.rstrip())
    for slot in ('sections', 'navigation'):
        if shell.count('{{' + slot + '}}') != 1:
            raise ValueError(f'templates/index.html must contain exactly one {{{{{slot}}}}} slot')
    return shell.replace('{{sections}}', '\n\n'.join(parts)).replace('{{navigation}}', '\n'.join(navigation))


def inline(text):
    """Small documented Markdown subset: bold, emphasis, links, line breaks.

    Raw HTML is escaped. Content can never inject scripts into the layout.
    """
    text = html.escape(text, quote=True)
    def link(match):
        label, escaped_url = match.groups()
        url = html.unescape(escaped_url)
        if any(c.isspace() or ord(c) < 32 for c in url):
            raise ValueError(f'Whitespace is not allowed in link URLs: {url}')
        if urlsplit(url).scheme.lower() not in ('', 'http', 'https', 'mailto'):
            raise ValueError(f'Unsupported link URL: {url}')
        return f'<a href="{escaped_url}">{label}</a>'
    text = re.sub(r'\[([^\]\n]+)\]\(([^)\n]+)\)', link, text)
    text = re.sub(r'\*\*([^*\n]+)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'(?<!\*)\*([^*\n]+)\*(?!\*)', r'<em>\1</em>', text)
    return text.replace('\n', '<br>')


def render(template, fields):
    used = set()
    def get(key):
        used.add(key)
        if key not in fields:
            raise ValueError(f'Missing content key: {key}')
        return fields[key]

    # The same source drives the initial Spring panel and subsequent tab changes.
    primitive_data = {}
    for name in ('spring', 'plane', 'rail'):
        primitive_data[name] = {}
        for field in ('tag', 'title', 'description', 'constraint', 'example', 'formula', 'accessible'):
            value = get(f'primitives.{name}-{field}')
            if '\n' in value or re.search(r'\*|\[[^]]+\]\(', value):
                raise ValueError(f'primitives.{name}-{field}: use a single line of plain text')
            primitive_data[name][field] = value
    data = json.dumps(primitive_data, ensure_ascii=False).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')

    # Resolve tokens in a single pass so literal {{braces}} in user text stay text.
    pattern = re.compile(PARAGRAPH.pattern + '|' + TOKEN.pattern)
    def replace(match):
        attrs, paragraph_key, plain, key = match.groups()
        if paragraph_key:
            paragraphs = re.split(r'\n\s*\n', get(paragraph_key))
            parts = []
            for i, paragraph in enumerate(paragraphs):
                # Keep unique anchors only on the first paragraph.
                attributes = attrs if i == 0 else re.sub(r'\s+id="[^"]*"', '', attrs)
                parts.append(f'<p{attributes}>{inline(paragraph)}</p>')
            return '\n'.join(parts)
        if key == 'primitive-json':
            return data
        value = get(key)
        if plain:
            return html.escape(' '.join(value.split()), quote=True)
        return inline(value)
    result = pattern.sub(replace, template)
    unused = sorted(set(fields) - used)
    if unused:
        raise ValueError('Unused content keys (possibly a typo): ' + ', '.join(unused))
    return '<!-- Generated by build.py. Edit content/*.md or templates/*.html / templates/sections/*.html, not this file. -->\n' + result


def build(root=ROOT):
    fields = read_content(root / 'content')
    template = assemble_template(root)
    result = render(template, fields)
    output = root / 'index.html'
    if not output.exists() or output.read_text(encoding='utf-8') != result:
        temporary = root / '.index.html.tmp'
        temporary.write_text(result, encoding='utf-8')
        temporary.replace(output)
    print('Built index.html', flush=True)


def fingerprint():
    paths = [*sorted((ROOT / 'templates').rglob('*.html')), *sorted((ROOT / 'content').glob('*.md'))]
    return tuple((str(path), path.stat().st_mtime_ns, path.stat().st_size) for path in paths)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--watch', action='store_true', help='Rebuild when content or template files change; refresh the browser to see changes.')
    args = parser.parse_args()
    if not args.watch:
        try:
            build()
        except (ValueError, OSError) as error:
            parser.exit(1, f'Build failed: {error}\n')
        return
    print('Watching content/*.md and templates/**/*.html (including new sections). Ctrl+C to stop.', flush=True)
    previous = None
    try:
        while True:
            current = fingerprint()
            if current != previous:
                try:
                    build()
                except (ValueError, OSError) as error:
                    print(f'Build failed (previous page preserved): {error}', flush=True)
                previous = current
            time.sleep(.5)
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    main()
