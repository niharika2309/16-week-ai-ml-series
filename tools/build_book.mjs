#!/usr/bin/env node
/**
 * build_book.mjs — turn the Substack 16-week series into a book in this repo.
 *
 *   Each article -> one page   (0N-week-N/day-D-....md)
 *   Each week    -> one chapter (0N-week-N/ folder + index.md)
 *
 * Usage:
 *   node build_book.mjs            # incremental: skips articles already in the manifest
 *   node build_book.mjs --force    # re-fetch + rewrite everything
 *
 * Env:
 *   PUB  Substack subdomain (default: niharikabatra)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'node-html-parser'
import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'

// ---------------------------------------------------------------- config

const PUB = process.env.PUB || 'niharikabatra'
const BASE = `https://${PUB}.substack.com`
const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; book-builder/1.0)' }
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FORCE = process.argv.includes('--force')
const TIMEZONE = 'America/New_York' // Substack's display timezone
const SERIES_SECTION = '16-week-aiml-series'
const INTRO_TITLE_PREFIX = '16 Weeks to AI'

const WEEK_THEMES = {
  1: 'The Big Picture & Data Fundamentals',
  2: 'Your First Machine Learning Models',
  3: 'Evaluation Metrics & Tree-Based Models',
  4: 'Neural Networks & Deep Learning',
  5: 'Transformers',
  6: 'Prompting & Working with LLMs',
  7: 'AI Agents: Tools, Action & Design',
}

// ---------------------------------------------------------------- helpers

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const escHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

async function fetchJson(url, tries = 5) {
  let lastErr = null
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: UA })
      if (r.status === 404) return null
      if (r.status === 429 || r.status >= 500) {
        lastErr = `HTTP ${r.status}${r.status === 429 ? ' (rate limited)' : ''}`
        await sleep(4000 * (i + 1)) // back off, then retry
        continue
      }
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return await r.json()
    } catch (e) {
      lastErr = e.message
      if (i === tries - 1) break
      await sleep(1500 * (i + 1))
    }
  }
  throw new Error(`GET ${url} failed: ${lastErr}`)
}

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: TIMEZONE,
  })
}

function parseWeekDay(title) {
  const m = /^Week\s*(\d+)\s*[,–-]?\s*Day\s*(\d+)\s*[:\-–—]?\s*(.*)$/i.exec(title)
  if (!m) return null
  return { week: +m[1], day: +m[2], shortTitle: m[3].trim() || title }
}

/** Cross-book link. Root-relative (docsify's `relativePath` is off, and the
 *  site is served from the domain root, so links must resolve from "/"). */
function relLink(_fromChapterDir, toRoute) {
  return toRoute
}

