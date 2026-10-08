from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_headers
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from .services import ProductService
from .selectors import ProductSelector
from .serializers import (
    ProductCreateSerializer,
    ProductUpdateSerializer,
    ProductDetailSerializer,
)


class PublicProductViewSet(viewsets.GenericViewSet):
    permission_classes = [AllowAny]
    lookup_field = "slug"

    @method_decorator(cache_page(300))
    @method_decorator(vary_on_headers("Accept-Language, Accept-Encoding"))
    def list(self, request):
        filters = {}
        if "category" in request.query_params:
            filters["category"] = request.query_params["category"]
        if "collection" in request.query_params:
            filters["collection_slug"] = request.query_params["collection"]
        if "search" in request.query_params:
            filters["search"] = request.query_params["search"]
        if "status" in request.query_params:
            filters["status"] = request.query_params["status"]
        if "ordering" in request.query_params:
            filters["ordering"] = request.query_params["ordering"]
        if "has_discount" in request.query_params:
            filters["has_discount"] = request.query_params["has_discount"]
        if "exclude_discounted" in request.query_params:
            filters["exclude_discounted"] = request.query_params["exclude_discounted"]
        products = ProductSelector.get_visible_products(filters)
        # manual pagination? We'll use DRF's default pagination via core.pagination.StandardPagination.
        page = self.paginate_queryset(products)
        if page is not None:
            serializer = ProductDetailSerializer(
                page, many=True, context={"request": request, "include_related": False}
            )
            return self.get_paginated_response(serializer.data)
        serializer = ProductDetailSerializer(
            products, many=True, context={"request": request, "include_related": False}
        )
        return Response(serializer.data)

    def retrieve(self, request, slug=None):
        product = ProductSelector.get_product_by_slug(slug)
        if not product:
            try:
                product = ProductSelector.get_product_by_id(slug)
            except Exception:
                product = None
        if not product:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = ProductDetailSerializer(product, context={"request": request})
        response = Response(serializer.data)
        # SEO: canonical + hreflang headers for paginated search
        try:
            from django.conf import settings
            base = getattr(settings, "FRONTEND_URL", "http://localhost:3000").rstrip("/")
            response["Link"] = f'<{base}/products/{product.slug}>; rel="canonical"'
            response["Content-Language"] = "fa-IR"
            response["Vary"] = "Accept-Language"
        except Exception:
            pass
        return response

    @action(detail=True, methods=["get"], url_path="related")
    def related(self, request, slug=None):
        """Dedicated lazy related endpoint: GET /api/products/<slug>/related/?limit=8 (hybrid, max 8)"""
        product = ProductSelector.get_product_by_slug(slug)
        if not product:
            try:
                product = ProductSelector.get_product_by_id(slug)
            except Exception:
                product = None
        if not product:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        try:
            limit = int(request.query_params.get("limit", 8))
        except ValueError:
            limit = 8
        limit = min(max(limit, 1), 8)
        related = ProductSelector.get_related_products(product, limit=limit)
        from .serializers import RelatedProductCardSerializer
        serializer = RelatedProductCardSerializer(related, many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="complete-look")
    def complete_look(self, request, slug=None):
        """GET /api/products/<slug>/complete-look/?limit=6 - manual only, no fallback, max 6"""
        product = ProductSelector.get_product_by_slug(slug)
        if not product:
            try:
                product = ProductSelector.get_product_by_id(slug)
            except Exception:
                product = None
        if not product:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        try:
            limit = int(request.query_params.get("limit", 6))
        except ValueError:
            limit = 6
        limit = min(max(limit, 1), 6)
        related = ProductSelector.get_complete_look_products(product, limit=limit)
        from .serializers import RelatedProductCardSerializer
        serializer = RelatedProductCardSerializer(related, many=True, context={"request": request})
        return Response(serializer.data)




class AdminProductViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAdminUser]

    def create(self, request):
        serializer = ProductCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = ProductService()
        result = service.create_product(serializer.validated_data)
        return Response(result, status=status.HTTP_201_CREATED)

    def update(self, request, pk=None):
        serializer = ProductUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        service = ProductService()
        result = service.update_product(pk, serializer.validated_data)
        return Response(result)

    def partial_update(self, request, pk=None):
        serializer = ProductUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        service = ProductService()
        result = service.update_product(pk, serializer.validated_data)
        return Response(result)

    def destroy(self, request, pk=None):
        # Two options: soft delete (set deleted_at) or archive (set status). We'll use soft delete.
        service = ProductService()
        result = service.delete_product(pk)
        return Response(result)

    @action(detail=True, methods=["post"], url_path="archive")
    def archive(self, request, pk=None):
        service = ProductService()
        result = service.archive_product(pk)
        return Response(result)

    @action(detail=False, methods=["post"], url_path="discount-section/activate")
    def discount_section_activate(self, request):
        """Bulk campaign: POST /api/admin/products/discount-section/activate/
        {product_ids: [...], discount_percent: 25, expires_at?: iso} + flips CMS toggle on."""
        from .serializers import DiscountSectionActivateSerializer

        serializer = DiscountSectionActivateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = ProductService()
        result = service.activate_discount_section(
            serializer.validated_data["product_ids"],
            serializer.validated_data["discount_percent"],
            serializer.validated_data.get("expires_at"),
        )
        # Flip the storefront section on (same admin action, above footer)
        try:
            from cms.services import CMSService
            from cms.selectors import SiteContentSelector

            previous = SiteContentSelector.get_by_key("discount_section") or {}
            CMSService().update_site_content(
                "discount_section",
                {
                    "enabled": True,
                    "title": request.data.get("title", previous.get("title", "")),
                    "subtitle": request.data.get("subtitle", previous.get("subtitle", "")),
                    "cta_text": request.data.get("cta_text", previous.get("cta_text", "")),
                    "cta_link": "/products/?has_discount=true",
                    "background_image": request.data.get(
                        "background_image", previous.get("background_image", "")
                    ),
                    "collection_slug": request.data.get(
                        "collection_slug", previous.get("collection_slug")
                    ),
                    "expires_at": result["expires_at"],
                },
            )
        except Exception:
            pass
        return Response(result, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="discount-section/add-one")
    def discount_section_add_one(self, request):
        """Incremental add: POST .../discount-section/add-one/
        {product_id, discount_percent?} (inherits campaign % if omitted)."""
        from .serializers import DiscountSectionProductSerializer

        serializer = DiscountSectionProductSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        raw_pct = request.data.get("discount_percent")
        pct = None
        if raw_pct is not None:
            try:
                pct = int(raw_pct)
            except (TypeError, ValueError):
                return Response(
                    {"detail": "discount_percent must be an integer between 1 and 99."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        service = ProductService()
        result = service.add_product_to_section(
            serializer.validated_data["product_id"], pct
        )
        return Response(result, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="discount-section/remove-one")
    def discount_section_remove_one(self, request):
        """Incremental remove: POST .../discount-section/remove-one/
        {product_id} (product stays on the site, discount cleared)."""
        from .serializers import DiscountSectionProductSerializer

        serializer = DiscountSectionProductSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = ProductService()
        result = service.remove_product_from_section(
            serializer.validated_data["product_id"]
        )
        return Response(result, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="discount-section/set-percent")
    def discount_section_set_percent(self, request):
        """Mid-campaign adjust: POST .../discount-section/set-percent/
        {discount_percent, product_ids?: [...], expires_at?: iso|null}
        (all campaign items if product_ids omitted; deadline preserved unless
        expires_at is explicitly sent, null clears it)."""
        from .serializers import DiscountSectionSetPercentSerializer

        serializer = DiscountSectionSetPercentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = ProductService()
        kwargs = {}
        if "expires_at" in request.data:
            kwargs["expires_at"] = serializer.validated_data.get("expires_at")
        result = service.set_section_percent(
            serializer.validated_data["discount_percent"],
            serializer.validated_data.get("product_ids"),
            **kwargs,
        )
        # Keep the CMS banner expiry in sync when the deadline moves
        if "expires_at" in request.data:
            try:
                from cms.services import CMSService
                from cms.selectors import SiteContentSelector

                current = SiteContentSelector.get_by_key("discount_section") or {}
                current["expires_at"] = result["expires_at"]
                CMSService().update_site_content("discount_section", current)
            except Exception:
                pass
        return Response(result, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="discount-section/content")
    def discount_section_content(self, request):
        """Mid-campaign media/text edit: POST .../discount-section/content/
        {title?, subtitle?, cta_text?, background_image?, collection_slug?}
        merges into CMS content without touching products."""
        from .serializers import DiscountSectionContentSerializer

        serializer = DiscountSectionContentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            from cms.services import CMSService
            from cms.selectors import SiteContentSelector

            current = SiteContentSelector.get_by_key("discount_section") or {}
            merged = {**current, **serializer.validated_data}
            # Never allow content edit to flip the toggle accidentally
            if "enabled" not in request.data:
                merged["enabled"] = current.get("enabled", False)
            CMSService().update_site_content("discount_section", merged)
        except Exception:
            pass
        return Response(merged, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="discount-section/deactivate")
    def discount_section_deactivate(self, request):
        """Bulk revert: POST /api/admin/products/discount-section/deactivate/
        clears discounts on all campaign products (prices restore) + flips toggle off."""
        service = ProductService()
        result = service.deactivate_discount_section()
        try:
            from cms.services import CMSService
            from cms.selectors import SiteContentSelector

            current = SiteContentSelector.get_by_key("discount_section") or {}
            current["enabled"] = False
            CMSService().update_site_content("discount_section", current)
        except Exception:
            pass
        return Response(result, status=status.HTTP_200_OK)

    def list(self, request):
        # Direct admin list with full filter support per spec
        filters = {}
        if "status" in request.query_params:
            filters["status"] = request.query_params["status"]
        if "search" in request.query_params:
            filters["search"] = request.query_params["search"]
        if "category" in request.query_params:
            filters["category"] = request.query_params["category"]
        if "ordering" in request.query_params:
            filters["ordering"] = request.query_params["ordering"]
        if "has_discount" in request.query_params:
            filters["has_discount"] = request.query_params["has_discount"]
        products = ProductSelector.get_all_products_admin(filters)
        page = self.paginate_queryset(products)
        if page is not None:
            serializer = ProductDetailSerializer(
                page, many=True, context={"request": request, "include_related": False}
            )
            return self.get_paginated_response(serializer.data)
        serializer = ProductDetailSerializer(
            products, many=True, context={"request": request, "include_related": False}
        )
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="admin-list")
    def admin_list(self, request):
        filters = {}
        if "status" in request.query_params:
            filters["status"] = request.query_params["status"]
        if "search" in request.query_params:
            filters["search"] = request.query_params["search"]
        if "category" in request.query_params:
            filters["category"] = request.query_params["category"]
        if "ordering" in request.query_params:
            filters["ordering"] = request.query_params["ordering"]
        if "has_discount" in request.query_params:
            filters["has_discount"] = request.query_params["has_discount"]
        products = ProductSelector.get_all_products_admin(filters)
        page = self.paginate_queryset(products)
        if page is not None:
            serializer = ProductDetailSerializer(
                page, many=True, context={"request": request, "include_related": False}
            )
            return self.get_paginated_response(serializer.data)
        serializer = ProductDetailSerializer(
            products, many=True, context={"request": request, "include_related": False}
        )
        return Response(serializer.data)

    @action(detail=True, methods=["get", "post"], url_path="related")
    def related(self, request, pk=None):
        """GET /api/admin/products/<id>/related/ - list manual pins (suggested, hybrid)
        POST /api/admin/products/<id>/related/ {target_ids, positions} - set pins (suggested)"""
        if request.method == "GET":
            product = ProductSelector.get_product_by_id(pk)
            if not product:
                return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
            from .models import RelatedProduct
            from .serializers import RelatedProductCardSerializer

            related_qs = (
                RelatedProduct.objects.filter(
                    source_product=product, relation_type=RelatedProduct.RelationType.SUGGESTED
                )
                .select_related("target_product", "target_product__category")
                .order_by("position", "-created_at")
            )
            data = []
            for rel in related_qs:
                target = rel.target_product
                card = RelatedProductCardSerializer(target, context={"request": request}).data
                card["position"] = rel.position
                card["is_manual_pin"] = True
                data.append(card)
            return Response(data)

        # POST - set pins (suggested)
        product = ProductSelector.get_product_by_id(pk)
        if not product:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        target_ids = request.data.get("target_ids", [])
        positions = request.data.get("positions", [])
        if not isinstance(target_ids, list) or not target_ids:
            return Response({"detail": "target_ids required."}, status=status.HTTP_400_BAD_REQUEST)
        if len(target_ids) > 8:
            return Response({"detail": "Related products allows at most 8 items (remaining auto-filled)."}, status=status.HTTP_400_BAD_REQUEST)
        if isinstance(target_ids, str):
            target_ids = [target_ids]
        from .models import RelatedProduct

        RelatedProduct.objects.filter(
            source_product=product, relation_type=RelatedProduct.RelationType.SUGGESTED
        ).delete()
        to_create = []
        for idx, tid in enumerate(target_ids[:8]):
            try:
                target = ProductSelector.get_product_by_id(tid)
                if not target:
                    continue
                if str(target.id) == str(product.id):
                    continue
                pos = positions[idx] if idx < len(positions) else idx
                to_create.append(
                    RelatedProduct(
                        source_product=product,
                        target_product=target,
                        relation_type=RelatedProduct.RelationType.SUGGESTED,
                        position=int(pos),
                    )
                )
            except Exception:
                continue
        if to_create:
            RelatedProduct.objects.bulk_create(to_create)
        # Invalidate cache for this product (all limits)
        try:
            from django.core.cache import cache

            for lim in range(1, 9):
                cache.delete(f"related:{product.id}:{lim}")
                cache.delete(f"suggested:{product.id}:{lim}")
        except Exception:
            pass
        related_qs = RelatedProduct.objects.filter(
            source_product=product, relation_type=RelatedProduct.RelationType.SUGGESTED
        ).order_by("position")
        from .serializers import RelatedProductCardSerializer

        data = []
        for rel in related_qs.select_related("target_product"):
            card = RelatedProductCardSerializer(rel.target_product, context={"request": request}).data
            card["position"] = rel.position
            card["is_manual_pin"] = True
            data.append(card)
        return Response(data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["delete"], url_path=r"related/(?P<target_id>[^/.]+)")
    def related_delete(self, request, pk=None, target_id=None):
        """DELETE /api/admin/products/<id>/related/<target_id>/ (suggested)"""
        product = ProductSelector.get_product_by_id(pk)
        if not product:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        from .models import RelatedProduct

        deleted, _ = RelatedProduct.objects.filter(
            source_product=product, target_product__id=target_id, relation_type=RelatedProduct.RelationType.SUGGESTED
        ).delete()
        if deleted == 0:
            return Response({"detail": "Relation not found."}, status=status.HTTP_404_NOT_FOUND)
        try:
            from django.core.cache import cache

            for lim in range(1, 13):
                cache.delete(f"related:{product.id}:{lim}")
                cache.delete(f"suggested:{product.id}:{lim}")
        except Exception:
            pass
        return Response({"message": "Relation removed."})

    @action(detail=True, methods=["get", "post"], url_path="complete-look")
    def complete_look_admin(self, request, pk=None):
        """GET/POST /api/admin/products/<id>/complete-look/ - manual only, no fallback"""
        from .models import RelatedProduct
        from .serializers import RelatedProductCardSerializer

        product = ProductSelector.get_product_by_id(pk)
        if not product:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        if request.method == "GET":
            qs = (
                RelatedProduct.objects.filter(
                    source_product=product, relation_type=RelatedProduct.RelationType.COMPLETE_LOOK
                )
                .select_related("target_product", "target_product__category")
                .order_by("position", "-created_at")
            )
            data = []
            for rel in qs:
                card = RelatedProductCardSerializer(rel.target_product, context={"request": request}).data
                card["position"] = rel.position
                card["is_manual_pin"] = True
                data.append(card)
            return Response(data)
        # POST
        target_ids = request.data.get("target_ids", [])
        positions = request.data.get("positions", [])
        if not isinstance(target_ids, list) or not target_ids:
            return Response({"detail": "target_ids required."}, status=status.HTTP_400_BAD_REQUEST)
        if len(target_ids) > 6:
            return Response({"detail": "Complete look allows at most 6 items."}, status=status.HTTP_400_BAD_REQUEST)
        RelatedProduct.objects.filter(
            source_product=product, relation_type=RelatedProduct.RelationType.COMPLETE_LOOK
        ).delete()
        to_create = []
        for idx, tid in enumerate(target_ids[:6]):
            try:
                target = ProductSelector.get_product_by_id(tid)
                if not target or str(target.id) == str(product.id):
                    continue
                pos = positions[idx] if idx < len(positions) else idx
                to_create.append(
                    RelatedProduct(
                        source_product=product,
                        target_product=target,
                        relation_type=RelatedProduct.RelationType.COMPLETE_LOOK,
                        position=int(pos),
                    )
                )
            except Exception:
                continue
        if to_create:
            RelatedProduct.objects.bulk_create(to_create)
        # Invalidate cache
        try:
            from django.core.cache import cache

            for lim in range(1, 7):
                cache.delete(f"complete_look:{product.id}:{lim}")
                cache.delete(f"related:{product.id}:{lim}")
        except Exception:
            pass
        qs = RelatedProduct.objects.filter(
            source_product=product, relation_type=RelatedProduct.RelationType.COMPLETE_LOOK
        ).order_by("position")
        data = []
        for rel in qs.select_related("target_product"):
            card = RelatedProductCardSerializer(rel.target_product, context={"request": request}).data
            card["position"] = rel.position
            card["is_manual_pin"] = True
            data.append(card)
        return Response(data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["delete"], url_path=r"complete-look/(?P<target_id>[^/.]+)")
    def complete_look_delete(self, request, pk=None, target_id=None):
        """DELETE /api/admin/products/<id>/complete-look/<target_id>/"""
        product = ProductSelector.get_product_by_id(pk)
        if not product:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        from .models import RelatedProduct

        deleted, _ = RelatedProduct.objects.filter(
            source_product=product,
            target_product__id=target_id,
            relation_type=RelatedProduct.RelationType.COMPLETE_LOOK,
        ).delete()
        if deleted == 0:
            return Response({"detail": "Relation not found."}, status=status.HTTP_404_NOT_FOUND)
        try:
            from django.core.cache import cache

            for lim in range(1, 13):
                cache.delete(f"complete_look:{product.id}:{lim}")
                cache.delete(f"related:{product.id}:{lim}")
        except Exception:
            pass
        return Response({"message": "Relation removed."})

    def retrieve(self, request, pk=None):
        product = ProductSelector.get_product_by_id(pk)
        if not product:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = ProductDetailSerializer(product, context={"request": request})
        return Response(serializer.data)


from .models import Review
from .serializers import (
    ReviewSerializer,
    ReviewCreateSerializer,
    AdminReviewUpdateSerializer,
)


class PublicReviewViewSet(viewsets.GenericViewSet):
    permission_classes = [AllowAny]

    def _get_product(self, product_slug):
        prod = ProductSelector.get_product_by_slug(product_slug)
        if not prod:
            try:
                prod = ProductSelector.get_product_by_id(product_slug)
            except Exception:
                prod = None
        return prod

    def list(self, request, product_slug=None):
        product = self._get_product(product_slug)
        if not product:
            return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)
        reviews = Review.objects.filter(
            product=product,
            status=Review.Status.APPROVED,
            deleted_at__isnull=True,
        ).select_related("product", "user").order_by("-created_at")
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    def create(self, request, product_slug=None):
        product = self._get_product(product_slug)
        if not product:
            return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = ReviewCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user if request.user and request.user.is_authenticated else None

        custom_name = serializer.validated_data.get("user_name")
        if custom_name and custom_name.strip() and custom_name.strip() != "کاربر خریدار":
            user_display = custom_name.strip()
        elif user:
            user_display = f"{user.first_name} {user.last_name}".strip() or getattr(user, "phone_number", "") or "کاربر خریدار"
        else:
            user_display = "کاربر خریدار"

        review = Review.objects.create(
            product=product,
            user=user,
            user_name=user_display,
            rating=serializer.validated_data.get("rating", 5),
            text=serializer.validated_data["text"],
            status=Review.Status.PENDING,
        )
        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)


class AdminReviewViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAdminUser]

    def list(self, request):
        qs = Review.objects.filter(deleted_at__isnull=True).select_related("product", "user")
        status_param = request.query_params.get("status")
        if status_param and status_param != "all":
            qs = qs.filter(status=status_param)
        product_id = request.query_params.get("product_id")
        if product_id:
            qs = qs.filter(product_id=product_id)
        search = request.query_params.get("search")
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(user_name__icontains=search)
                | Q(text__icontains=search)
                | Q(product__title__icontains=search)
            )
        qs = qs.order_by("-created_at")
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = ReviewSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = ReviewSerializer(qs, many=True)
        return Response(serializer.data)

    def partial_update(self, request, pk=None):
        review = Review.objects.filter(id=pk, deleted_at__isnull=True).first()
        if not review:
            return Response({"detail": "Review not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = AdminReviewUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        for attr, val in serializer.validated_data.items():
            setattr(review, attr, val)
        review.save()
        return Response(ReviewSerializer(review).data)

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        review = Review.objects.filter(id=pk, deleted_at__isnull=True).first()
        if not review:
            return Response({"detail": "Review not found."}, status=status.HTTP_404_NOT_FOUND)
        review.status = Review.Status.APPROVED
        review.save(update_fields=["status", "updated_at"])
        return Response(ReviewSerializer(review).data)

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        review = Review.objects.filter(id=pk, deleted_at__isnull=True).first()
        if not review:
            return Response({"detail": "Review not found."}, status=status.HTTP_404_NOT_FOUND)
        review.status = Review.Status.REJECTED
        review.save(update_fields=["status", "updated_at"])
        return Response(ReviewSerializer(review).data)

    def destroy(self, request, pk=None):
        review = Review.objects.filter(id=pk, deleted_at__isnull=True).first()
        if not review:
            return Response({"detail": "Review not found."}, status=status.HTTP_404_NOT_FOUND)
        review.delete()
        return Response({"message": "Review deleted."})
