from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from common.models import BaseModel


class Media(BaseModel):
    class MediaType(models.TextChoices):
        IMAGE = 'image', 'Image'
        VIDEO = 'video', 'Video'
        THUMBNAIL = 'thumbnail', 'Thumbnail'
        MODEL_360 = '360', '360 View'

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE,
                                     limit_choices_to={'model__in': ['productoption', 'collection', 'page']})
    object_id = models.UUIDField()
    content_object = GenericForeignKey('content_type', 'object_id')

    file = models.FileField(upload_to='media_libm/%Y/%m/')
    media_type = models.CharField(max_length=20, choices=MediaType.choices, default=MediaType.IMAGE)
    alt_text = models.CharField(max_length=500, blank=True)
    caption = models.TextField(blank=True)
    position = models.PositiveIntegerField(default=0, db_index=True)
    metadata = models.JSONField(default=dict, blank=True)  # stores thumbnail path, responsive urls, video duration etc.

    class Meta:
        db_table = 'media_libm'
        ordering = ['position']

    def __str__(self):
        return f"{self.media_type} for {self.content_object}"
