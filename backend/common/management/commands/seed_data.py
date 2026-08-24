from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from categories.models import Category
from store_collections.models import Collection, CollectionProduct
from products.models import Product
from product_options.models import ProductOption, OptionValue
from variants.models import Variant, VariantOption
from inventory.models import Inventory


class Command(BaseCommand):
    help = "Seed mock categories, collections, products, options, variants, and inventories for testing."

    def handle(self, *args, **options):
        self.stdout.write("Starting database seeding...")

        with transaction.atomic():
            # 1. Clear existing shop data to avoid duplicate slugs
            CollectionProduct.objects.all().delete()
            Collection.objects.all().delete()
            VariantOption.objects.all().delete()
            Inventory.objects.all().delete()
            Variant.objects.all().delete()
            OptionValue.objects.all().delete()
            ProductOption.objects.all().delete()
            Product.objects.all().delete()
            Category.objects.all().delete()

            self.stdout.write("Old catalog data cleaned.")

            # 2. Create Categories (Hierarchical tree)
            cat_women = Category.objects.create(
                name="لباس زنانه",
                slug="women",
                description="مجموعه کامل لباس و پوشاک زنانه مدرن و مینیمال",
                is_active=True,
            )
            cat_women_manto = Category.objects.create(
                name="مانتو و پالتو",
                slug="women-coats",
                description="انواع مانتوهای کتی، پالتوهای فوتر و بارانی",
                parent=cat_women,
                is_active=True,
            )
            cat_women_shirts = Category.objects.create(
                name="شومیز و بلوز",
                slug="women-shirts",
                description="شومیزهای ابریشمی و نخی کژوال و مجلسی",
                parent=cat_women,
                is_active=True,
            )
            cat_women_pants = Category.objects.create(
                name="شلوار زنانه",
                slug="women-pants",
                description="شلوارهای واید، مام‌استایل و پارچه‌ای",
                parent=cat_women,
                is_active=True,
            )
            cat_women_dresses = Category.objects.create(
                name="دامن و پیراهن",
                slug="women-dresses",
                description="پیراهن‌های ماکسی و دامن‌های کژوال",
                parent=cat_women,
                is_active=True,
            )

            cat_men = Category.objects.create(
                name="لباس مردانه",
                slug="men",
                description="طراحی‌های مینیمال، استایل خیابانی و کژوال مردانه",
                is_active=True,
            )
            cat_men_tshirts = Category.objects.create(
                name="تی‌شرت و پولوشرت",
                slug="men-tshirts",
                description="تی‌شرت‌های اورسایز و بیسیک پنبه‌ای",
                parent=cat_men,
                is_active=True,
            )
            cat_men_shirts = Category.objects.create(
                name="پیراهن مردانه",
                slug="men-shirts",
                description="پیراهن‌های لینن و آکسفورد مردانه",
                parent=cat_men,
                is_active=True,
            )
            cat_men_hoodies = Category.objects.create(
                name="هودی و دورس",
                slug="men-hoodies",
                description="هودی‌های کلاه‌دار اورسایز و دورس‌های زمستانه",
                parent=cat_men,
                is_active=True,
            )
            cat_men_pants = Category.objects.create(
                name="شلوار و جین",
                slug="men-pants",
                description="جین‌های بگ و اسلیم، شلوارهای کتان و کارگو",
                parent=cat_men,
                is_active=True,
            )

            cat_acc = Category.objects.create(
                name="اکسسوری",
                slug="accessories",
                description="کیف، کفش و اکسسوری‌های خاص استایل مینیمال",
                is_active=True,
            )
            cat_shoes = Category.objects.create(
                name="کفش و کتانی",
                slug="shoes",
                description="کفش‌های چرم مینیمال و اسنیکرزهای روزمره",
                parent=cat_acc,
                is_active=True,
            )
            cat_bags = Category.objects.create(
                name="کیف و کوله",
                slug="bags",
                description="کیف‌های چرم طبیعی و کراس‌بادی",
                parent=cat_acc,
                is_active=True,
            )

            self.stdout.write(f"Created {Category.objects.count()} categories.")

            # 3. Create Collections
            col_special_sale = Collection.objects.create(
                name="فروش ویژه",
                slug="special-sale",
                description="تخفیف‌های استثنایی بر روی منتخب کالکشن‌های فصلی",
                priority=100,
                is_active=True,
            )
            col_new_arrivals = Collection.objects.create(
                name="جدیدترین محصولات",
                slug="new-arrivals",
                description="تازه‌ترین طراحی‌های اضافه شده به فروشگاه",
                priority=90,
                is_active=True,
            )
            col_best_sellers = Collection.objects.create(
                name="پرفروش‌ترین‌ها",
                slug="best-sellers",
                description="محبوب‌ترین و پرطرفدارترین آیتم‌های انتخاب شده توسط کاربران",
                priority=80,
                is_active=True,
            )
            col_summer = Collection.objects.create(
                name="کالکشن مینیمال تابستانه",
                slug="minimal-summer",
                description="پارچه‌های خنک لینن با رنگ‌های نود و خنثی برای روزهای گرم",
                priority=70,
                is_active=True,
            )
            col_streetwear = Collection.objects.create(
                name="استایل خیابانی (Streetwear)",
                slug="streetwear",
                description="طراحی‌های جسورانه، اورسایز و راحت مناسب استفاده روزمره",
                priority=60,
                is_active=True,
            )
            col_capsule = Collection.objects.create(
                name="کالکشن کپسولی",
                slug="capsule-wardrobe",
                description="آیتم‌های اساسی که به راحتی با هر استایلی ست می‌شوند",
                priority=50,
                is_active=True,
            )

            self.stdout.write(f"Created {Collection.objects.count()} collections.")

            # 4. Products Data Definitions
            products_data = [
                {
                    "title": "مانتو کتی فوتر یقه بلیزر",
                    "slug": "oversized-blazer-coat",
                    "category": cat_women_manto,
                    "description": "مانتو کتی دوخته شده با پارچه فوتر ترک درجه یک، آسترکشی کامل با ایستایی فوق‌العاده شیک مناسب استایل‌های رسمی و کژوال مدرن.",
                    "price": Decimal("1850000"),
                    "image": "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80",
                    "collections": [col_new_arrivals, col_best_sellers, col_capsule],
                    "sizes": ["S", "M", "L"],
                    "colors": ["مشکی", "کرم", "طوسی"],
                },
                {
                    "title": "پیراهن ماکسی مینیمال لینن",
                    "slug": "minimal-linen-maxi-dress",
                    "category": cat_women_dresses,
                    "description": "پیراهن ماکسی با برش آزاد و پارچه ۱۰۰٪ لینن طبیعی، تن‌خور بسیار راحت و سبک با رنگ‌بندی مینیمال.",
                    "price": Decimal("1450000"),
                    "image": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
                    "collections": [col_summer, col_new_arrivals, col_special_sale],
                    "sizes": ["S", "M", "L"],
                    "colors": ["سفید", "شنی", "زیتونی"],
                },
                {
                    "title": "شومیز ابریشمی کلاسیک",
                    "slug": "silk-classic-shirt",
                    "category": cat_women_shirts,
                    "description": "شومیز ساتن ابریشم با درخشش ملایم، دکمه‌های مخفی و سرآستین بلند، مناسب مهمانی و استفاده رسمی.",
                    "price": Decimal("980000"),
                    "image": "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80",
                    "collections": [col_capsule, col_special_sale],
                    "sizes": ["M", "L"],
                    "colors": ["سفید", "مشکی", "شامپاینی"],
                },
                {
                    "title": "شلوار واید لینن بندی",
                    "slug": "wide-leg-linen-trousers",
                    "category": cat_women_pants,
                    "description": "شلوار گشاد با کمر کشی و بند تنظیم، پارچه سبک و تنفس‌پذیر برای استفاده روزمره در تابستان.",
                    "price": Decimal("890000"),
                    "image": "https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=800&q=80",
                    "collections": [col_summer, col_capsule],
                    "sizes": ["S", "M", "L", "XL"],
                    "colors": ["کرم", "طوسی", "سرمه‌ای"],
                },
                {
                    "title": "هودی اورسایز سنگ‌شور Streetwear",
                    "slug": "washed-oversized-hoodie",
                    "category": cat_men_hoodies,
                    "description": "هودی دورس سه‌نخ خارخورده با افکت اسیدشور خاص و کلاه دوجداره، قواره بسیار آزاد و شیک.",
                    "price": Decimal("1280000"),
                    "image": "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
                    "collections": [col_streetwear, col_best_sellers, col_new_arrivals],
                    "sizes": ["M", "L", "XL"],
                    "colors": ["دودی", "مشکی", "خاکی"],
                },
                {
                    "title": "تی‌شرت بیسیک پنبه‌ای Heavyweight",
                    "slug": "heavyweight-cotton-tee",
                    "category": cat_men_tshirts,
                    "description": "تی‌شرت گرم‌بالا ۲۸۰ گرم ۱۰۰٪ کتان سوپرپنبه، یقه کشبافت محکم و بدون تغییر فرم پس از شستشو.",
                    "price": Decimal("520000"),
                    "image": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
                    "collections": [col_capsule, col_streetwear, col_summer],
                    "sizes": ["S", "M", "L", "XL"],
                    "colors": ["سفید", "مشکی", "سرمه‌ای"],
                },
                {
                    "title": "پیراهن آستین کوتاه کوبایی لینن",
                    "slug": "cuban-collar-linen-shirt",
                    "category": cat_men_shirts,
                    "description": "پیراهن یقه کوبایی با پارچه لینن خالص، بسیار سبک و خنک مناسب استایل‌های تابستانه.",
                    "price": Decimal("850000"),
                    "image": "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80",
                    "collections": [col_summer, col_new_arrivals],
                    "sizes": ["M", "L", "XL"],
                    "colors": ["سبز زیتونی", "آبی آسمانی", "سفید"],
                },
                {
                    "title": "شلوار کارگو بگ با جیب‌های متعدد",
                    "slug": "baggy-cargo-pants",
                    "category": cat_men_pants,
                    "description": "شلوار کارگو کتان ضخیم، دارای ۶ جیب کاربردی و گتر تنظیم دمپا، مناسب استایل‌های استریت‌ویر مدرن.",
                    "price": Decimal("1150000"),
                    "image": "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80",
                    "collections": [col_streetwear, col_best_sellers],
                    "sizes": ["M", "L", "XL"],
                    "colors": ["مشکی", "خاکی", "طوسی تیره"],
                },
                {
                    "title": "کت چرم طبیعی موتورسواری",
                    "slug": "biker-leather-jacket",
                    "category": cat_men_hoodies,
                    "description": "کت چرم طبیعی بره، زیپ‌های متالیک بادوام و آستر نرم، استایل کلاسیک با برش اسلیم‌فیت ماندگار.",
                    "price": Decimal("3800000"),
                    "image": "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80",
                    "collections": [col_special_sale, col_best_sellers],
                    "sizes": ["M", "L", "XL"],
                    "colors": ["مشکی"],
                },
                {
                    "title": "کیف دوشی مینیمال چرم",
                    "slug": "minimal-leather-crossbody-bag",
                    "category": cat_bags,
                    "description": "کیف دوشی کراس‌بادی ساخته شده از چرم گاوی فرآوری شده با دوخت دست‌دوز، یراق‌آلات طلایی مات.",
                    "price": Decimal("1650000"),
                    "image": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80",
                    "collections": [col_capsule, col_best_sellers, col_new_arrivals],
                    "sizes": ["Free Size"],
                    "colors": ["عسلی", "مشکی", "سبز سدری"],
                },
                {
                    "title": "کتانی چرم مینیمال سفید",
                    "slug": "minimal-white-leather-sneakers",
                    "category": cat_shoes,
                    "description": "کفش کتانی تخت با رویه چرم طبیعی و زیره ضدسایش سبک، طراحی کلاسیک و سازگار با انواع استایل‌ها.",
                    "price": Decimal("1950000"),
                    "image": "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80",
                    "collections": [col_capsule, col_summer, col_best_sellers],
                    "sizes": ["39", "40", "41", "42", "43", "44"],
                    "colors": ["سفید", "مشکی-سفید"],
                },
                {
                    "title": "پالتو فوتر بلند دوچاک زنانه",
                    "slug": "long-double-slit-wool-coat",
                    "category": cat_women_manto,
                    "description": "پالتو بلند زمستانه با چاک‌های بغل، جیب‌های فیلتابی و کمربند پهن همرنگ پارچه.",
                    "price": Decimal("2400000"),
                    "image": "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80",
                    "collections": [col_new_arrivals, col_special_sale],
                    "sizes": ["S", "M", "L"],
                    "colors": ["شتری", "دودی", "مشکی"],
                },
                {
                    "title": "تی‌شرت گرافیکی چاپ سنگی Streetwear",
                    "slug": "graphic-stone-wash-tee",
                    "category": cat_men_tshirts,
                    "description": "تی‌شرت آستین افتاده با چاپ گرافیکی باکیفیت مقاوم در برابر شستشو، استایل خیابانی جذاب.",
                    "price": Decimal("620000"),
                    "image": "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80",
                    "collections": [col_streetwear, col_new_arrivals],
                    "sizes": ["M", "L", "XL"],
                    "colors": ["مشکی", "خاکستری"],
                },
                {
                    "title": "شلوار جین بگ ذغالی",
                    "slug": "baggy-charcoal-denim-jeans",
                    "category": cat_men_pants,
                    "description": "جین بگ با فاق بلند و رنگ ذغالی خاص، پارچه ۱۰۰٪ دنیم سنگین بدون آبرفت.",
                    "price": Decimal("1100000"),
                    "image": "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80",
                    "collections": [col_streetwear, col_best_sellers, col_capsule],
                    "sizes": ["30", "32", "34", "36"],
                    "colors": ["ذغالی", "آبی یخی"],
                },
                {
                    "title": "پیراهن نخی آکسفورد سفید",
                    "slug": "oxford-cotton-white-shirt",
                    "category": cat_men_shirts,
                    "description": "پیراهن بافت آکسفورد کلاسیک با دکمه‌های سرامیکی، خوش‌دوخت و مناسب هر محیط رسمی و روزمره.",
                    "price": Decimal("920000"),
                    "image": "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80",
                    "collections": [col_capsule, col_new_arrivals],
                    "sizes": ["S", "M", "L", "XL"],
                    "colors": ["سفید", "آبی روشن"],
                }
            ]

            # 5. Populate Products, Options, Variants, and Inventories
            created_count = 0
            for item in products_data:
                prod = Product.objects.create(
                    title=item["title"],
                    slug=item["slug"],
                    description=item["description"],
                    category=item["category"],
                    status=Product.Status.PUBLISHED,
                    metadata={
                        "image_url": item["image"],
                        "imageUrl": item["image"],
                        "price": str(item["price"]),
                        "sizes": item["sizes"],
                        "colors": item["colors"],
                    },
                    seo_metadata={
                        "title": item["title"],
                        "description": item["description"][:150],
                    },
                )

                # Link Collections
                for col in item["collections"]:
                    CollectionProduct.objects.create(
                        collection=col,
                        product=prod,
                        position=created_count,
                    )

                # Create Options: Size and Color
                opt_size = ProductOption.objects.create(
                    product=prod, name="سایز", display_order=1
                )
                opt_color = ProductOption.objects.create(
                    product=prod, name="رنگ", display_order=2
                )

                size_objs = []
                for s_val in item["sizes"]:
                    val_obj = OptionValue.objects.create(
                        option=opt_size, value=s_val, display_order=len(size_objs)
                    )
                    size_objs.append(val_obj)

                color_objs = []
                for c_val in item["colors"]:
                    val_obj = OptionValue.objects.create(
                        option=opt_color, value=c_val, display_order=len(color_objs)
                    )
                    color_objs.append(val_obj)

                # Create Variants for each size/color combo
                var_index = 1
                for s_obj in size_objs:
                    for c_obj in color_objs:
                        sku = f"{item['slug']}-{s_obj.value}-{c_obj.value}"
                        sku = sku.replace(" ", "-").replace("/", "-")[:50]
                        variant = Variant.objects.create(
                            product=prod,
                            sku=sku,
                            price=item["price"],
                            weight=400,
                            dimensions={"length": 30, "width": 25, "height": 3, "unit": "cm"},
                            availability=Variant.Availability.IN_STOCK,
                            status=Variant.Status.PUBLISHED,
                            metadata={"size": s_obj.value, "color": c_obj.value},
                        )

                        VariantOption.objects.create(
                            variant=variant,
                            option=opt_size,
                            option_value=s_obj,
                        )
                        VariantOption.objects.create(
                            variant=variant,
                            option=opt_color,
                            option_value=c_obj,
                        )

                        # Create Inventory
                        Inventory.objects.create(
                            variant=variant,
                            available_quantity=50,
                            reserved_quantity=0,
                            safety_stock=5,
                            status=Inventory.Status.IN_STOCK,
                        )
                        var_index += 1

                created_count += 1

            self.stdout.write(self.style.SUCCESS(
                f"Successfully seeded {Category.objects.count()} categories, {Collection.objects.count()} collections, and {Product.objects.count()} products with variants & inventory!"
            ))
