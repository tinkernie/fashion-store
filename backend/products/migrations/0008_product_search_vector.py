"""PostgreSQL-only full-text search for Product.

Uses SeparateDatabaseAndState so SQLite dev/test keeps working:
- state tracks search_vector + indexes on both backends
- database DDL (extensions, tsvector column, GIN index, trigger) runs on
  PostgreSQL only; SQLite skips everything and the selector falls back
  to icontains there.
"""

from django.contrib.postgres.indexes import GinIndex
from django.contrib.postgres.search import SearchVectorField
from django.db import migrations, models
from django.db.migrations.operations.base import Operation


class CreatePgSearchObjects(Operation):
    reduces_to_sql = False
    reversible = True

    def state_forwards(self, app_label, state):
        pass

    def state_backwards(self, app_label, state):
        pass

    def database_forwards(self, app_label, schema_editor, from_state, to_state):
        if schema_editor.connection.vendor != "postgresql":
            # SQLite dev fallback: plain NULL column so the ORM's default
            # SELECT * keeps working (the column is never read/written there).
            with schema_editor.connection.cursor() as cur:
                cols = [r[1] for r in cur.execute("PRAGMA table_info(product)").fetchall()]
                if "search_vector" not in cols:
                    cur.execute("ALTER TABLE product ADD COLUMN search_vector TEXT")
            return
        schema_editor.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
        schema_editor.execute("CREATE EXTENSION IF NOT EXISTS unaccent")
        schema_editor.execute("ALTER TABLE product ADD COLUMN IF NOT EXISTS search_vector tsvector")
        schema_editor.execute(
            "CREATE INDEX IF NOT EXISTS product_search_gin "
            "ON product USING GIN (search_vector)"
        )
        schema_editor.execute(
            "CREATE INDEX IF NOT EXISTS product_title_trgm "
            "ON product USING GIN (title gin_trgm_ops)"
        )
        schema_editor.execute(
            """
            CREATE OR REPLACE FUNCTION product_search_vector_update() RETURNS trigger AS $$
            BEGIN
              NEW.search_vector :=
                setweight(to_tsvector('simple', coalesce(NEW.title, '')), 'A') ||
                setweight(to_tsvector('simple', coalesce(NEW.description, '')), 'B');
              RETURN NEW;
            END $$ LANGUAGE plpgsql;
            """
        )
        schema_editor.execute(
            """
            DROP TRIGGER IF EXISTS product_search_vector_trigger ON product;
            CREATE TRIGGER product_search_vector_trigger
            BEFORE INSERT OR UPDATE OF title, description ON product
            FOR EACH ROW EXECUTE FUNCTION product_search_vector_update();
            """
        )
        # Backfill existing rows
        schema_editor.execute(
            """
            UPDATE product SET search_vector =
              setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
              setweight(to_tsvector('simple', coalesce(description, '')), 'B');
            """
        )

    def database_backwards(self, app_label, schema_editor, from_state, to_state):
        if schema_editor.connection.vendor != "postgresql":
            try:
                schema_editor.execute("ALTER TABLE product DROP COLUMN search_vector")
            except Exception:
                pass
            return
        schema_editor.execute("DROP TRIGGER IF EXISTS product_search_vector_trigger ON product")
        schema_editor.execute("DROP FUNCTION IF EXISTS product_search_vector_update()")
        schema_editor.execute("DROP INDEX IF EXISTS product_title_trgm")
        schema_editor.execute("DROP INDEX IF EXISTS product_search_gin")
        schema_editor.execute("ALTER TABLE product DROP COLUMN IF EXISTS search_vector")

    def describe(self):
        return "Create PostgreSQL search extensions, tsvector column, GIN/trigram indexes and trigger"


class Migration(migrations.Migration):
    dependencies = [
        ("products", "0007_alter_relatedproduct_unique_together_and_more"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AddField(
                    model_name="product",
                    name="search_vector",
                    field=SearchVectorField(blank=True, editable=False, null=True),
                ),
                migrations.AddIndex(
                    model_name="product",
                    index=GinIndex(fields=["search_vector"], name="product_search_gin"),
                ),
                migrations.AddIndex(
                    model_name="product",
                    index=models.Index(
                        fields=["status", "-created_at"], name="product_status_created_idx"
                    ),
                ),
            ],
            database_operations=[CreatePgSearchObjects()],
        ),
    ]
