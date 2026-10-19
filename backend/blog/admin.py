from django.contrib import admin
from .models import Post, PostTranslation, PostSlugHistory, Tag


class PostTranslationInline(admin.StackedInline):
    model = PostTranslation
    extra = 0
    fields = (
        "language",
        "title",
        "slug",
        "body_html",
        "excerpt",
        "meta_title",
        "meta_description",
        "reading_minutes",
    )


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "status", "published_at", "reading_minutes")
    list_filter = ("status", "tags")
    search_fields = ("title", "slug", "body_html")
    prepopulated_fields = {"slug": ("title",)}
    inlines = [PostTranslationInline]


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "name_en", "name_ar")
    search_fields = ("name", "slug")


@admin.register(PostSlugHistory)
class PostSlugHistoryAdmin(admin.ModelAdmin):
    list_display = ("post", "language", "old_slug", "new_slug")
    search_fields = ("old_slug", "new_slug")
