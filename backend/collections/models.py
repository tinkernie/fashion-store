from django.db import models
from common.models import BaseModel

class Collection(BaseModel):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, db_index=True)
    description = models.TextField(blank=True)
    hero_banner = models.ImageField(upload_to='collections/banners/', null=True, blank=True)
    landing_page_content = models.TextField(blank=True)  # could be HTML or markdown
    seo_metadata = models.JSONField(default=dict, blank=True)  # {title, description, keywords}
    priority = models.PositiveIntegerField(default=0, db_index=True)  # for sorting
    is_active = models.BooleanField(default=True)
    published_from = models.DateTimeField(null=True, blank=True)
    published_until = models.DateTimeField(null=True, blank=True)

    products = models.ManyToManyField(
        'products.Product',
        through='CollectionProduct',
        related_name='collections',
        blank=True,
    )

    class Meta:
        db_table = 'collection'
        ordering = ['-priority', '-created_at']

    def __str__(self):
        return self.name

    def delete(self, *args, **kwargs):
        # Soft delete
        self.is_active = False
        self.save(update_fields=['is_active', 'updated_at'])


class CollectionProduct(models.Model):
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE, related_name='product_links')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='collection_links')
    position = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        db_table = 'collection_product'
        ordering = ['position', 'id']
        unique_together = ('collection', 'product')