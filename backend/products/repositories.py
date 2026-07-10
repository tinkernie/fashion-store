from .models import Product
from common.exceptions import BusinessException


class ProductRepository:
    @staticmethod
    def create_product(**validated_data) -> Product:
        return Product.objects.create(**validated_data)

    @staticmethod
    def update_product(product: Product, **fields) -> Product:
        allowed = {'title', 'slug', 'description', 'category', 'status',
                   'seo_metadata', 'metadata'}
        for key, value in fields.items():
            if key in allowed:
                setattr(product, key, value)
        product.save()
        return product

    @staticmethod
    def soft_delete_product(product: Product):
        product.delete()  # uses inherited soft delete
