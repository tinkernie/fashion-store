from django.db import migrations


def seed_discount_section(apps, schema_editor):
    SiteContent = apps.get_model("cms", "SiteContent")
    SiteContent.objects.get_or_create(
        key="discount_section",
        defaults={
            "content": {
                "enabled": False,
                "title": "",
                "subtitle": "",
                "cta_text": "",
                "cta_link": "/products/?has_discount=true",
                "collection_slug": None,
                "background_image": "",
                "expires_at": None,
            }
        },
    )


def unseed_discount_section(apps, schema_editor):
    SiteContent = apps.get_model("cms", "SiteContent")
    SiteContent.objects.filter(key="discount_section").delete()


class Migration(migrations.Migration):
    dependencies = [("cms", "0001_initial")]

    operations = [migrations.RunPython(seed_discount_section, unseed_discount_section)]
