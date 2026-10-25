from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0011_delete_placeholder_inventories"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="discount_source",
            field=models.CharField(
                blank=True,
                db_index=True,
                choices=[
                    ("campaign", "Campaign"),
                    ("collection", "Collection"),
                    ("manual", "Manual"),
                ],
                help_text="Which system owns the current discount (null = none)",
                max_length=12,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="product",
            name="discount_collection_id",
            field=models.UUIDField(
                blank=True,
                db_index=True,
                help_text="Collection that owns the discount (reverts with it)",
                null=True,
            ),
        ),
    ]
