from django.db import migrations, models, connection


def backfill(apps, schema_editor):
    """Sequential codes 1..N in creation order (created_at, then pk)."""
    Product = apps.get_model("products", "Product")
    ordered = Product.objects.order_by("created_at", "id")
    for number, product in enumerate(ordered, start=1):
        Product.objects.filter(pk=product.pk).update(insta_id=number)


def reverse_backfill(apps, schema_editor):
    Product = apps.get_model("products", "Product")
    Product.objects.update(insta_id=None)


def create_postgres_sequence(apps, schema_editor):
    """Production-safe counter: sequence + column default so even raw SQL
    and bulk_create paths allocate codes without gaps from races.
    SQLite (local dev/tests) relies on the ORM signal instead."""
    if connection.vendor != "postgresql":
        return
    with connection.cursor() as cursor:
        cursor.execute("DROP SEQUENCE IF EXISTS product_insta_id_seq")
        cursor.execute(
            "SELECT COALESCE(MAX(insta_id), 0) FROM product"
        )
        start = cursor.fetchone()[0] + 1
        cursor.execute(
            "CREATE SEQUENCE product_insta_id_seq START WITH %s", (start,)
        )
        cursor.execute(
            "ALTER TABLE product "
            "ALTER COLUMN insta_id SET DEFAULT nextval('product_insta_id_seq')"
        )


def reverse_create_postgres_sequence(apps, schema_editor):
    if connection.vendor != "postgresql":
        return
    with connection.cursor() as cursor:
        cursor.execute(
            "ALTER TABLE product ALTER COLUMN insta_id DROP DEFAULT"
        )
        cursor.execute("DROP SEQUENCE IF EXISTS product_insta_id_seq")


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0009_alter_product_slug_product_uq_product_slug_active"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="insta_id",
            field=models.PositiveBigIntegerField(
                blank=True,
                editable=False,
                help_text="Sequential public product code (auto-assigned, starts at 1)",
                null=True,
                unique=True,
            ),
        ),
        migrations.RunPython(backfill, reverse_backfill),
        migrations.AlterField(
            model_name="product",
            name="insta_id",
            field=models.PositiveBigIntegerField(
                editable=False,
                help_text="Sequential public product code (auto-assigned, starts at 1)",
                unique=True,
            ),
        ),
        migrations.RunPython(
            create_postgres_sequence, reverse_create_postgres_sequence
        ),
    ]
