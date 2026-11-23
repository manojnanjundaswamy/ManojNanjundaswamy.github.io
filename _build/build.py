"""Builds the static pages from _pages/*.html (body only) with one shared head, header and footer.
Run from the repo root:  SITE_EMAIL=you@example.com python _build/build.py
The public contact address comes from SITE_EMAIL and replaces {{EMAIL}} in every page.
Folders starting with "_" are not published by GitHub Pages."""
import json
import os
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = 'https://www.manojnanjundaswamy.com'

PAGES = [
    # file, url, nav key, title, description
    ('home', '/', 'home', 'Manoj Nanjundaswamy',
     'Senior software engineer at Amadeus in Bangalore (Java, Spring Boot, Kafka), and maker of Untangle Art at Vimora Studio.'),
    ('work', '/work/', 'work', 'Work · Manoj Nanjundaswamy',
     'Backend engineering since 2019: migrations, Kafka event streaming and delivery pipelines at Amadeus, BCITS and Wolken.'),
    ('studio', '/studio/', 'studio', 'Vimora Studio · Manoj Nanjundaswamy',
     'Vimora Studio is a one-person game studio. Its first game, Untangle Art, is an arrow puzzle where every level hides a picture.'),
    ('projects', '/projects/', 'projects', 'Projects · Manoj Nanjundaswamy',
     'Side projects: AI pipelines, Spring Boot services, Kafka systems and bots. Most are open source.'),
    ('about', '/about/', 'about', 'About · Manoj Nanjundaswamy',
     'From mechatronics to backend engineering to making games. Skills, education and how to reach me.'),
    ('now', '/now/', 'now', 'Now · Manoj Nanjundaswamy',
     'What I am working on this month.'),
    ('uploader', '/tools/media-studio-uploader/', '', 'Media Studio Uploader · Manoj Nanjundaswamy',
     'A private tool that uploads my own videos to my own YouTube channels using the YouTube API Services.'),
    ('uploader-privacy', '/tools/media-studio-uploader/privacy/', '', 'Privacy Policy · Media Studio Uploader',
     'Privacy policy for Media Studio Uploader, a private tool that uses the YouTube API Services.'),
    ('uploader-terms', '/tools/media-studio-uploader/terms/', '', 'Terms of Service · Media Studio Uploader',
     'Terms of service for Media Studio Uploader.'),
    ('404', '/404.html', '', 'Page not found · Manoj Nanjundaswamy', 'This page does not exist.'),
]
NAV = [('work', '/work/', 'Work'), ('studio', '/studio/', 'Studio'), ('projects', '/projects/', 'Projects'),
       ('about', '/about/', 'About'), ('now', '/now/', 'Now')]

PERSON = {
    '@context': 'https://schema.org', '@type': 'Person', 'name': 'Manoj Nanjundaswamy', 'url': SITE + '/',
    'image': SITE + '/assets/img/manoj.jpg', 'jobTitle': 'Senior Software Engineer',
    'worksFor': {'@type': 'Organization', 'name': 'Amadeus'},
    'address': {'@type': 'PostalAddress', 'addressLocality': 'Bangalore', 'addressCountry': 'IN'},
    'sameAs': ['https://github.com/manojnanjundaswamy', 'https://www.linkedin.com/in/manoj-nanjundaswamy/',
               'https://apps.manojnanjundaswamy.com/'],
    'knowsAbout': ['Java', 'Spring Boot', 'Apache Kafka', 'Microservices', 'LLM applications', 'Game development'],
}


