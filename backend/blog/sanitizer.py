"""Whitelist HTML sanitizer for blog rich content (stdlib only, no new deps).

Contract source: docs/BLOG_CONTENT_FORMAT.md - the backend is the gate.
Unknown tags/attributes/CSS properties/URL schemes are removed, text is
entity-escaped, orphan tags force-closed, comments dropped.
"""
import html
import re
from html.parser import HTMLParser
from urllib.parse import urlparse

# --- Content-format contract (see docs/BLOG_CONTENT_FORMAT.md) ---

ALLOWED_TAGS = {
    "p", "br", "hr", "h2", "h3", "h4", "ul", "ol", "li", "blockquote",
    "figure", "figcaption", "table", "thead", "tbody", "tr", "th", "td",
    "span", "strong", "em", "u", "s", "b", "i", "code", "pre", "mark",
    "sup", "sub", "a", "img", "iframe", "video",
}

VOID_TAGS = {"br", "hr", "img"}

OPAQUE_TAGS = {"script", "style", "head", "title", "object", "embed", "noscript", "template"}

ALLOWED_TAG_ATTRS = {
    "a": {"href", "title", "target"},
    "img": {"src", "alt", "title", "width", "height"},
    "iframe": {"src", "width", "height", "title"},
    "video": {"src", "poster", "width", "height", "controls"},
    "__global__": {"style", "dir"},
}

ALLOWED_FONTS = ("Vazirmatn", "Estedad", "Noto Naskh Arabic", "Tahoma", "Arial")
_FONT_RE = re.compile(
    r"^(')?\s*(?P<name>"
    + "|".join(re.escape(f) for f in ALLOWED_FONTS)
    + r")\s*(?(1)')$",
    re.IGNORECASE,
)
_FONT_SIZE_RE = re.compile(
    r"^(?:(?P<px>\d{1,2}(?:\.\d+)?)px|(?P<em>\d(?:\.\d{1,2})?)em|(?P<rem>\d(?:\.\d{1,2})?)rem)$"
)
_COLOR_RE = re.compile(
    r"^#(?:[0-9a-fA-F]{3,8})$"
    r"|^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)$"
    r"|^(?:black|white|red|green|blue|gray|orange|purple|brown|gold|silver|navy|maroon|teal)$",
    re.IGNORECASE,
)
_ALIGN_RE = re.compile(r"^(?:start|end|left|right|center|justify|inherit)$", re.IGNORECASE)
_DIR_RE = re.compile(r"^(?:rtl|ltr|auto)$", re.IGNORECASE)

_GENERIC_URL_RE = re.compile(r"^(?:https?:|/|#|mailto:)[^<>\s\"']*$", re.IGNORECASE)
_IFRAME_HOSTS = ("aparat.com", "youtube.com", "youtube-nocookie.com")
_VIDEO_SRC_RE = re.compile(
    r"^(?:https?:)?//[^<>\s\"']+?\.(?:mp4|webm)(?:$|[?#])"
    r"|^/.+\.(?:mp4|webm)(?:$|[?#])$",
    re.IGNORECASE,
)

MAX_HTML_LENGTH = 200_000
MAX_ATTRS = 30
MAX_TEXT_ATTR_VALUE = 300


def sanitize_css_style(value: str) -> str:
    """Keep only approved declarations (font-family, font-size, color, text-align)."""
    kept = []
    for decl in str(value or "").replace("\n", " ").split(";"):
        decl = decl.strip()
        if not decl or ":" not in decl:
            continue
        prop, _, raw_val = decl.partition(":")
        prop = prop.strip().lower()
        val = raw_val.strip().strip('"').replace('"', "'").strip("'")
        if not val:
            continue
        if prop == "font-family":
            m = _FONT_RE.match("'{}'".format(val)) or _FONT_RE.match(val)
            if m:
                kept.append("font-family: '{}'".format(m.group("name")))
        elif prop == "font-size":
            m = _FONT_SIZE_RE.match(val)
            if m:
                if m.group("px"):
                    px = float(m.group("px"))
                    if 10 <= px <= 32:
                        kept.append("font-size: {}px".format(m.group("px")))
                else:
                    em = float(m.group("em") or m.group("rem"))
                    if 0.7 <= em <= 2.5:
                        kept.append("font-size: {}{}".format(em, "em" if m.group("em") else "rem"))
        elif prop == "color":
            if _COLOR_RE.match(val):
                kept.append("color: {}".format(val))
        elif prop == "text-align":
            if _ALIGN_RE.match(val):
                kept.append("text-align: {}".format(val))
    return "; ".join(kept)


def _iframe_host_allowed(value) -> bool:
    if not (value.startswith("//") or value.startswith("http://")
            or value.startswith("https://")):
        return False
    try:
        host = (urlparse(value).hostname or "").lower()
    except ValueError:
        return False
    return any(host == d or host.endswith("." + d) for d in _IFRAME_HOSTS)


def sanitize_url_attr(tag, attr, value):
    """Return a safe URL for the given tag/attribute, or None to drop it."""
    value = str(value or "").replace("\n", " ").replace("\r", " ").strip()
    if not value:
        return None
    if tag == "iframe" and attr == "src":
        return value if _iframe_host_allowed(value) else None
    if tag == "video" and attr == "src":
        return value if _VIDEO_SRC_RE.match(value) else None
    if attr in ("src", "poster") and tag in ("img", "video"):
        if value.lower().startswith("//"):
            return "https:" + value
        if _GENERIC_URL_RE.match(value):
            return value
        return None
    if attr == "href":
        return value if _GENERIC_URL_RE.match(value) else None
    return None


