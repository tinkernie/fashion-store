from .models import Media
from common.exceptions import BusinessException


class MediaRepository:
    @staticmethod
    def create_media(**validated_data) -> Media:
        return Media.objects.create(**validated_data)

    @staticmethod
    def update_media(media: Media, **fields) -> Media:
        allowed = {'alt_text', 'caption', 'position', 'metadata'}
        for key, value in fields.items():
            if key in allowed:
                setattr(media, key, value)
        media.save()
        return media

    @staticmethod
    def delete_media(media: Media):
        media.delete()  # soft delete