function slugFromUrl(url) {
  try {
    const u = new URL(url)
    return u.pathname.replace(/^\/p\//, '').replace(/^\//, '').split('?')[0]
  } catch {
    return null
  }
}

// ---------------------------------------------------------------- archive

async function fetchArchive() {
  const seen = new Map()
  let offset = 0
  let emptyStreak = 0
  while (emptyStreak < 3) {
    const d = await fetchJson(`${BASE}/api/v1/archive?sort=new&limit=50&offset=${offset}`)
    const list = Array.isArray(d) ? d : (d?.data ?? [])
    const fresh = list.filter((p) => !seen.has(p.id))
    for (const p of list) seen.set(p.id, p)
    emptyStreak = fresh.length === 0 ? emptyStreak + 1 : 0
    offset += 20 // overlapping windows absorb server-side paging quirks
    if (offset > 500) break
  }
  return [...seen.values()].sort((a, b) => new Date(a.post_date) - new Date(b.post_date))
}

async function fetchSingle(slug) {
  const d = await fetchJson(`${BASE}/api/v1/posts/${encodeURIComponent(slug)}`)
  if (!d) throw new Error(`post not found: ${slug}`)
  return d
}

// ---------------------------------------------------------------- HTML -> Markdown

/** Strip Substack UI chrome and normalize the body for conversion. */
function normalizeBody(html) {
  // digest-post-embeds (client-side rendered) -> simple callout token, in one pass
  html = html.replace(/<div class="digest-post-embed" data-attrs="([^"]*)">[\s\S]*?<\/div>/g, (whole, attrsEsc) => {
    let attrs = {}
    try {
      attrs = JSON.parse(
        attrsEsc
          .replace(/&quot;/g, '"')
          .replace(/&#039;|&apos;/g, "'")
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
      )
    } catch {}
    const date = attrs.post_date ? fmtDate(attrs.post_date) + ' · ' : ''
    return (
      `<div data-digest="1"><p>📄 <strong>${escHtml(attrs.title || 'Linked article')}</strong></p>` +
      `<p>${date}<a href="${escHtml(attrs.canonical_url || '')}">Read the original on Substack</a></p></div>`
    )
  })

  const dom = parse(`<div id="__body__">${html}</div>`)
  const body = dom.querySelector('#__body__')

  for (const sel of [
    'button',
    'svg',
    'script',
    'style',
    'iframe',
    'form',
    'p.button-wrapper', // Share / Leave-a-comment buttons
    'div.subscription-widget-wrap-editor', // subscribe widget
    'div.image-link-expand', // restack/image buttons
    'div.pencraft', // UI component wrappers
  ]) {
    for (const n of body.querySelectorAll(sel)) n.remove()
  }
  for (const a of body.querySelectorAll('a[class*="image-link"]')) a.replaceWith(...a.childNodes)
  for (const p of body.querySelectorAll('picture')) {
    const img = p.querySelector('img')
    if (img) p.replaceWith(img)
    else p.remove()
  }
  for (const c of [...body.querySelectorAll('code')]) {
    const inner = c.querySelector('code') // doubled <code><code>
    if (inner) c.replaceWith(inner)
  }
  for (const d of [...body.querySelectorAll('div')]) {
    if (d.children.length === 1 && d.children[0].tagName.toUpperCase() === 'HR') d.replaceWith(d.children[0])
  }
  for (const li of body.querySelectorAll('li')) {
    for (const p of li.children) if (p.tagName.toUpperCase() === 'P') p.replaceWith(...p.childNodes)
  }
  for (const d of body.querySelectorAll('div.digest-post-embed')) d.remove() // any the string pass missed
  for (const img of body.querySelectorAll('img')) {
    for (const a of ['width', 'height', 'loading', 'data-attrs', 'data-component-name']) {
      img.removeAttribute(a)
    }
  }
  return body.toString()
}

function makeTurndown() {
  const td = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
  })
  td.use(gfm)

  // demote body headings (the page title is the only H1)
  for (const [tag, level] of [['h1', 2], ['h2', 3], ['h3', 4], ['h4', 5], ['h5', 6]]) {
    td.addRule(`demote-${tag}`, {
      filter: tag,
      replacement: (content) => `${'#'.repeat(level)} ${content.trim()}\n`,
    })
  }
  td.addRule('hr', { filter: 'hr', replacement: () => '---\n' })
  td.addRule('br', { filter: 'br', replacement: () => '  \n' })
  td.addRule('figure', { filter: 'figure', replacement: (c) => c.trim() + '\n' })
  td.addRule('figcaption', {
    filter: 'figcaption',
    replacement: (c) => `\n_${c.trim()}_\n`,
  })
  td.addRule('digest', {
    filter: (n) => n.tagName === 'DIV' && n.getAttribute('data-digest') === '1',
    replacement: (content) => {
      const blocks = content
        .split('\n\n')
        .map((s) => s.trim())
        .filter(Boolean)
      return '\n' + blocks.map((b) => '> ' + b.replace(/\n/g, '\n> ')).join('\n') + '\n'
    },
  })
  td.addRule('clean-link', {
    filter: 'a',
    replacement: (content, node) => {
      let href = node.getAttribute('href') || ''
      try {
        const u = new URL(href)
        for (const k of [...u.searchParams.keys()])
          if (/^(utm_|fbclid|gclid|mc_)/.test(k) || k === 'ref') u.searchParams.delete(k)
        href = u.toString()
      } catch {}
      if (!href) return content
      return `[${content.trim() || 'link'}](${href})`
    },
  })
  return td
}

