import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from categories.models import Category
from store_collections.models import Collection, CollectionProduct
from products.models import Product
from variants.models import Variant, VariantOption
from product_options.models import ProductOption, OptionValue
from inventory.models import Inventory
from common.models import User

def seed():
    print("--- Seeding Fashion Store Database ---")

    # 1. Admin User
    admin, created = User.objects.get_or_create(
        email="admin@fashionstore.com",
        defaults={"first_name": "Admin", "last_name": "Store", "is_staff": True, "is_superuser": True}
    )
    if created or not admin.password:
        admin.set_password("AdminPassword123!")
        admin.save()
    print(f"Admin: {admin.email} (Password: AdminPassword123!)")

    # 2. Categories
    categories_data = [
        {"name": "مانتو و پالتو", "slug": "manteau", "description": "انواع مانتو، وست و پالتوهای شیک"},
        {"name": "تی‌شرت و کراپ", "slug": "tshirt", "description": "تی‌شرت‌های لش، بیسیک و کراپ تاپ"},
        {"name": "شلوار و جین", "slug": "pants", "description": "شلوارهای واید، کارگو، مام استایل و بگ"},
        {"name": "شال و روسری", "slug": "scarf", "description": "شال‌های نخی، اسلپ و مینی اسکارف"},
        {"name": "اکسسوری و کیف", "slug": "accessories", "description": "کیف‌های چرم و اکسسوری‌های مینیمال"},
    ]

    cats = {}
    for cdata in categories_data:
        cat, _ = Category.objects.get_or_create(
            slug=cdata["slug"],
            defaults={"name": cdata["name"], "description": cdata["description"], "is_active": True}
        )
        cat.name = cdata["name"]
        cat.is_active = True
        cat.save()
        cats[cdata["slug"]] = cat
    print(f"Categories seeded: {len(cats)}")

    # 3. Collections
    collections_data = [
        {"name": "کالکشن تابستانه", "slug": "summer-drop", "description": "جدیدترین ترندهای خنک تابستان"},
        {"name": "فروش ویژه", "slug": "special-sale", "description": "تخفیف‌های استثنایی بر روی منتخب محصولات"},
        {"name": "مینیمال و بیسیک", "slug": "minimal-essentials", "description": "استایل‌های مینیمال برای استفاده روزمره"},
    ]

    colls = {}
    for coldata in collections_data:
        col, _ = Collection.objects.get_or_create(
            slug=coldata["slug"],
            defaults={"name": coldata["name"], "description": coldata["description"], "is_active": True}
        )
        col.name = coldata["name"]
        col.is_active = True
        col.save()
        colls[coldata["slug"]] = col
    print(f"Collections seeded: {len(colls)}")

    # 4. Products & Variants
    sample_products = [
        {
            "title": "مانتو لینن خنک تابستانه",
            "slug": "linen-summer-manteau",
            "category": cats["manteau"],
            "description": "طراحی شده با پارچه لینن ۱۰۰٪ طبیعی، سبک و مناسب روزهای گرم با تن‌خور آزاد و مدرن.",
            "price": "1850000.00",
            "image": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop",
            "collections": [colls["summer-drop"], colls["special-sale"]],
            "sizes": ["Free"],
            "colors": ["کرم", "سبز زیتونی", "مشکی"],
            "sku_prefix": "MAN-LINEN"
        },
        {
            "title": "تی‌شرت لش مینیمال مشکی",
            "slug": "minimal-oversized-black-tee",
            "category": cats["tshirt"],
            "description": "تی‌شرت با بافت پنبه اعلا دو رو سوپر، یقه کش‌بافت دوبل و دوخت صنعتی بسیار تمیز.",
            "price": "890000.00",
            "image": "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1000&auto=format&fit=crop",
            "collections": [colls["minimal-essentials"], colls["summer-drop"]],
            "sizes": ["M", "L", "XL"],
            "colors": ["مشکی", "سفید"],
            "sku_prefix": "TEE-BLK"
        },
        {
            "title": "شلوار کارگو واید استایل خیابانی",
            "slug": "street-wide-cargo-pants",
            "category": cats["pants"],
            "description": "شلوار کارگو جیب پاکتی با فاق راحت و پارچه کتان شسته‌شده گرم بالا، مناسب استایل کژوال.",
            "price": "1450000.00",
            "image": "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?q=80&w=1000&auto=format&fit=crop",
            "collections": [colls["special-sale"]],
            "sizes": ["30", "32", "34"],
            "colors": ["طوسی زغالی", "کرم خاکی"],
            "sku_prefix": "PNT-CRG"
        },
        {
            "title": "وست کتی ژاکارد لوکس",
            "slug": "jacquard-luxe-vest",
            "category": cats["manteau"],
            "description": "وست کتی آستردار مغزی‌دوزی شده با پارچه ژاکارد طرحدار بسیار خاص و مجلسی.",
            "price": "2300000.00",
            "image": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1000&auto=format&fit=crop",
            "collections": [colls["special-sale"]],
            "sizes": ["1 (36-40)", "2 (42-46)"],
            "colors": ["طلایی-مشکی", "نقره‌ای-طوسی"],
            "sku_prefix": "VST-JCQ"
        },
        {
            "title": "کراپ تاپ بافت بیسیک",
            "slug": "basic-ribbed-crop-top",
            "category": cats["tshirt"],
            "description": "کراپ تاپ کشبافت فوق‌العاده باکیفیت و تنفس‌پذیر برای استفاده زیر مانتو و استایل‌های روزمره.",
            "price": "580000.00",
            "image": "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop",
            "collections": [colls["summer-drop"], colls["minimal-essentials"]],
            "sizes": ["S/M", "L/XL"],
            "colors": ["سفید", "کالباسی", "مشکی"],
            "sku_prefix": "CRP-BSC"
        },
        {
            "title": "شال ژاکارد نخ ابریشم مینیمال",
            "slug": "minimal-silk-cotton-scarf",
            "category": cats["scarf"],
            "description": "شال با بافت خنک بدون سُر خوردن با ایستایی عالی و رنگ‌بندی ملایم و نود.",
            "price": "650000.00",
            "image": "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?q=80&w=1000&auto=format&fit=crop",
            "collections": [colls["minimal-essentials"]],
            "sizes": ["70x200"],
            "colors": ["کرم نود", "طوسی مات"],
            "sku_prefix": "SCF-SLK"
        },
        {
            "title": "کیف دوشی چرم باگت مدرن",
            "slug": "modern-baguette-shoulder-bag",
            "category": cats["accessories"],
            "description": "کیف دوشی طراحی ترند با بند قابل تنظیم و یراق‌آلات طلایی مات ضد حساسیت.",
            "price": "1650000.00",
            "image": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1000&auto=format&fit=crop",
            "collections": [colls["special-sale"]],
            "sizes": ["Standard"],
            "colors": ["مشکی براق", "قهوه‌ای تافی"],
            "sku_prefix": "BAG-BGT"
        },
        {
            "title": "شلوار جین بگ ذغالی وینتیج",
            "slug": "vintage-baggy-charcoal-jeans",
            "category": cats["pants"],
            "description": "جین دنیم ۱۰۰٪ پنبه بدون کشسانی با زاپ‌های ملایم و فاق بلند خوش‌استایل.",
            "price": "1950000.00",
            "image": "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1000&auto=format&fit=crop",
            "collections": [colls["minimal-essentials"]],
            "sizes": ["30", "31", "32", "33"],
            "colors": ["ذغالی شسته‌شده"],
            "sku_prefix": "JNS-BAG"
        }
    ]

    for pdata in sample_products:
        prod, _ = Product.objects.get_or_create(
            slug=pdata["slug"],
            defaults={
                "title": pdata["title"],
                "category": pdata["category"],
                "description": pdata["description"],
                "status": "published",
                "seo_metadata": {"image": pdata["image"]}
            }
        )
        prod.title = pdata["title"]
        prod.category = pdata["category"]
        prod.description = pdata["description"]
        prod.status = "published"
        prod.seo_metadata = {"image": pdata["image"]}
        prod.save()

        # Link to collections
        for col in pdata["collections"]:
            CollectionProduct.objects.get_or_create(collection=col, product=prod)

        # Options
        size_opt, _ = ProductOption.objects.get_or_create(product=prod, name="سایز")
        color_opt, _ = ProductOption.objects.get_or_create(product=prod, name="رنگ")

        for s in pdata["sizes"]:
            OptionValue.objects.get_or_create(option=size_opt, value=s)
        for c in pdata["colors"]:
            OptionValue.objects.get_or_create(option=color_opt, value=c)

        # Variants
        for s in pdata["sizes"]:
            s_val = OptionValue.objects.get(option=size_opt, value=s)
            for c in pdata["colors"]:
                c_val = OptionValue.objects.get(option=color_opt, value=c)
                sku = f"{pdata['sku_prefix']}-{s}-{c}"
                var, _ = Variant.objects.get_or_create(
                    sku=sku,
                    defaults={
                        "product": prod,
                        "price": pdata["price"],
                        "availability": "in_stock",
                        "status": "published",
                        "weight": 350
                    }
                )
                var.price = pdata["price"]
                var.availability = "in_stock"
                var.status = "published"
                var.save()

                VariantOption.objects.get_or_create(variant=var, option=size_opt, option_value=s_val)
                VariantOption.objects.get_or_create(variant=var, option=color_opt, option_value=c_val)

                # Inventory
                inv, _ = Inventory.objects.get_or_create(
                    variant=var,
                    defaults={"available_quantity": 100, "reserved_quantity": 0, "safety_stock": 5, "status": "in_stock"}
                )

    print(f"Products seeded: {len(sample_products)}")
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed()
