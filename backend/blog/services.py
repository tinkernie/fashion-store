import re
from django.conf import settings
from django.core.cache import cache
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from django.utils.text import slugify as django_slugify
from common.exceptions import BusinessException
from .models import Post, PostTranslation, PostSlugHistory, Tag, TRANSLATION_LANGS
from . import sanitizer
from .selectors import BlogSelector

CACHE_TTL = 300
VALID_LANGS = ("fa", "en", "ar")


def resolve_language(request) -> str:
    lang = (request.query_params.get("lang") or "").strip().lower()
    if lang in VALID_LANGS:
        return lang
    header = request.META.get("HTTP_ACCEPT_LANGUAGE", "") or ""
    parsed = []
    for part in header.split(","):
        token, _, weight = part.partition(";q=")
        try:
            q = float(weight) if weight else 1.0
        except ValueError:
            q = 0.0
        parsed.append((token.strip().lower(), q))
    for code in VALID_LANGS:
        for token, q in parsed:
            if token.split("-")[0] == code and q > 0:
                return code
    return "fa"


def slugify_post_title(title) -> str:
    slug = django_slugify(str(title or ""), allow_unicode=True)
    slug = re.sub(r"[^\w\u0600-\u06FF\-]+", "", slug).strip("-")[:300]
    return slug


def unique_slug(base_slug, language, post=None):
    base_slug = base_slug or "post"
    candidate = base_slug
    suffix = 2
    while True:
        if post is not None:
            if language == "fa":
                clash = Post.objects.filter(slug=candidate).exclude(id=post.id).exists()
            else:
                clash = (
                    BlogSelector.active_translations_qs()
                    .filter(language=language, slug=candidate)
                    .exclude(post=post)
                    .exists()
                )
        else:
            if language == "fa":
                clash = Post.objects.filter(slug=candidate).exists()
            else:
                clash = (
                    BlogSelector.active_translations_qs()
                    .filter(language=language, slug=candidate)
                    .exists()
                )
        if not clash:
            return candidate
        candidate = "{}-{}".format(base_slug[:290], suffix)
        suffix += 1
        if suffix > 200:
            raise BusinessException("Could not generate a unique slug.")


def _int_or_default(value, default):
    try:
        return max(1, min(12, int(value)))
    except (TypeError, ValueError):
        return default


