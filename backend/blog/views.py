from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from common.exceptions import BusinessException
from .services import (
    BlogService,
    resolve_language,
    get_homepage_blog_section,
)


def _paginated(request, results, total):
    try:
        page = max(1, int(request.query_params.get("page", "1")))
    except (TypeError, ValueError):
        page = 1
    try:
        page_size = max(1, min(20, int(request.query_params.get("page_size", "20"))))
    except (TypeError, ValueError):
        page_size = 20
    pages = (total + page_size - 1) // page_size
    return page, page_size, pages


def _page_links(base_path, page, pages, params):
    from urllib.parse import urlencode

    params = dict(params)
    next_url = prev_url = None
    if page < pages:
        params["page"] = page + 1
        next_url = "{}?{}".format(base_path, urlencode(params))
    if page > 1:
        params["page"] = page - 1
        prev_url = "{}?{}".format(base_path, urlencode(params))
    return next_url, prev_url


class PublicBlogViewSet(viewsets.GenericViewSet):
    permission_classes = [AllowAny]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.service = BlogService()

    def list(self, request):
        lang = resolve_language(request)
        params = {
            "lang": lang,
            "tag": request.query_params.get("tag", ""),
            "search": request.query_params.get("search", ""),
            "page": request.query_params.get("page", "1"),
            "page_size": request.query_params.get("page_size", "20"),
        }
        try:
            results, total = self.service.list_public(
                lang,
                tag_slug=params["tag"],
                search=params["search"],
                page=params["page"],
                page_size=params["page_size"],
            )
        except (TypeError, ValueError):
            raise BusinessException("Invalid query parameters.")
        page, page_size, pages = _paginated(request, results, total)
        next_url, prev_url = _page_links("/api/blog/posts", page, pages, params)
        return Response(
            {
                "count": total,
                "pages": pages,
                "page": page,
                "next": next_url,
                "previous": prev_url,
                "results": results,
            }
        )

    def retrieve(self, request, pk=None):
        lang = resolve_language(request)
        return Response(self.service.get_public(lang, pk))

    @action(detail=False, methods=["get"], url_path="slug-lookup")
    def slug_lookup(self, request):
        lang = resolve_language(request)
        slug = request.query_params.get("slug", "")
        return Response(self.service.resolve_old_slug(lang, slug))

    @action(detail=False, methods=["get"], url_path="homepage-section")
    def homepage_section(self, request):
        return Response(get_homepage_blog_section())


class PublicTagViewSet(viewsets.GenericViewSet):
    permission_classes = [AllowAny]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.service = BlogService()

    def list(self, request):
        search = request.query_params.get("search", "")
        return Response(self.service.list_tags(search))


class AdminPostViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAdminUser]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.service = BlogService()

    def list(self, request):
        filters = {}
        for key in ("status", "search", "tag"):
            if key in request.query_params:
                filters[key] = request.query_params.get(key, "")
        qs = self.service.list_admin_posts(filters)
        page = self.paginate_queryset(qs)
        data = [self.service.serialize_admin(p) for p in (page if page is not None else qs)]
        if page is not None:
            return self.get_paginated_response(data)
        return Response(data)

    def retrieve(self, request, pk=None):
        return Response(self.service.get_admin_post(pk))

    def create(self, request):
        from .serializers import AdminPostSerializer

        serializer = AdminPostSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(
            self.service.create_post(serializer.validated_data, user=request.user),
            status=status.HTTP_201_CREATED,
        )

    def partial_update(self, request, pk=None):
        from .serializers import AdminPostUpdateSerializer

        serializer = AdminPostUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        return Response(self.service.update_post(pk, serializer.validated_data))

    def destroy(self, request, pk=None):
        return Response(self.service.delete_post(pk))

    @action(detail=True, methods=["post"], url_path="publish")
    def publish(self, request, pk=None):
        return Response(self.service.publish_post(pk, published=True))

    @action(detail=True, methods=["post"], url_path="unpublish")
    def unpublish(self, request, pk=None):
        return Response(self.service.publish_post(pk, published=False))


class AdminTagViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAdminUser]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.service = BlogService()

    def list(self, request):
        search = request.query_params.get("search", "")
        return Response(self.service.list_tags(search))

    def create(self, request):
        from .serializers import AdminTagSerializer

        serializer = AdminTagSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(
            self.service.create_tag(serializer.validated_data),
            status=status.HTTP_201_CREATED,
        )

    def partial_update(self, request, pk=None):
        from .serializers import AdminTagUpdateSerializer

        serializer = AdminTagUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        return Response(self.service.update_tag(pk, serializer.validated_data))

    def destroy(self, request, pk=None):
        return Response(self.service.delete_tag(pk))
