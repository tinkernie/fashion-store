from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PublicBlogViewSet,
    PublicTagViewSet,
    AdminPostViewSet,
    AdminTagViewSet,
)

public_router = DefaultRouter()
public_router.register(r"blog/posts", PublicBlogViewSet, basename="blog-public-post")

public_tag_router = DefaultRouter()
public_tag_router.register(r"blog/tags", PublicTagViewSet, basename="blog-public-tag")

admin_router = DefaultRouter()
admin_router.register(r"admin/blog/posts", AdminPostViewSet, basename="blog-admin-post")

admin_tag_router = DefaultRouter()
admin_tag_router.register(r"admin/blog/tags", AdminTagViewSet, basename="blog-admin-tag")

urlpatterns = [
    path("", include(public_router.urls)),
    path("", include(public_tag_router.urls)),
    path("", include(admin_router.urls)),
    path("", include(admin_tag_router.urls)),
]