// ---------------------------------------------------------------- images

function imageInfoFromUrl(src) {
  let decoded
  try {
    decoded = decodeURIComponent(src)
  } catch {
    decoded = src
  }
  const m = /images\/([0-9a-f]{8}-[0-9a-f-]{20,})_\d+x\d+\.([a-z0-9]+)/i.exec(decoded)
  if (!m) return null
  return { uuid: m[1], ext: m[2].toLowerCase() }
}

const ACCEPT_FOR = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' }
const EXT_FOR_CT = { 'image/png': '.png', 'image/jpeg': '.jpeg', 'image/webp': '.webp', 'image/gif': '.gif' }

/** Download a Substack CDN image into `dir`; returns the local file name (or null). */
async function downloadImage(cdnUrl, dir) {
  const info = imageInfoFromUrl(cdnUrl)
  if (!info) return null
  const res = await fetch(cdnUrl, { headers: { ...UA, Accept: ACCEPT_FOR[info.ext] || 'image/png' } })
  if (!res.ok) return null
  const ct = (res.headers.get('content-type') || '').split(';')[0]
  const ext = EXT_FOR_CT[ct] || `.${info.ext}` // trust what we actually received
  const name = `${info.uuid}${ext}`
  const file = path.join(dir, name)
  if (fs.existsSync(file)) return name // shared image, already fetched
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()))
  return name
}

// ---------------------------------------------------------------- page assembly

/** slug -> book route, populated in main() for in-book cross links */
const routeBySlug = new Map()

async function buildPage(post, opts) {
  const data = await fetchSingle(post.slug)
  let text = makeTurndown().turndown(normalizeBody(data.body_html || ''))

  // images -> local files
  const rel = `../assets/images/${opts.chapterDir}/`
  const imgRe = /!\[([^\]]*)\]\((https?:\S+?)(?:\s+"[^"]*")?\)/g
  let out = ''
  let last = 0
  let m
  while ((m = imgRe.exec(text)) !== null) {
    const [, alt, src] = m
    let local = src
    if (src.includes('substackcdn.com')) {
      const name = await downloadImage(src, opts.dir)
      if (name) local = `${rel}${name}`
    }
    out += text.slice(last, m.index) + `![${alt}](${local})`
    last = m.index + m[0].length
  }
  text = out + text.slice(last)

  // links to other posts in this book -> local relative links
  const selfSlug = slugFromUrl(data.canonical_url)
  const linkRe = new RegExp(
    `\\]\\(((?:https?:)?//(?:www\\.)?${PUB}\\.substack\\.com)(/p/)?([^)\\s?#]+)((?:[?#][^\\s)]*)?)?\\)`,
    'g'
  )
  text = text.replace(linkRe, (whole, host, slash, slugPart) => {
    if (slugPart === selfSlug) return whole
    const target = routeBySlug.get(slugPart)
    return target ? `](${relLink(opts.chapterDir, target)})` : whole
  })

  // tidy markdown
  text = text
    .replace(/^(\s*)-   /gm, '$1- ')
    .replace(/-{4,}\n/g, '---\n')
    .replace(/^[ \t]+\n(?=\n|[-*+] )/gm, '') // whitespace-only lines left by trailing <br>
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  const sourceUrl = data.canonical_url || post.canonical_url
  const byline = `*${fmtDate(data.post_date || post.post_date)} · [Originally published on Substack](${sourceUrl})*`
  return `# ${post.title}\n\n${byline}\n\n${text}\n`
}

// ---------------------------------------------------------------- main

