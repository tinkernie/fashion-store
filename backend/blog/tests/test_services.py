import pytest
from common.exceptions import BusinessException
from ..models import Post, PostSlugHistory
from ..services import BlogService, slugify_post_title, unique_slug
from .factories import PostFactory, TagFactory


@pytest.mark.django_db
class TestCreatePost:
    def test_filters_into_content(self):
        html = (
            '<p>معرفی</p><script>bad()</script>'
            '<img src="/m/a.webp" alt="تصویر">'
        )
        service = BlogService()
        post = service.create_post({"title": "پست اول", "body_html": html})
        assert "<script>" not in post["body_html"]
        assert '<img src="/m/a.webp"' in post["body_html"]
        assert post["slug"] == "پست-اول"
        assert post["status"] == "draft"

    def test_reading_time_and_excerpt_derived(self):
        words = " ".join(["کلمه"] * 420)
        post = BlogService().create_post(
            {"title": "مطول", "body_html": "<p>{}</p>".format(words)}
        )
        assert post["reading_minutes"] == 2
        assert post["excerpt"].startswith("کلمه")

    def test_explicit_excerpt_kept(self):
        post = BlogService().create_post(
            {"title": "تی", "body_html": "<p>ب</p>", "excerpt": "خلاصه"}
        )
        assert post["excerpt"] == "خلاصه"

    def test_translations_created(self):
        post = BlogService().create_post(
            {
                "title": "عنوان فردا",
                "body_html": "<p>x</p>",
                "translations": [
                    {"language": "en", "title": "Title tomorrow", "body_html": "<p>y</p>"}
                ],
            }
        )
        assert post["translations"][0]["language"] == "en"
        assert post["translations"][0]["slug"] == "title-tomorrow"

    def test_invalid_translation_lang_rejected(self):
        with pytest.raises(BusinessException):
            BlogService().create_post(
                {
                    "title": "عنوان فردا",
                    "translations": [{"language": "fa", "title": "خودش"}],
                }
            )

    def test_unknown_tag_slug_rejected(self):
        with pytest.raises(BusinessException):
            BlogService().create_post({"title": "تی", "tags": ["ghost"]})

    def test_title_required(self):
        with pytest.raises(BusinessException):
            BlogService().create_post({"body_html": "<p>x</p>"})


@pytest.mark.django_db
class TestSlugs:
    def test_slugify_persian(self):
        assert slugify_post_title("راهنمای خرید کت") == "راهنمای-خرید-کت"

    def test_unique_slug_suffix(self):
        PostFactory(slug="dup")
        slug = unique_slug("dup", "fa")
        assert slug == "dup-2"

    def test_translation_slug_unique_per_language(self):
        post = PostFactory(slug="a-fa")
        from ..models import PostTranslation

        PostTranslation.objects.create(
            post=post, language="en", title="T", slug="shop"
        )
        assert unique_slug("shop", "en") == "shop-2"

    def test_slug_history_recorded_on_change(self):
        PostFactory(slug="old-new")
        BlogService().update_post("old-new", {"slug": "fresh-slug"})
        hist = PostSlugHistory.objects.latest("created_at")
        assert hist.old_slug == "old-new"
        assert hist.new_slug == "fresh-slug"
        assert BlogService().resolve_old_slug("fa", "old-new") == {
            "redirect_to": "fresh-slug"
        }


@pytest.mark.django_db
class TestUpdatePost:
    def test_update_recomputes_reading_minutes(self):
        post = PostFactory(slug="readme", body_html="<p>کوتاه</p>")
        updated = BlogService().update_post(
            "readme", {"body_html": "<p>{}</p>".format(" ".join(["واژه"] * 700))}
        )
        assert updated["reading_minutes"] == 4
        assert updated["id"] == str(post.id)

    def test_translation_update_and_fallback_flag(self):
        post = PostFactory(slug="multi")
        BlogService().update_post(
            "multi",
            {
                "translations": [
                    {"language": "ar", "title": "مقالة", "body_html": "<p>ن</p>"}
                ]
            },
        )
        fields = BlogService().resolve_fields(post, "ar")
        assert fields["has_language"] is True
        assert fields["title"] == "مقالة"
        fields_en = BlogService().resolve_fields(post, "en")
        assert fields_en["has_language"] is False
        assert fields_en["title"] == post.title

    def test_translations_reject_duplicated(self):
        PostFactory(slug="duple")
        with pytest.raises(BusinessException):
            BlogService().update_post(
                "duple",
                {
                    "translations": [
                        {"language": "ar", "title": "ا", "body_html": "<p>ن</p>"},
                        {"language": "ar", "title": "ب", "body_html": "<p>ن</p>"},
                    ]
                },
            )


@pytest.mark.django_db
class TestPublicLifecycle:
    def test_draft_hidden_get_public(self):
        PostFactory(slug="hidden", status=Post.Status.DRAFT)
        with pytest.raises(BusinessException):
            BlogService().get_public("fa", "hidden")

    def test_published_visible_with_cache(self):
        PostFactory(slug="published-post", status=Post.Status.PUBLISHED)
        service = BlogService()
        first = service.get_public("fa", "published-post")
        second = service.get_public("fa", "published-post")
        assert first == second
        assert first["slug"] == "published-post"

    def test_list_content_free_and_paginated(self):
        PostFactory(slug="list-one", status=Post.Status.PUBLISHED)
        results, total = BlogService().list_public("fa")
        assert total == 1
        assert "body_html" not in results[0]

    def test_tag_filter_and_search(self):
        tag = TagFactory(name="پاییز", slug="paeez")
        PostFactory(
            slug="tagged", title="استایل پاییزی", status=Post.Status.PUBLISHED, tags=[tag]
        )
        PostFactory(
            slug="other", title="استایل زمستانی", status=Post.Status.PUBLISHED
        )
        results, total = BlogService().list_public("fa", tag_slug="paeez")
        assert total == 1
        results_s, total_s = BlogService().list_public("fa", search="پاییزی")
        assert total_s == 1
        assert results_s[0]["slug"] == "tagged"

    def test_publish_unpublish(self):
        PostFactory(slug="toggle")
        p = BlogService().publish_post("toggle")
        assert p["status"] == "published"
        assert p["published_at"] is not None
        p = BlogService().publish_post("toggle", published=False)
        assert p["status"] == "draft"

    def test_tags_crud(self):
        service = BlogService()
        tag = service.create_tag({"name": "استایل", "name_en": "Style", "name_ar": "ستايل"})
        assert tag["slug"] == "استایل"
        updated = service.update_tag("استایل", {"name_en": "Style2"})
        assert updated["name_en"] == "Style2"
        with pytest.raises(BusinessException):
            service.create_tag({"name": "استایل"})