def head(url, title, desc, key):
    ld = f'\n<script type="application/ld+json">{json.dumps(PERSON)}</script>' if key == 'home' else ''
    canon = SITE + url
    robots = '\n<meta name="robots" content="noindex">' if url == '/404.html' else ''
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{canon}">{robots}
<meta property="og:type" content="website">
<meta property="og:site_name" content="Manoj Nanjundaswamy">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{canon}">
<meta property="og:image" content="{SITE}/assets/img/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#F7F8FA" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0D1530" media="(prefers-color-scheme: dark)">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/assets/img/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/site.css">
<script>try{{var t=localStorage.getItem('mn-theme');if(t)document.documentElement.setAttribute('data-theme',t)}}catch(e){{}}</script>
<script src="/assets/js/site.js" defer></script>{ld}
</head>
<body>
'''


def header(key):
    items = ''.join(
        f'<li><a href="{u}"{" aria-current=\"page\"" if k == key else ""}>{label}</a></li>' for k, u, label in NAV)
    return f'''<header class="site-head"><div class="wrap">
  <a class="name" href="/">Manoj Nanjundaswamy</a>
  <nav aria-label="Main"><ul>{items}</ul></nav>
  <button class="theme" type="button" aria-label="Switch theme"></button>
</div></header>
'''


FOOT = '''<footer class="site-foot"><div class="wrap">
  <span class="spacer">© 2026 Manoj Nanjundaswamy</span>
  <a href="mailto:{{EMAIL}}">Email</a>
  <a href="https://github.com/manojnanjundaswamy">GitHub</a>
  <a href="https://www.linkedin.com/in/manoj-nanjundaswamy/">LinkedIn</a>
  <a href="https://apps.manojnanjundaswamy.com/">Vimora Studio apps</a>
</div></footer>
</body>
</html>
'''


def esc(t):
    return t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def item_html(it):
    status = f' <span class="status">{esc(it["status"])}</span>' if it.get('status') else ''
    inner = (f'<span class="when">{esc(it["kind"])}</span><span class="t">{esc(it["name"])}{status}</span>'
             f'<span class="tag">{esc(it["stack"])}</span><span class="d">{esc(it["description"])}</span>')
    wrap = f'<a href="{it["link"]}">{inner}</a>' if it.get('link') else f'<div class="row">{inner}</div>'
    rid = f' id="{it["id"]}"' if it.get('id') else ''
    return f'      <li{rid}>{wrap}</li>' + NL


NL = chr(10)


def projects_blocks():
    """Renders _data/projects.json: every section for /projects/, and featured items for the home page."""
    data = json.loads((ROOT / '_data' / 'projects.json').read_text(encoding='utf8'))
    out, featured = [], []
    for i, sec in enumerate(data['sections']):
        items = ''.join(item_html(it) for it in sec['items'])
        featured += [it for it in sec['items'] if it.get('featured')]
        top = ' style="border-top:0;padding-top:16px"' if i == 0 else ''
        out.append(NL.join([f'<section{top}>', '  <div class="wrap">', f'    <h2>{esc(sec["title"])}</h2>',
                            '    <ul class="ledger">', items + '    </ul>', '  </div>', '</section>']))
    feat = '<ul class="ledger">' + NL + ''.join(item_html(it) for it in featured) + '    </ul>'
    return (NL + NL).join(out), feat


def main():
    email = os.environ.get('SITE_EMAIL', '').strip()
    if not email:
        print('warning: SITE_EMAIL not set, pages keep the {{EMAIL}} placeholder')
    projects, featured = projects_blocks()
    urls = []
    for name, url, key, title, desc in PAGES:
        body = (ROOT / '_pages' / f'{name}.html').read_text(encoding='utf8')
        html = head(url, title, desc, key) + header(key) + '<main>\n' + body.strip() + '\n</main>\n' + FOOT
        html = html.replace('{{PROJECTS}}', projects).replace('{{FEATURED}}', featured)
        if email:
            html = html.replace('{{EMAIL}}', email)
        out = ROOT / ('404.html' if name == '404' else ('index.html' if url == '/' else url.strip('/') + '/index.html'))
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(html, encoding='utf8', newline='\n')
        if name != '404':
            urls.append(url)
    sm = ''.join(f'  <url><loc>{SITE}{u}</loc></url>\n' for u in urls)
    (ROOT / 'sitemap.xml').write_text(
        f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{sm}</urlset>\n',
        encoding='utf8', newline='\n')
    (ROOT / 'robots.txt').write_text(f'User-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n', encoding='utf8', newline='\n')
    print('built', len(PAGES), 'pages')


if __name__ == '__main__':
    main()