async function main() {
  const manifestFile = path.join(ROOT, 'tools', 'manifest.json')
  let manifest = {}
  if (!FORCE && fs.existsSync(manifestFile)) manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'))

  console.log('Fetching archive…')
  const archive = await fetchArchive()
  const series = archive.filter(
    (p) => p.section_slug === SERIES_SECTION || p.title.startsWith(INTRO_TITLE_PREFIX)
  )
  const intro = series.find((p) => p.title.startsWith(INTRO_TITLE_PREFIX))
  const weekPosts = series
    .filter((p) => !p.title.startsWith(INTRO_TITLE_PREFIX))
    .map((p) => ({ ...p, wd: parseWeekDay(p.title) }))
    .filter((p) => p.wd)
  const weeks = [...new Set(weekPosts.map((p) => p.wd.week))].sort((a, b) => a - b)
  console.log(`Archive: ${archive.length} posts | series: ${series.length} | weeks: ${weeks.join(', ')}`)

  // route map for cross links
  for (const p of weekPosts) {
    const s = p.slug.replace(/^week-\d+-day-\d+-/, '')
    routeBySlug.set(p.slug, `0${p.wd.week}-week-${p.wd.week}/day-${p.wd.day}-${s}.md`)
  }
  if (intro) routeBySlug.set(intro.slug, '00-introduction/index.md')

  const allPages = [] // ordered {file, label} for prev/next nav (assembled at the end)
  let fetched = 0
  let skipped = 0

  const has = (p, route) => manifest[p.id]?.file === route && !FORCE

  // ---- introduction
  if (intro) {
    const route = '00-introduction/index.md'
    if (has(intro, route)) {
      skipped++
    } else {
      console.log(`  building ${route}`)
      const md = await buildPage(intro, { chapterDir: '00-introduction', dir: path.join(ROOT, 'assets/images/00-introduction') })
      fs.mkdirSync(path.join(ROOT, '00-introduction'), { recursive: true })
      fs.writeFileSync(path.join(ROOT, route), md)
      fetched++
    }
    manifest[intro.id] = { file: route, slug: intro.slug, title: intro.title, date: intro.post_date }
  }

  // ---- week pages
  for (const week of weeks) {
    const dir = `0${week}-week-${week}`
    const posts = weekPosts.filter((p) => p.wd.week === week).sort((a, b) => a.wd.day - b.wd.day)
    for (const p of posts) {
      const s = p.slug.replace(/^week-\d+-day-\d+-/, '')
      const route = `${dir}/day-${p.wd.day}-${s}.md`
      if (!has(p, route)) {
        console.log(`  building ${route}`)
        const md = await buildPage(p, { chapterDir: dir, dir: path.join(ROOT, `assets/images/${dir}`) })
        fs.mkdirSync(path.join(ROOT, dir), { recursive: true })
        fs.writeFileSync(path.join(ROOT, route), md)
        fetched++
        await sleep(600) // be polite to the Substack API
      } else skipped++
      manifest[p.id] = { file: route, slug: p.slug, title: p.title, date: p.post_date }
    }
  }

  // ---- reading order: intro, then per week [chapter index, day 1..N]
  if (intro) allPages.push({ file: '00-introduction/index.md', label: intro.title })
  for (const week of weeks) {
    const dir = `0${week}-week-${week}`
    allPages.push({ file: `${dir}/index.md`, label: `Week ${week}${WEEK_THEMES[week] ? ` — ${WEEK_THEMES[week]}` : ''}` })
    for (const p of weekPosts.filter((q) => q.wd.week === week).sort((a, b) => a.wd.day - b.wd.day)) {
      const s = p.slug.replace(/^week-\d+-day-\d+-/, '')
      allPages.push({ file: `${dir}/day-${p.wd.day}-${s}.md`, label: `Day ${p.wd.day} · ${p.wd.shortTitle}` })
    }
  }

  // ---- chapter index pages
  const sidebar = []
  if (intro) sidebar.push(`- [Introduction](00-introduction/index.md)`)
  for (const week of weeks) {
    const dir = `0${week}-week-${week}`
    const theme = WEEK_THEMES[week] || ''
    const posts = weekPosts.filter((p) => p.wd.week === week).sort((a, b) => a.wd.day - b.wd.day)
    sidebar.push(`- **Week ${week}${theme ? ` — ${theme}` : ''}**`)
    for (const p of posts) {
      const s = p.slug.replace(/^week-\d+-day-\d+-/, '')
      sidebar.push(`  - [Day ${p.wd.day} · ${p.wd.shortTitle}](${dir}/day-${p.wd.day}-${s}.md)`)
    }
    const index = [
      `# Week ${week}${theme ? ` — ${theme}` : ''}`,
      '',
      `**${posts.length} lessons** — one concept each day.`,
      '',
      ...posts.map((p) => {
        const s = p.slug.replace(/^week-\d+-day-\d+-/, '')
        return `- **Day ${p.wd.day}** — [${p.wd.shortTitle}](${dir}/day-${p.wd.day}-${s}.md)`
      }),
      '',
    ].join('\n')
    fs.mkdirSync(path.join(ROOT, dir), { recursive: true })
    fs.writeFileSync(path.join(ROOT, dir, 'index.md'), index)
  }

  // ---- generated site files
  fs.writeFileSync(path.join(ROOT, '_sidebar.md'), sidebar.join('\n') + '\n')

  const readme = [
    '# AI, One Concept at a Time',
    '',
    'A beginner-friendly **16-week journey into Artificial Intelligence and Machine Learning** — by [Niharika Batra](https://niharikabatra.substack.com).',
    '',
    'No complicated jargon. No assumption that you already know AI. Just one concept at a time.',
    '',
    'This book collects the full series: each article is a page, each week is a chapter.',
    '',
    ...(intro ? [`- [**Introduction — ${intro.title}**](00-introduction/index.md)`] : []),
    ...weeks.map((w) => `- [**Week ${w}${WEEK_THEMES[w] ? ` — ${WEEK_THEMES[w]}` : ''}**](0${w}-week-${w}/index.md)`),
    '',
    '> The series is ongoing — new weeks are added as they are published.',
    '',
    '> **Keep the empty `.nojekyll` file in the repo root.** GitHub Pages runs Jekyll on branch deployments by default, and Jekyll silently drops files that start with an underscore. Without it, `_coverpage.md` and `_sidebar.md` are never published, and the Docsify reading site breaks.',
    '',
    '## Read it as a book',
    '',
    'Enable [GitHub Pages](https://docs.github.com/en/pages) for this repo (source: `main` branch, `/` root) to get a reading site with a cover page, table of contents, and prev/next navigation. Or simply browse the folders above.',
    '',
    '## Contents',
    '',
    weeks
      .map(
        (w) =>
          `**Week ${w}${WEEK_THEMES[w] ? ` — ${WEEK_THEMES[w]}` : ''}**\n\n` +
          weekPosts
            .filter((p) => p.wd.week === w)
            .sort((a, b) => a.wd.day - b.wd.day)
            .map((p) => {
              const s = p.slug.replace(/^week-\d+-day-\d+-/, '')
              return `- Day ${p.wd.day} · [${p.wd.shortTitle}](0${w}-week-${w}/day-${p.wd.day}-${s}.md)`
            })
            .join('\n')
      )
      .join('\n\n'),
    '',
    '## Rebuilding after a new week is published',
    '',
    '```bash',
    'cd tools && npm install && node build_book.mjs',
    '```',
    '',
    'The script pulls the archive from Substack, adds only the newly published articles, and regenerates the navigation.',
    '',
  ].join('\n')
  fs.writeFileSync(path.join(ROOT, 'README.md'), readme)

  // prev/next order for the docsify plugin
  fs.writeFileSync(
    path.join(ROOT, 'book-pages.js'),
    `// generated by tools/build_book.mjs — do not edit\nwindow.BOOK_PAGES = ${JSON.stringify(allPages)};\n`
  )

  const cover = path.join(ROOT, '_coverpage.md')
  if (!fs.existsSync(cover)) {
    fs.writeFileSync(
      cover,
      `# AI, One Concept at a Time\n\n> A beginner-friendly 16-week journey into AI and ML — from ML and deep learning to LLMs, RAG, agents, evaluation, and AI system design.\n>\n> By **Niharika Batra**\n\n[Start reading](${intro ? '00-introduction/index.md' : (routeBySlug.values().next().value || '')})\n`
    )
  }

  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n')
  console.log(`\nDone. fetched=${fetched} skipped=${skipped} pages=${allPages.length}`)
}

await main().catch((e) => {
  console.error(e)
  process.exit(1)
})
