import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from ..models import Post
from .factories import PostFactory, StaffUserFactory, TagFactory

User = get_user_model()


def admin_client():
    client = APIClient()
    client.force_authenticate(user=StaffUserFactory())
    return client


def plain_client():
    return APIClient()


@pytest.mark.django_db
class TestPublicPostAPI:
    def test_list_paginated_shape(self):
        PostFactory(slug="p1", status=Post.Status.PUBLISHED)
        resp = plain_client().get(
            "/api/blog/posts/?lang=fa&page=1&page_size=10"
        )
        assert resp.status_code == 200
        assert resp.data["count"] == 1
        assert "body_html" not in resp.data["results"][0]

    def test_list_draft_hidden(self):
        PostFactory(slug="draft-one", status=Post.Status.DRAFT)
        resp = plain_client().get("/api/blog/posts/")
        assert resp.status_code == 200
        assert resp.data["count"] == 0

    def test_detail_published_and_translation(self):
        post = PostFactory(slug="beauty", status=Post.Status.PUBLISHED)
        from ..models import PostTranslation

        PostTranslation.objects.create(
            post=post, language="en", title="Beauty", slug="beauty-en",
            body_html="<p>pure</p>",
        )
        resp = plain_client().get("/api/blog/posts/beauty-en/?lang=en")
        assert resp.status_code == 200
        assert resp.data["title"] == "Beauty"

    def test_detail_fallback_to_fa(self):
        PostFactory(slug="no-en", title="Naeen", status=Post.Status.PUBLISHED)
        resp = plain_client().get("/api/blog/posts/no-en/?lang=en")
        assert resp.status_code == 200
        assert resp.data["title"] == "Naeen"
        assert resp.data["has_language"] is False

    def test_detail_draft_not_found(self):
        PostFactory(slug="secret-draft")
        resp = plain_client().get("/api/blog/posts/secret-draft/")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_slug_lookup_redirect(self):
        post = PostFactory(slug="oldone", status=Post.Status.PUBLISHED)
        admin = admin_client()
        admin.patch("/api/admin/blog/posts/oldone/", {"slug": "newone"}, format="json")
        resp = plain_client().get("/api/blog/posts/slug-lookup/?lang=fa&slug=oldone")
        assert resp.status_code == 200
        assert resp.data == {"redirect_to": "newone"}
        assert SlugHistoryFor(post).new_slug == "newone"


def SlugHistoryFor(post):
    from ..models import PostSlugHistory

    return PostSlugHistory.objects.latest("created_at")

    def test_homepage_section_toggle(self):
        PostFactory(slug="hero-post-1", status=Post.Status.PUBLISHED)
        resp = plain_client().get("/api/blog/posts/homepage-section/")
        assert resp.status_code == 200
        assert resp.data["enabled"] is False
        assert resp.data["posts"] == []

        admin = admin_client()
        patch = admin.patch(
            "/api/admin/cms/site-content/homepage_blog_section/",
            {"content": {"enabled": True, "max_items": 3}},
            format="json",
        )
        assert patch.status_code == 200, patch.content
        resp = plain_client().get("/api/blog/posts/homepage-section/")
        assert resp.data["enabled"] is True
        assert resp.data["titles"]["fa"] == "آخرین مقالات"
        assert len(resp.data["posts"]) == 1

    def test_lang_param_validated(self):
        PostFactory(slug="langy", status=Post.Status.PUBLISHED)
        resp = plain_client().get("/api/blog/posts/langy/?lang=xx-IN")
        assert resp.status_code == 200
        assert resp.data["language"] == "fa"


@pytest.mark.django_db
class TestAdminPostAPI:
    def test_create_requires_admin(self):
        resp = plain_client().post(
            "/api/admin/blog/posts/", {"title": "تی"}, format="json"
        )
        assert resp.status_code >= 400

    def test_create_and_publish_flow(self):
        client = admin_client()
        create = client.post(
            "/api/admin/blog/posts/",
            {"title": "پست پاییز", "body_html": "<p>متن</p>", "cover_image": "/c.webp"},
            format="json",
        )
        assert create.status_code == 201, create.content
        slug = create.data["slug"]
        pub = client.post("/api/admin/blog/posts/{}/publish/".format(slug))
        assert pub.status_code == 200
        assert pub.data["status"] == Post.Status.PUBLISHED
        assert pub.data["published_at"] is not None
        resp = plain_client().get("/api/blog/posts/{}/".format(slug))
        assert resp.status_code == 200

    def test_create_with_translations_and_tags(self):
        TagFactory(name="پاییز", slug="fall")
        client = admin_client()
        create = client.post(
            "/api/admin/blog/posts/",
            {
                "title": "چندزبانه",
                "body_html": "<p>فارسی</p>",
                "tags": ["fall"],
                "translations": [
                    {"language": "en", "title": "Multilingual", "body_html": "<p>En</p>"},
                ],
            },
            format="json",
        )
        assert create.status_code == 201, create.content
        assert create.data["translations"][0]["slug"] == "multilingual"

    def test_update_serializes_dup_translations(self):
        client = admin_client()
        create = client.post(
            "/api/admin/blog/posts/", {"title": "ت"}, format="json"
        )
        slug = create.data["slug"]
        dup = client.patch(
            "/api/admin/blog/posts/{}/".format(slug),
            {
                "translations": [
                    {"language": "en", "title": "a"},
                    {"language": "en", "title": "b"},
                ]
            },
            format="json",
        )
        assert dup.status_code == status.HTTP_400_BAD_REQUEST

    def test_publisher_partial_update_slug_history(self):
        client = admin_client()
        create = client.post(
            "/api/admin/blog/posts/", {"title": "تاریخچه"}, format="json"
        )
        slug = create.data["slug"]
        upd = client.patch(
            "/api/admin/blog/posts/{}/".format(slug), {"slug": "sabeghe" }, format="json"
        )
        assert upd.status_code == 200
        assert upd.data["slug"] == "sabeghe"
        check = plain_client().get(
            "/api/blog/posts/slug-lookup/?lang=fa&slug={}".format(slug)
        )
        assert check.data == {"redirect_to": "sabeghe"}


@pytest.mark.django_db
class TestTagAPI:
    def test_public_tags_list(self):
        TagFactory(name="برچسب", slug="tagpy")
        resp = plain_client().get("/api/blog/tags/")
        assert resp.status_code == 200
        assert resp.data[0]["slug"] == "tagpy"

    def test_admin_tag_crud(self):
        client = admin_client()
        create = client.post(
            "/api/admin/blog/tags/",
            {"name": "رنگ", "name_en": "Color"},
            format="json",
        )
        assert create.status_code == 201
        slug = create.data["slug"]
        patch = client.patch(
            "/api/admin/blog/tags/{}/".format(slug), {"name_en": "Colors"}, format="json"
        )
        assert patch.data["name_en"] == "Colors"
        dele = client.delete("/api/admin/blog/tags/{}/".format(slug))
        assert dele.status_code == 200


@pytest.mark.django_db
class TestSanitizationThroughAPI:
    def test_created_body_is_sanitized(self):
        client = admin_client()
        create = client.post(
            "/api/admin/blog/posts/",
            {
                "title": "امنیتی",
                "body_html": "<p>متن</p><script>bad()</script>"
                             '<img src="javascript:bad()" alt="x">',
            },
            format="json",
        )
        assert create.status_code == 201
        assert "<script>" not in create.data["body_html"]
        assert "<img" not in create.data["body_html"]
