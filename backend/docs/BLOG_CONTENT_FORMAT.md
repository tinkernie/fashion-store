# Blog Content Format Contract

Backend-owned gate for rich blog content. The admin editor (frontend team)
must produce HTML that passes this allowlist; anything else is stripped or
rejected **at save time** by `blog/sanitizer.py`. Stored HTML is the single
source of truth for rendering on the storefront.

## Allowed tags

| Group | Tags |
|---|---|
| Text / structure | `p`, `br`, `hr`, `h2`, `h3`, `h4`, `ul`, `ol`, `li`, `blockquote`, `figure`, `figcaption`, `table`, `thead`, `tbody`, `tr`, `th`, `td` |
| Inline | `span`, `strong`, `em`, `u`, `s`, `b`, `i`, `code`, `pre`, `mark`, `sup`, `sub` |
| Media / embeds | `a`, `img`, `iframe` (video embeds only), `video` (direct mp4/webm only) |

`h1` is reserved for the page title (rendered by the storefront, not stored in
`body_html`).

## Allowed attributes

| Tag | Attributes |
|---|---|
| all | `style` (limited), `dir` (`rtl`/`ltr`/`auto`) |
| `a` | `href`, `title`, `target` (`rel="noopener"` added automatically when `target="_blank"`) |
| `img` | `src`, `alt`, `title`, `width`, `height` |
| `iframe` | `src`, `width`, `height`, `title` (`frameborder="0" allowfullscreen` added automatically) |
| `video` | `src`, `poster`, `width`, `height`, `controls` |

## Allowed inline styles

Only these CSS properties pass the sanitizer:

- `font-family`: `Vazirmatn`, `Estedad`, `Noto Naskh Arabic`, `Tahoma`, `Arial`
  (single family per declaration; the value is re-quoted safely)
- `font-size`: `10px`..`32px` or `0.7em/0.7rem`..`2.5em/2.5rem`
- `color`: `#hex`, `rgb()/rgba()`, or a small named-color set
- `text-align`: `start|end|left|right|center|justify|inherit`

Any other property/value is dropped silently.

## URLs

- `a href`: `https`, `http`, `mailto:`, site-relative (`/...`), `#anchor`.
- `img src` / `video poster`: `https`, `http`, protocol-relative (`//` —
  rewritten to `https:`), or site-relative (`/...`). Prefer the media library
  upload endpoint (images converted to WebP with responsive variants) or a CDN
  link; landscape/horizontal images with a 16:9 target ratio recommended for
  covers.
- `iframe src` host allowlist: `aparat.com`, `youtube.com`,
  `youtube-nocookie.com` (embed URLs). Anything else is dropped.
- `video src`: must point at `.mp4`/`.webm` (CDN link or site-relative path).

## Hard limits / behavior

- Max HTML length: 200,000 chars (larger bodies are rejected, not truncated).
- Comments, `<script>`, `<style>`, `object/embed/noscript/template`, event
  handlers (`on*`), and unknown tags/attributes are removed.
- Text is entity-escaped on output; orphan closing tags are force-closed.
- Cover image is a plain URL string on `Post` (`cover_image`), editable via the
  admin API.

## API surface (backend scope)

Public (no auth):

- `GET  /api/blog/posts/?lang=fa|en|ar&tag=<slug>&search=&page=&page_size=` —
  paginated list (no body).
- `GET  /api/blog/posts/{slug}?lang=` — article detail (resolved fields with
  `fa` fallback; `has_language` flags missing translation;
  `slugs` returns the per-language slugs for hreflang).
- `GET  /api/blog/posts/slug-lookup/?lang=&slug=` — resolves old slugs to
  `{"redirect_to": "<new>"}` for 301s, or `{"slug": ...}` if still valid.
- `GET  /api/blog/posts/homepage-section/` — CMS-gated "Recent Posts" payload:
  `{enabled, titles{fa,en,ar}, max_items, posts[<=12]}` (fa-serialized posts).
- `GET  /api/blog/tags/` — all tags.

Admin (staff only):

- `GET/POST /api/admin/blog/posts/`, `GET/PATCH/DELETE /api/admin/blog/posts/{slug}/`,
  `POST /api/admin/blog/posts/{slug}/publish/`, `.../unpublish/`.
- `POST /api/admin/blog/tags/`, `PATCH/DELETE /api/admin/blog/tags/{slug}/`.

CMS toggle for the homepage section:

- `PATCH /api/admin/cms/site-content/homepage_blog_section/` with body
  `{"enabled": true, "titles": {"fa": ..., "en": ..., "ar": ...}, "max_items": 4}`.
  Toggle lives in the same admin CMS the owner already uses; the storefront
  section must never be hardcoded (workspace rule).

## Content payload shape (for the editor team)

```json
{
  "title": "fa title (required)",
  "slug": "optional, auto-generated from title",
  "body_html": "<p>...</p>",
  "excerpt": "optional, auto-derived (200 chars) from body",
  "meta_title": "...", "meta_description": "...",
  "cover_image": "/media_libm/.../cover.webp",
  "tags": ["tag-slug"],
  "translations": [
    {"language": "en", "title": "...", "body_html": "<p>...</p>"}
  ]
}
```

Server derives `reading_minutes` (word count / 200, min 1) and `excerpt` per
language when omitted. Persian (`fa`) is the base language on `Post`;
`en`/`ar` go in `translations`.
