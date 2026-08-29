import os
import sys

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Setup django environment

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
import django
django.setup()

from decimal import Decimal
from django.utils.text import slugify
from categories.models import Category
from store_collections.models import Collection, CollectionProduct
from products.models import Product, Review
from product_options.models import ProductOption, OptionValue
from variants.models import Variant, VariantOption
from inventory.models import Inventory
from coupons.models import Coupon
from cms.models import SiteContent, Page
from common.models import User

def seed():
    print("[*] Starting database seeding...")

    # 1. Categories
    categories_data = [
        {"name": "لباس زنانه", "slug": "women", "description": "انواع پوشاک زنانه، مانتو، پالتو، شومیز و شلوار"},
        {"name": "لباس مردانه", "slug": "men", "description": "کالکشن لباس مردانه، کت، هودی، تیشرت و پیراهن"},
        {"name": "اکسسوری و کیف", "slug": "accessories", "description": "کیف‌های چرمی مینیمال، شال و کمربند"},
        {"name": "کفش و کتانی", "slug": "shoes", "description": "کفش‌های راحتی، کتانی‌های چرم و صندل"},
    ]

    cat_map = {}
    for c in categories_data:
        cat, _ = Category.objects.get_or_create(
            slug=c["slug"],
            defaults={"name": c["name"], "description": c["description"], "is_active": True}
        )
        cat_map[c["slug"]] = cat
        print(f"  [+] Category: {cat.name}")

    # 2. Collections
    collections_data = [
        {"name": "کالکشن بهاره ۲۰۲۶", "slug": "spring-2026", "description": "رنگ‌های نود و الیاف طبیعی برای فصل بهار"},
        {"name": "استایل مینیمال", "slug": "minimal-style", "description": "طراحی‌های ساده، بادوام و شیک روزمره"},
        {"name": "پرفروش‌ترین‌های فصل", "slug": "best-sellers", "description": "محبوب‌ترین انتخاب‌های خریداران"},
    ]

    col_map = {}
    for col in collections_data:
        coll, _ = Collection.objects.get_or_create(
            slug=col["slug"],
            defaults={"name": col["name"], "description": col["description"], "is_active": True}
        )
        col_map[col["slug"]] = coll
        print(f"  [+] Collection: {coll.name}")

    # 3. Products
    products_data = [
        {
            "title": "پالتو فوتر مینیمال زنانه",
            "slug": "minimal-wool-coat",
            "category": "women",
            "collections": ["spring-2026", "minimal-style"],
            "description": "پالتو فوتر کوبیده با آستر ساتن درجه یک، برش آزاد (Oversized) و دوخت تمیز. مناسب برای استایل‌های پاییزه و زمستانه شیک.",
            "price": Decimal("3850000"),
            "image_url": "https://images.unsplash.com/photo-1539533018447-63fcce667883?auto=format&fit=crop&w=1000&q=80",
            "colors": [("مشکی", "#111111"), ("کرم", "#e8dec8"), ("شکلاتی", "#5d4037")],
            "sizes": ["S", "M", "L"],
        },
        {
            "title": "هودی اورسایز نخی بیسیک",
            "slug": "oversized-cotton-hoodie",
            "category": "men",
            "collections": ["minimal-style", "best-sellers"],
            "description": "هودی دورس سه نخ تو کرکی با پارچه پنبه‌ای صد در صد طبیعی. مقاوم در برابر شستشو با تن‌خور بسیار راحت.",
            "price": Decimal("1450000"),
            "image_url": "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80",
            "colors": [("مشکی", "#000000"), ("طوسی ملانژ", "#808080"), ("سفید", "#ffffff")],
            "sizes": ["M", "L", "XL"],
        },
        {
            "title": "کت ترنچ کلاسیک دو ردیف دکمه",
            "slug": "classic-trench-coat",
            "category": "women",
            "collections": ["spring-2026", "best-sellers"],
            "description": "بارانی ترنچ ضدآب با طراحی کلاسیک انگلیسی، دارای کمربند سگک‌دار و جیب‌های عمیق. استایل شیک برای تمام موقعیت‌ها.",
            "price": Decimal("4200000"),
            "image_url": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1000&q=80",
            "colors": [("کرم شتری", "#c19a6b"), ("مشکی", "#0a0a0a"), ("سبز زیتونی", "#556b2f")],
            "sizes": ["S", "M", "L"],
        },
        {
            "title": "شلوار واید کرپ مشکی",
            "slug": "wide-crepe-pants",
            "category": "women",
            "collections": ["minimal-style"],
            "description": "شلوار واید فاق‌بلند با پارچه کرپ باربی وارداتی. بدون چروک و خوش‌فرم با ایستایی عالی روی کفش و کتانی.",
            "price": Decimal("1950000"),
            "image_url": "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=80",
            "colors": [("مشکی", "#000000"), ("ذغالی", "#2f4f4f")],
            "sizes": ["36", "38", "40", "42"],
        },
        {
            "title": "پیراهن لینن اورسایز یقه کوبایی",
            "slug": "oversized-linen-shirt",
            "category": "men",
            "collections": ["spring-2026"],
            "description": "پیراهن الیاف طبیعی لینن فوق‌العاده خنک و تنفس‌پذیر با دکمه‌های چوبی طبیعی و یقه باز تابستانی.",
            "price": Decimal("1250000"),
            "image_url": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&q=80",
            "colors": [("سفید استخوانی", "#f5f5f0"), ("سبز پاستلی", "#8fbc8f"), ("کرم", "#eee8aa")],
            "sizes": ["M", "L", "XL"],
        },
        {
            "title": "کیف دوشی چرم طبیعی مینیمال",
            "slug": "minimal-leather-bag",
            "category": "accessories",
            "collections": ["minimal-style", "best-sellers"],
            "description": "کیف دستی و دوشی چرم گاوی درجه یک با یراق‌آلات دودی مات ضد زنگ و بند قابل تنظیم.",
            "price": Decimal("2100000"),
            "image_url": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1000&q=80",
            "colors": [("مشکی مات", "#1c1c1c"), ("عسلی", "#b87333"), ("قهوه‌ای تیره", "#4a2c11")],
            "sizes": ["تک سایز"],
        },
        {
            "title": "کتانی راحتی چرمی سفید",
            "slug": "white-leather-sneakers",
            "category": "shoes",
            "collections": ["best-sellers"],
            "description": "کتانی چرم اشبالت و چرم طبیعی دست‌دوز با کفی طبی مموری فوم برای استفاده طولانی مدت در طول روز.",
            "price": Decimal("2750000"),
            "image_url": "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=1000&q=80",
            "colors": [("سفید / طوسی", "#f8f9fa"), ("سفید / مشکی", "#e9ecef")],
            "sizes": ["38", "39", "40", "41", "42", "43"],
        },
        {
            "title": "تی‌شرت کراپ تابستانی کتان",
            "slug": "summer-crop-tshirt",
            "category": "women",
            "collections": ["spring-2026"],
            "description": "کراپ تاپ نخ پنبه سوپر با کشسانی بالا و لطافت فوق‌العاده، یقه گرد دوبل و رنگ ثابت.",
            "price": Decimal("680000"),
            "image_url": "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80",
            "colors": [("سفید", "#ffffff"), ("مشکی", "#000000"), ("صورتی ملایم", "#ffb6c1")],
            "sizes": ["S", "M", "L"],
        },
    ]

    for pdata in products_data:
        cat = cat_map[pdata["category"]]
        prod, created = Product.objects.get_or_create(
            slug=pdata["slug"],
            defaults={
                "title": pdata["title"],
                "description": pdata["description"],
                "category": cat,
                "status": Product.Status.PUBLISHED,
                "metadata": {
                    "price": str(pdata["price"]),
                    "image_url": pdata["image_url"],
                    "imageUrl": pdata["image_url"],
                },
                "seo_metadata": {
                    "title": pdata["title"],
                    "description": pdata["description"][:120],
                },
            },
        )
        print(f"  [+] Product: {prod.title}")

        # Link collections
        for col_slug in pdata.get("collections", []):
            if col_slug in col_map:
                CollectionProduct.objects.get_or_create(collection=col_map[col_slug], product=prod)

        # Options: Color & Size
        opt_color, _ = ProductOption.objects.get_or_create(product=prod, name="رنگ", defaults={"display_order": 0})
        opt_size, _ = ProductOption.objects.get_or_create(product=prod, name="سایز", defaults={"display_order": 1})

        color_objs = []
        for idx, (cname, hex_val) in enumerate(pdata["colors"]):
            val_obj, _ = OptionValue.objects.get_or_create(
                option=opt_color, value=cname, defaults={"display_order": idx}
            )
            color_objs.append(val_obj)

        size_objs = []
        for idx, sname in enumerate(pdata["sizes"]):
            val_obj, _ = OptionValue.objects.get_or_create(
                option=opt_size, value=sname, defaults={"display_order": idx}
            )
            size_objs.append(val_obj)

        # Create Variants (Color x Size matrix)
        for c_idx, c_val in enumerate(color_objs):
            for s_idx, s_val in enumerate(size_objs):
                base_slug = pdata['slug'].replace('-', '').upper()[:6]
                sku = f"{base_slug}-C{c_idx+1}-S{s_idx+1}"
                
                variant, _ = Variant.objects.get_or_create(
                    sku=sku,
                    defaults={
                        "product": prod,
                        "price": pdata["price"],
                        "availability": Variant.Availability.IN_STOCK,
                        "status": Variant.Status.PUBLISHED,
                        "weight": 500,
                    }
                )

                
                # Associate option values
                VariantOption.objects.get_or_create(variant=variant, option=opt_color, defaults={"option_value": c_val})
                VariantOption.objects.get_or_create(variant=variant, option=opt_size, defaults={"option_value": s_val})

                # Inventory
                Inventory.objects.get_or_create(
                    variant=variant,
                    defaults={
                        "available_quantity": 25,
                        "safety_stock": 5,
                        "status": Inventory.Status.IN_STOCK,
                    }
                )

        # Sample Reviews
        Review.objects.get_or_create(
            product=prod,
            text="کیفیت دوخت و متریال واقعاً عالیه، دقیقاً شبیه عکس‌ها بود و سریع به دستم رسید.",
            defaults={
                "user_name": "سارا محمدی",
                "rating": 5,
                "status": Review.Status.APPROVED,
            }
        )
        Review.objects.get_or_create(
            product=prod,
            text="سایزبندیش کاملاً دقیقه و تن‌خور خیلی شیکی داره. پیشنهاد می‌کنم حتماً بخرید.",
            defaults={
                "user_name": "امیرحسین رضایی",
                "rating": 5,
                "status": Review.Status.APPROVED,
            }
        )

    # 4. Coupons
    coupons_data = [
        {"code": "WELCOME20", "discount_type": "percentage", "discount_value": Decimal("20"), "max_uses": 100, "is_active": True},
        {"code": "NOROOZ500", "discount_type": "fixed", "discount_value": Decimal("500000"), "min_purchase": Decimal("2000000"), "max_uses": 50, "is_active": True},
        {"code": "LUXE10", "discount_type": "percentage", "discount_value": Decimal("10"), "max_uses": 500, "is_active": True},
    ]


    for coup in coupons_data:
        Coupon.objects.get_or_create(code=coup["code"], defaults=coup)
        print(f"  [+] Coupon: {coup['code']}")

    # 5. CMS Content
    SiteContent.objects.get_or_create(
        key="hero",
        defaults={
            "content": {
                "title": "ظرافت در سادگی",
                "subtitle": "کالکشن جدید پوشاک مینیمال و ترند ۲۰۲۶ با الیاف طبیعی و طراحی بی‌نقص",
                "cta_text": "مشاهده محصولات",
                "cta_link": "/products",
            },
        }
    )
    SiteContent.objects.get_or_create(
        key="announcement",
        defaults={
            "content": {
                "text": "ارسال رایگان برای تمام خریدهای بالای ۲ میلیون تومان به سراسر کشور",
            },
        }
    )
    print("  [+] CMS Site Content: hero & announcement")

    # 6. Static Pages
    Page.objects.get_or_create(
        slug="about",
        defaults={
            "title": "درباره فشن استور",
            "content": [{"type": "text", "text": "فشن استور برندی پیشرو در زمینه طراحی و تولید پوشاک مینیمال و مدرن است..."}],
            "status": Page.Status.PUBLISHED,
        }
    )
    Page.objects.get_or_create(
        slug="contact",
        defaults={
            "title": "تماس با ما",
            "content": [{"type": "text", "text": "شما می‌توانید از طریق فرم تماس یا راه‌های ارتباطی با پشتیبانی در تماس باشید."}],
            "status": Page.Status.PUBLISHED,
        }
    )
    print("  [+] CMS Pages: about & contact")

    print("[*] Database successfully seeded with 8 products, variants, inventory, coupons & CMS content!")


if __name__ == "__main__":
    seed()
