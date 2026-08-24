from rest_framework import serializers


class CollectionCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200)
    slug = serializers.SlugField()
    description = serializers.CharField(required=False, allow_blank=True)
    hero_banner = serializers.ImageField(required=False)
    landing_page_content = serializers.CharField(required=False, allow_blank=True)
    seo_metadata = serializers.JSONField(required=False, default=dict)
    priority = serializers.IntegerField(default=0)
    is_active = serializers.BooleanField(default=True)
    published_from = serializers.DateTimeField(required=False, allow_null=True)
    published_until = serializers.DateTimeField(required=False, allow_null=True)


class CollectionUpdateSerializer(CollectionCreateSerializer):
    name = serializers.CharField(max_length=200, required=False)
    slug = serializers.SlugField(required=False)


class CollectionDetailSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    name = serializers.CharField()
    slug = serializers.SlugField()
    description = serializers.CharField()
    hero_banner = serializers.ImageField(source="hero_banner.url", allow_null=True)
    landing_page_content = serializers.CharField()
    seo_metadata = serializers.JSONField()
    priority = serializers.IntegerField()
    is_active = serializers.BooleanField()
    published_from = serializers.DateTimeField()
    published_until = serializers.DateTimeField()
    products = serializers.SerializerMethodField()

    def get_products(self, obj):
        if hasattr(obj, "product_links"):
            results = []
            for link in obj.product_links.select_related("product").all():
                p = link.product
                price = "0"
                if hasattr(p, "variants"):
                    first_v = p.variants.filter(deleted_at__isnull=True).first()
                    if first_v:
                        price = str(first_v.price)
                if price == "0" and p.metadata and "price" in p.metadata:
                    price = str(p.metadata["price"])
                
                image_url = ""
                if p.metadata and "image_url" in p.metadata:
                    image_url = p.metadata["image_url"]
                elif p.metadata and "imageUrl" in p.metadata:
                    image_url = p.metadata["imageUrl"]
                else:
                    try:
                        from media_libm.selectors import MediaSelector
                        main_img = MediaSelector.get_main_image_for_product(p)
                        if main_img and main_img.get("url"):
                            image_url = main_img["url"]
                    except Exception:
                        pass

                results.append({
                    "id": str(p.id),
                    "title": p.title,
                    "name": p.title,
                    "slug": p.slug,
                    "price": price,
                    "image_url": image_url,
                    "imageUrl": image_url,
                    "position": link.position,
                })
            return results
        return []


class ProductPositionSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    position = serializers.IntegerField(min_value=0)


class SetProductPositionsSerializer(serializers.Serializer):
    items = ProductPositionSerializer(many=True, allow_empty=False)


# class SetProductPositionsSerializer(serializers.Serializer):
#     items = serializers.ListField(
#         child=serializers.DictField(child=serializers.IntegerField(), allow_empty=False)
#     )


class ProductActionSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    position = serializers.IntegerField(default=0)