class BlogService:
    # ---------- language resolution ----------
    def resolve_fields(self, post, lang):
        if lang == "fa":
            return {
                "title": post.title,
                "slug": post.slug,
                "body_html": post.body_html,
                "excerpt": post.excerpt,
                "meta_title": post.meta_title,
                "meta_description": post.meta_description,
                "reading_minutes": post.reading_minutes,
                "has_language": True,
            }
        tr = BlogSelector.translation_for(post, lang)
        if tr:
            return {
                "title": tr.title,
                "slug": tr.slug,
                "body_html": tr.body_html,
                "excerpt": tr.excerpt,
                "meta_title": tr.meta_title,
                "meta_description": tr.meta_description,
                "reading_minutes": tr.reading_minutes,
                "has_language": True,
            }
        return {
            "title": post.title,
            "slug": post.slug,
            "body_html": post.body_html,
            "excerpt": post.excerpt,
            "meta_title": post.meta_title,
            "meta_description": post.meta_description,
            "reading_minutes": post.reading_minutes,
            "has_language": False,
        }

    def _tag_payload(self, post, lang):
        return [{"slug": t.slug, "name": t.name_for(lang)} for t in post.tags.all()]

    def serialize_public(self, post, lang, include_body=False):
        fields = self.resolve_fields(post, lang)
        data = {
            "id": str(post.id),
            "language": lang,
            "has_language": fields["has_language"],
            "slug": fields["slug"],
            "slugs": self._lang_slugs(post),
            "title": fields["title"],
            "excerpt": fields["excerpt"],
            "cover_image": post.cover_image,
            "published_at": post.published_at.isoformat() if post.published_at else None,
            "reading_minutes": fields["reading_minutes"],
            "tags": self._tag_payload(post, lang),
        }
        if include_body:
            frontend = getattr(settings, "FRONTEND_URL", "http://localhost:3000").rstrip("/")
            data["body_html"] = fields["body_html"]
            data["meta_title"] = (fields["meta_title"] or fields["title"])[:200]
            data["meta_description"] = (fields["meta_description"] or fields["excerpt"])[:320]
            data["canonical_url"] = "{}/blog/{}".format(frontend, fields["slug"])
        return data

    def _lang_slugs(self, post):
        tr_map = {
            t.language: t.slug
            for t in BlogSelector.active_translations_qs().filter(post=post)
        }
        return {"fa": post.slug, "en": tr_map.get("en"), "ar": tr_map.get("ar")}

    def serialize_admin(self, post):
        translations = []
        for code in TRANSLATION_LANGS:
            tr = BlogSelector.translation_for(post, code)
            if tr:
                translations.append(
                    {
                        "language": code,
                        "title": tr.title,
                        "slug": tr.slug,
                        "body_html": tr.body_html,
                        "excerpt": tr.excerpt,
                        "meta_title": tr.meta_title,
                        "meta_description": tr.meta_description,
                        "reading_minutes": tr.reading_minutes,
                    }
                )
        return {
            "id": str(post.id),
            "status": post.status,
            "title": post.title,
            "slug": post.slug,
            "body_html": post.body_html,
            "excerpt": post.excerpt,
            "meta_title": post.meta_title,
            "meta_description": post.meta_description,
            "reading_minutes": post.reading_minutes,
            "cover_image": post.cover_image,
            "published_at": post.published_at.isoformat() if post.published_at else None,
            "created_at": post.created_at.isoformat(),
            "updated_at": post.updated_at.isoformat(),
            "created_by": str(post.created_by_id) if post.created_by_id else None,
            "tags": [
                {"slug": t.slug, "name": t.name, "name_en": t.name_en, "name_ar": t.name_ar}
                for t in post.tags.all()
            ],
            "translations": translations,
        }

    # ---------- sanitization ----------
    def _prepare_content(self, html_body, explicit_excerpt=""):
        html_body = html_body or ""
        try:
            body = sanitizer.sanitize_html(html_body)
        except ValueError as exc:
            raise BusinessException(str(exc))
        source_text = sanitizer.plain_text(html_body)
        if source_text and not sanitizer.plain_text(body):
            raise BusinessException(
                "Blog body could not be sanitized safely; remove unsupported markup."
            )
        reading = sanitizer.estimate_reading_minutes(body)
        excerpt = (str(explicit_excerpt or "").strip() or sanitizer.derive_excerpt(body))[:500]
        return body, excerpt, reading

    # ---------- admin CRUD ----------
    def create_post(self, data, user=None):
        title = str(data.get("title") or "").strip()
        if not title:
            raise BusinessException("Post title is required.")
        slug = unique_slug(slugify_post_title(data.get("slug") or title), "fa")
        body, excerpt, reading = self._prepare_content(
            data.get("body_html") or "", data.get("excerpt") or ""
        )
        translation_rows = self._prepare_translations(data.get("translations") or [])
        tag_rows = self._resolve_tags(data.get("tags") or [])
        with transaction.atomic():
            post = Post.objects.create(
                status=Post.Status.DRAFT,
                title=title,
                slug=slug,
                body_html=body,
                excerpt=excerpt,
                meta_title=str(data.get("meta_title") or "")[:200],
                meta_description=str(data.get("meta_description") or "")[:320],
                reading_minutes=reading,
                cover_image=str(data.get("cover_image") or "")[:1000],
                created_by=user,
            )
            if tag_rows:
                post.tags.set(tag_rows)
            for row in translation_rows:
                PostTranslation.objects.create(post=post, **row)
        return self.serialize_admin(post)

    def update_post(self, slug, data):
        post = BlogSelector.post_by_slug(slug)
        if not post:
            raise BusinessException("Post not found.")
        with transaction.atomic():
            old_fa_slug = post.slug
            old_tr_slugs = {
                t.language: t.slug
                for t in BlogSelector.active_translations_qs().filter(post=post)
            }
            updates = {}
            if "title" in data and str(data.get("title") or "").strip():
                updates["title"] = str(data["title"]).strip()
            if "cover_image" in data:
                updates["cover_image"] = str(data.get("cover_image") or "")[:1000]
            if "meta_title" in data:
                updates["meta_title"] = str(data.get("meta_title") or "")[:200]
            if "meta_description" in data:
                updates["meta_description"] = str(data.get("meta_description") or "")[:320]
            if data.get("body_html") is not None:
                body, derived_excerpt, reading = self._prepare_content(
                    data.get("body_html"),
                    data.get("excerpt") if data.get("excerpt") is not None else "",
                )
                updates["body_html"] = body
                updates["reading_minutes"] = reading
                if data.get("excerpt") is None:
                    updates["excerpt"] = derived_excerpt
                else:
                    updates["excerpt"] = str(data.get("excerpt") or "")[:500]
            elif data.get("excerpt") is not None:
                updates["excerpt"] = str(data.get("excerpt") or "")[:500]
                updates["reading_minutes"] = sanitizer.estimate_reading_minutes(post.body_html)
            elif "title" in updates:
                updates["reading_minutes"] = sanitizer.estimate_reading_minutes(post.body_html)
            new_slug = data.get("slug")
            if new_slug and str(new_slug).strip():
                candidate = unique_slug(slugify_post_title(new_slug), "fa", post=post)
                if candidate != post.slug:
                    updates["slug"] = candidate
            if updates:
                for field, value in updates.items():
                    setattr(post, field, value)
                post.save()
            if updates.get("slug") and updates["slug"] != old_fa_slug:
                PostSlugHistory.objects.create(
                    post=post, language="fa",
                    old_slug=old_fa_slug, new_slug=updates["slug"],
                )
            if "tags" in data:
                post.tags.set(self._resolve_tags(data.get("tags") or []))
            self._apply_translation_updates(post, data.get("translations"), old_tr_slugs)
        self._invalidate(post)
        return self.serialize_admin(post)

    def _apply_translation_updates(self, post, payload, old_tr_slugs):
        if payload is None:
            return
        if not isinstance(payload, list):
            raise BusinessException("translations must be a list of objects.")
        seen = set()
        for row in payload:
            if not isinstance(row, dict):
                raise BusinessException("each translation must be an object.")
            lang = str(row.get("language") or "").lower()
            if lang not in TRANSLATION_LANGS:
                raise BusinessException("translation.language must be one of: en, ar.")
            if lang in seen:
                raise BusinessException("duplicate translation language '{}'.".format(lang))
            seen.add(lang)
            existing = BlogSelector.translation_for(post, lang)
            title = str(row.get("title") or "").strip()
            if not title and not existing:
                raise BusinessException(
                    "translation title is required for a new language '{}'.".format(lang)
                )
            body_raw = (
                row.get("body_html") if row.get("body_html") is not None
                else (existing.body_html if existing else "")
            )
            excerpt_raw = (
                row.get("excerpt") if row.get("excerpt") is not None
                else (existing.excerpt if existing else "")
            )
            body, excerpt, reading = self._prepare_content(body_raw, excerpt_raw)
            prev_slug = old_tr_slugs.get(lang)
            if row.get("slug") and str(row.get("slug")).strip():
                candidate = unique_slug(slugify_post_title(row["slug"]), lang, post=post)
            elif existing:
                candidate = existing.slug
            else:
                candidate = unique_slug(
                    slugify_post_title(title or post.title), lang, post=post
                )
            values = {
                "title": title or (existing.title if existing else post.title),
                "slug": candidate,
                "body_html": body,
                "excerpt": excerpt,
                "meta_title": str(row.get("meta_title") or "")[:200],
                "meta_description": str(row.get("meta_description") or "")[:320],
                "reading_minutes": reading,
            }
            if existing:
                for field, value in values.items():
                    setattr(existing, field, value)
                existing.save()
                if candidate != prev_slug:
                    PostSlugHistory.objects.create(
                        post=post, language=lang,
                        old_slug=prev_slug or candidate, new_slug=candidate,
                    )
            else:
                PostTranslation.objects.create(post=post, language=lang, **values)

    def _prepare_translations(self, payload):
        if not isinstance(payload, list):
            raise BusinessException("translations must be a list of objects.")
        rows, seen = [], set()
        for row in payload:
            if not isinstance(row, dict):
                raise BusinessException("each translation must be an object.")
            lang = str(row.get("language") or "").lower()
            if lang not in TRANSLATION_LANGS:
                raise BusinessException("translation.language must be one of: en, ar.")
            if lang in seen:
                raise BusinessException("duplicate translation language '{}'.".format(lang))
            seen.add(lang)
            title = str(row.get("title") or "").strip()
            body, excerpt, reading = self._prepare_content(
                row.get("body_html") or "", row.get("excerpt") or ""
            )
            rows.append(
                {
                    "language": lang,
                    "title": title,
                    "slug": unique_slug(
                        slugify_post_title(row.get("slug") or title), lang
                    ),
                    "body_html": body,
                    "excerpt": excerpt,
                    "meta_title": str(row.get("meta_title") or "")[:200],
                    "meta_description": str(row.get("meta_description") or "")[:320],
                    "reading_minutes": reading,
                }
            )
        return rows

    def _resolve_tags(self, payload):
        if not isinstance(payload, list):
            raise BusinessException("tags must be a list of slugs.")
        unique = {}
        for item in payload:
            slug = str(item if not isinstance(item, dict) else item.get("slug") or "").strip()
            if not slug:
                continue
            tag = BlogSelector.tag_by_slug(slug)
            if not tag:
                raise BusinessException("Unknown tag slug '{}'.".format(slug))
            unique[tag.id] = tag
        return list(unique.values())

    def get_admin_post(self, slug):
        post = BlogSelector.post_by_slug(slug)
        if not post:
            raise BusinessException("Post not found.")
        return self.serialize_admin(post)

    def list_admin_posts(self, filters=None):
        return BlogSelector.admin_posts_qs(filters)

    def delete_post(self, slug):
        post = BlogSelector.post_by_slug(slug)
        if not post:
            raise BusinessException("Post not found.")
        post.delete()
        self._invalidate(post)
        return {"message": "Post '{}' deleted.".format(slug)}

    def publish_post(self, slug, published=True):
        post = BlogSelector.post_by_slug(slug)
        if not post:
            raise BusinessException("Post not found.")
        post.status = Post.Status.PUBLISHED if published else Post.Status.DRAFT
        if published and not post.published_at:
            post.published_at = timezone.now()
        post.save(update_fields=["status", "published_at", "updated_at"])
        self._invalidate(post)
        return self.serialize_admin(post)

    # ---------- public ----------
    def list_public(self, lang, tag_slug="", search="", page=1, page_size=20):
        qs = BlogSelector.published_posts_qs()
        if tag_slug:
            tag = BlogSelector.tag_by_slug(tag_slug)
            if not tag:
                return []
            qs = qs.filter(tags__in=[tag])
        pattern = (search or "").strip()
        if pattern:
            if lang == "fa":
                qs = qs.filter(Q(title__icontains=pattern) | Q(excerpt__icontains=pattern))
            else:
                tr_ids = list(
                    BlogSelector.active_translations_qs()
                    .filter(language=lang)
                    .filter(Q(title__icontains=pattern) | Q(excerpt__icontains=pattern))
                    .values_list("post_id", flat=True)
                )
                qs = qs.filter(
                    Q(id__in=tr_ids) | Q(title__icontains=pattern) | Q(excerpt__icontains=pattern)
                )
        items = list(qs)
        try:
            page = max(1, int(page))
        except (TypeError, ValueError):
            page = 1
        try:
            page_size = max(1, min(20, int(page_size)))
        except (TypeError, ValueError):
            page_size = 20
        total = len(items)
        window = items[(page - 1) * page_size : page * page_size]
        return [self.serialize_public(p, lang) for p in window], total

    def get_public(self, lang, slug):
        cache_key = "blog:post:{}:{}".format(lang, slug)
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
        if lang == "fa":
            post = BlogSelector.post_by_slug(slug)
        else:
            tr = BlogSelector.translation_by_slug(lang, slug)
            post = tr.post if tr else BlogSelector.post_by_slug(slug)
        if not post:
            raise BusinessException("Post not found.")
        if not post.is_published:
            raise BusinessException("Post not found.")
        data = self.serialize_public(post, lang, include_body=True)
        try:
            cache.set(cache_key, data, CACHE_TTL)
        except Exception:
            pass
        return data

    def resolve_old_slug(self, lang, slug):
        history = PostSlugHistory.objects.filter(language=lang, old_slug=slug)
        if history.exists():
            target = history.order_by("-created_at").first()
            return {"redirect_to": target.new_slug}
        if lang == "fa":
            post = BlogSelector.post_by_slug(slug)
            if post and post.is_published:
                return {"slug": slug}
        else:
            tr = BlogSelector.translation_by_slug(lang, slug)
            if tr and tr.post.is_published:
                return {"slug": slug}
        raise BusinessException("Slug not found.")

    def _invalidate(self, post):
        try:
            slugs = [post.slug] + [
                t.slug for t in BlogSelector.active_translations_qs().filter(post=post)
            ]
            for lang in VALID_LANGS:
                for s in slugs:
                    cache.delete("blog:post:{}:{}".format(lang, s))
        except Exception:
            pass

    # ---------- tags ----------
    def create_tag(self, data):
        name = str(data.get("name") or "").strip()
        if not name:
            raise BusinessException("Tag name is required.")
        slug = re.sub(
            r"[^\w\u0600-\u06FF\-]+",
            "",
            django_slugify(data.get("slug") or name, allow_unicode=True),
        ).strip("-")[:130]
        if not slug:
            raise BusinessException("Tag slug could not be generated.")
        if BlogSelector.tag_by_slug(slug):
            raise BusinessException("A tag with this slug already exists.")
        tag = Tag.objects.create(
            name=name[:120],
            slug=slug,
            name_en=str(data.get("name_en") or "")[:120],
            name_ar=str(data.get("name_ar") or "")[:120],
        )
        return self.serialize_tag(tag)

    def update_tag(self, slug, data):
        tag = BlogSelector.tag_by_slug(slug)
        if not tag:
            raise BusinessException("Tag not found.")
        if data.get("name"):
            tag.name = str(data["name"]).strip()[:120]
        if "name_en" in data:
            tag.name_en = str(data.get("name_en") or "")[:120]
        if "name_ar" in data:
            tag.name_ar = str(data.get("name_ar") or "")[:120]
        tag.save()
        return self.serialize_tag(tag)

    def delete_tag(self, slug):
        tag = BlogSelector.tag_by_slug(slug)
        if not tag:
            raise BusinessException("Tag not found.")
        tag.delete()
        return {"message": "Tag '{}' deleted.".format(slug)}

    def list_tags(self, search=""):
        return [self.serialize_tag(t) for t in BlogSelector.tags_q(search)]

    def serialize_tag(self, tag):
        return {
            "slug": tag.slug,
            "name": tag.name,
            "name_en": tag.name_en,
            "name_ar": tag.name_ar,
        }


# ------------ homepage recent-posts section (CMS-backed) ------------
HOMEPAGE_BLOG_SECTION_KEY = "homepage_blog_section"


def get_homepage_blog_section():
    from cms.models import SiteContent

    content = SiteContent.objects.filter(
        key=HOMEPAGE_BLOG_SECTION_KEY, deleted_at__isnull=True
    ).first()
    payload = dict(content.content) if content and isinstance(content.content, dict) else {}
    enabled = bool(payload.get("enabled", False))
    max_items = _int_or_default(payload.get("max_items"), 4)
    titles = payload.get("titles") if isinstance(payload.get("titles"), dict) else {}
    posts = []
    if enabled:
        posts = [
            BlogService().serialize_public(p, "fa")
            for p in BlogSelector.recent_published(max_items)
        ]
    return {
        "enabled": enabled,
        "titles": {
            "fa": titles.get("fa", "آخرین مقالات"),
            "en": titles.get("en", "Latest Posts"),
            "ar": titles.get("ar", "أحدث المقالات"),
        },
        "max_items": max_items,
        "posts": posts,
    }
