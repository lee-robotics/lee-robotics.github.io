#!/usr/bin/env python3
"""Build media/cv.pdf from profile/profile.json.

Usage:  python3 tools/build_cv.py            # writes media/cv.pdf
        python3 tools/build_cv.py --html     # also keeps tools/cv.html for inspection

Respects the same switches as the site: entries with "hidden": true and
sections named in the top-level "hide" list are left out. Sections named in
the top-level "cvHide" list are left out of the CV only. Needs Google
Chrome (headless) on the PATH; fonts come from Google Fonts when online and
fall back to the system sans-serif otherwise.
"""
import html, json, os, shutil, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'profile', 'profile.json')
OUT = os.path.join(ROOT, 'media', 'cv.pdf')
CHROME = next((c for c in ('google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser',
                           '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome') if shutil.which(c)), None)

def esc(s): return html.escape(str(s or ''))
def visible(items): return [x for x in (items or []) if x and x.get('hidden') is not True]

def build_html(p):
    hide = set(p.get('hide') or []) | set(p.get('cvHide') or [])
    parts = []
    # Header
    links = ' · '.join(f'<a href="{esc(l["href"])}">{esc(l["label"])}</a>' for l in p.get('links', []) if not l['href'].startswith('media/'))
    parts.append(f'''
<header>
  <h1>{esc(p.get("name"))}</h1>
  <div class="role">{esc(p.get("role"))}</div>
  {'<div class="status">'+esc(p["status"])+'</div>' if p.get('status') else ''}
  <p class="bio">{esc(p.get("bio"))}</p>
  <div class="links">{links}</div>
</header>''')

    def section(title, rows_html, meta=''):
        if not rows_html: return
        parts.append(f'<section><h2>{esc(title)}{f"<span>{esc(meta)}</span>" if meta else ""}</h2>{rows_html}</section>')

    def dated(items, primary, secondary, when='when'):
        return ''.join(f'<div class="row"><div class="when">{esc(x.get(when))}</div><div><div class="p">{esc(x.get(primary))}</div>'
                       f'{"<div class=s>"+esc(x.get(secondary))+"</div>" if x.get(secondary) else ""}'
                       f'{"<div class=s>"+esc(x.get("note"))+"</div>" if x.get("note") else ""}</div></div>' for x in items)

    if 'career' not in hide:
        section('Experience', dated(visible(p.get('experience')), 'org', 'role'))
        section('Education', dated(visible(p.get('education')), 'org', 'degree'))
    if 'funding' not in hide:
        rows = ''
        for g in visible(p.get('funding')):
            rows += (f'<div class="row"><div class="when">{esc(g.get("when"))}</div><div>'
                     f'<div class="p">{esc(g.get("title"))}</div>'
                     f'{"<div class=s>"+esc(g["program"])+"</div>" if g.get("program") else ""}'
                     f'{"<div class=s>"+esc(g["role"])+"</div>" if g.get("role") else ""}'
                     f'{"<div class=s>Partners: "+esc(g["partners"])+"</div>" if g.get("partners") else ""}'
                     f'{"<div class=s>"+esc(g["amount"])+"</div>" if g.get("amount") else ""}</div></div>')
        section('Funding', rows)
    def pub_rows(pubs):
        rows = ''
        for pub in pubs:
            tail = ' · '.join(filter(None, [pub.get('cvVenue') or pub.get('venue'), pub.get('award')]))
            rows += (f'<div class="row"><div class="when">{esc(pub.get("year"))}</div><div>'
                     f'<div class="p">{esc(pub.get("title"))}</div><div class="s">{esc(pub.get("authors"))}</div>'
                     f'<div class="s venue">{esc(tail)}</div></div></div>')
        return rows

    if 'publications' not in hide:
        section('Selected publications', pub_rows(visible(p.get('publications'))))
    if 'mentored' not in hide:
        # An entry that gives only a title takes the rest from the publication with that title.
        by_title = {pub.get('title'): pub for pub in (p.get('publications') or []) if pub}
        papers = [{**{k: v for k, v in by_title.get(m.get('title'), {}).items() if k != 'hidden'}, **m}
                  for m in visible(p.get('mentored'))]
        section('Student & mentored papers', pub_rows(papers))
    if 'awards' not in hide:
        section('Awards', dated(visible(p.get('awards')), 'title', 'by', when='year'))
    if 'service' not in hide:
        section('Service & teaching', dated(visible(p.get('service')), 'title', 'org'))
    if 'students' not in hide:
        rows = ''.join(f'<div class="row two"><div class="p">{esc(s.get("name"))}</div><div class="s">{esc(s.get("note"))}</div></div>'
                       for s in visible(p.get('students')))
        section('Former students & mentees', rows)
    if 'talks' not in hide:
        talks = visible(p.get('talks'))
        video = lambda t: f' <a href="{esc(t["link"])}">[video]</a>' if t.get('link') else ''
        rows = ''.join(f'<div class="row"><div class="when">{esc(t.get("date"))}</div><div><span class="p">{esc(t.get("title"))}</span>{video(t)}'
                       f'<span class="s"> — {esc(t.get("venue"))}{" ("+esc(t["country"])+")" if t.get("country") else ""}</span></div></div>' for t in talks)
        section('Invited talks & lectures', rows, f'{len(talks)} talks')

    css = '''
@page { size: A4; margin: 16mm 16mm 18mm; }
html { font-family: 'Barlow', system-ui, sans-serif; font-size: 9.6pt; line-height: 1.4; color: #1d1f20; }
body { margin: 0; }
a { color: #0072ce; text-decoration: none; }
header { border-bottom: 1px solid #ccc; padding-bottom: 6pt; margin-bottom: 8pt; }
h1 { font-family: 'Barlow Condensed', 'Barlow', system-ui, sans-serif; font-weight: 600; font-size: 22pt; margin: 0; line-height: 1.05; }
.role { color: #666; margin-top: 2pt; }
.status { color: #2e8b57; font-weight: 500; margin-top: 1pt; }
.bio { margin: 5pt 0 3pt; }
.links { font-size: 9pt; }
section { margin-top: 8pt; break-inside: auto; }
h2 { font-family: 'Barlow Condensed', 'Barlow', system-ui, sans-serif; font-weight: 600; font-size: 13pt; margin: 0 0 3pt; padding-bottom: 2pt; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; align-items: baseline; break-after: avoid; }
h2 span { font-size: 8pt; font-weight: 400; color: #777; letter-spacing: 0.06em; text-transform: uppercase; }
.row { display: grid; grid-template-columns: 62pt 1fr; gap: 8pt; padding: 2.5pt 0; border-bottom: 1px solid #eee; break-inside: avoid; }
.row.two { grid-template-columns: 1fr auto; }
.when { color: #777; font-variant-numeric: tabular-nums; }
.p { font-weight: 500; }
.s { color: #555; }
.venue { color: #0072ce; }
'''
    fonts = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;700&family=Barlow+Condensed:wght@600&display=swap">'
    return (f'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>{esc(p.get("name"))} – CV</title>{fonts}<style>{css}</style></head>'
            f'<body>{"".join(parts)}</body></html>')

def main():
    p = json.load(open(DATA, encoding='utf-8'))
    doc = build_html(p)
    keep = '--html' in sys.argv
    tmp = os.path.join(ROOT, 'tools', 'cv.html') if keep else os.path.join(tempfile.mkdtemp(), 'cv.html')
    with open(tmp, 'w', encoding='utf-8') as f: f.write(doc)
    if not CHROME: sys.exit('Chrome/Chromium not found; open %s and print to PDF manually.' % tmp)
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--no-sandbox', '--no-pdf-header-footer',
                    '--virtual-time-budget=6000', f'--print-to-pdf={OUT}', 'file://' + tmp],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=60)
    print(f'wrote {os.path.relpath(OUT, ROOT)} ({os.path.getsize(OUT)//1024} KB)' + (f'; html kept at {os.path.relpath(tmp, ROOT)}' if keep else ''))

if __name__ == '__main__':
    main()