class _Rewriter(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out = []
        self.stack = []
        self.opaque_depth = 0

    # -- helpers ---------------------------------------------------
    def _attr_allowed(self, tag, attr):
        return attr in ALLOWED_TAG_ATTRS.get(tag, ()) or attr in ALLOWED_TAG_ATTRS["__global__"]

    def _render_attrs(self, tag, attrs):
        parts = []
        for name, value in attrs[:MAX_ATTRS]:
            name = str(name).lower()
            if not self._attr_allowed(tag, name):
                continue
            if name == "style":
                css = sanitize_css_style(value)
                if css:
                    parts.append(("style", css))
                continue
            if name == "dir":
                if value and _DIR_RE.match(str(value)):
                    parts.append(("dir", str(value).lower()))
                continue
            if name in ("href", "src", "poster"):
                safe = sanitize_url_attr(tag, name, value)
                if safe is not None:
                    parts.append((name, safe))
                continue
            clean = str(value or "")[:MAX_TEXT_ATTR_VALUE]
            if name == "controls":
                parts.append((name, "controls"))
            elif clean:
                parts.append((name, clean))
        rendered = "".join(
            ' {}="{}"'.format(n, html.escape(str(v), quote=True)) for n, v in parts
        )
        if tag == "a" and dict(parts).get("target") == "_blank":
            rendered += ' rel="noopener"'
        if tag == "iframe":
            rendered = ' frameborder="0" allowfullscreen' + rendered
        if tag == "video":
            rendered += " controls preload=\"metadata\"" if "controls" not in dict(parts) else ""
        return rendered

    def _would_render(self, tag, attrs):
        """A tag that keeps none of its required safe attrs is dropped (e.g. iframe w/o safe src)."""
        if tag not in ("img", "iframe", "video"):
            return True
        for name, value in attrs[:MAX_ATTRS]:
            if str(name).lower() in ("src", "poster"):
                return sanitize_url_attr(tag, str(name).lower(), value) is not None
        return False

    def _render_startend(self, tag, attrs):
        rendered = self._render_attrs(tag, attrs)
        self.out.append("<{}{}>".format(tag, rendered))

    # -- token handlers -------------------------------------------
    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        if self.opaque_depth:
            if tag in OPAQUE_TAGS:
                self.opaque_depth += 1
            return
        if tag in OPAQUE_TAGS:
            self.opaque_depth = 1
            return
        if tag not in ALLOWED_TAGS or not self._would_render(tag, attrs):
            return
        rendered = self._render_attrs(tag, attrs)
        self.out.append("<{}{}>".format(tag, rendered))
        self.stack.append(tag)

    def handle_startendtag(self, tag, attrs):
        tag = tag.lower()
        if self.opaque_depth:
            return
        if tag not in ALLOWED_TAGS or not self._would_render(tag, attrs):
            return
        if tag in VOID_TAGS or tag in ("iframe", "video"):
            self._render_startend(tag, attrs)
        else:
            rendered = self._render_attrs(tag, attrs)
            self.out.append("<{}{}></{}>".format(tag, rendered, tag))

    def handle_endtag(self, tag):
        tag = tag.lower()
        if self.opaque_depth:
            if tag in OPAQUE_TAGS:
                self.opaque_depth -= 1
            return
        if tag in VOID_TAGS or tag not in ALLOWED_TAGS:
            return
        if tag in self.stack:
            while self.stack:
                opened = self.stack.pop()
                self.out.append("</{}>".format(opened))
                if opened == tag:
                    break

    def handle_data(self, data):
        if not self.opaque_depth:
            self.out.append(html.escape(data, quote=False))

    def handle_entityref(self, name):
        if not self.opaque_depth:
            self.out.append("&{};".format(name))

    def handle_charref(self, name):
        if not self.opaque_depth:
            self.out.append("&#{};".format(name))

    # comments / declarations / PIs are dropped entirely
    def handle_comment(self, data):
        pass

    def handle_decl(self, decl):
        pass

    def handle_pi(self, data):
        pass

    def unknown_decl(self, data):
        pass

    def result(self):
        while self.stack:
            self.out.append("</{}>".format(self.stack.pop()))
        return "".join(self.out)


def sanitize_html(raw) -> str:
    if not raw:
        return ""
    raw = str(raw)
    if len(raw) > MAX_HTML_LENGTH:
        raise ValueError("Blog body exceeds the maximum allowed length.")
    rewriter = _Rewriter()
    rewriter.feed(raw)
    rewriter.close()
    return rewriter.result()


_TEXT_STRIP_RE = re.compile(r"<[^>]*>")


def plain_text(story_html) -> str:
    text = _TEXT_STRIP_RE.sub(" ", story_html or "")
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


_WORDS_PER_MINUTE = 200


def estimate_reading_minutes(story_html) -> int:
    words = plain_text(story_html).split()
    if not words:
        return 1
    return max(1, round(len(words) / _WORDS_PER_MINUTE))


def derive_excerpt(story_html, limit=200) -> str:
    return plain_text(story_html)[:limit]
