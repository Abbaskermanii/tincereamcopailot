"""Persian seed dataset: 4 categories x 6 products with gallery images."""

from datetime import datetime, timedelta
from app.compat import UTC

# (category_key, category_name_fa, slug, shape)
CATEGORIES = [
    ("mugs", "ماگ‌های دست‌ساز", "handmade-mugs", "mug"),
    ("ashtrays", "زیرسیگاری سرامیکی", "ceramic-ashtrays", "ashtray"),
    ("spice", "ادویه‌دان و نمک‌دان", "spice-jars", "spice_jar"),
    ("canisters", "شیرینی‌دان و کوزه", "canisters", "canister"),
]

# Per-category product templates; {i} is 1..6
PRODUCTS = {
    "mugs": [
        (
            "maag-lajevardi-solomoni",
            "ماگ لاجوردی سلیمانی",
            385000,
            460000,
            "ماگ دست‌ساز با لعاب لاجوردی عمیق و دستهٔ حلزونی؛ هر عدد در قالب چرخ‌کاری شکل گرفته است.",
            "ماگ لاجوردی با دستهٔ حلزونی، ظرفیت ۳۵۰ میلی‌لیتر",
        ),
        (
            "maag-sefidi-toroq",
            "ماگ سفید مات طرح ترقه",
            342000,
            None,
            "لعاب ترقه‌ای سفید مات که در پخت دوم کوره نقش‌های یخ‌زده می‌گیرد.",
            "ماگ سفید مات با نقش ترقه، ۳۰۰ میلی‌لیتر",
        ),
        (
            "maag-felezi-abi",
            "ماگ فیروزه‌ای براق",
            398000,
            450000,
            "لعاب فیروزه‌ای براق با سایه‌های اقیانوسی در لبه؛ مناسب نوشیدنی گرم و سرد.",
            "ماگ فیروزه‌ای براق، ۳۵۰ میلی‌لیتر",
        ),
        (
            "maag-kaki-mat",
            "ماگ خاکی مینیمال",
            310000,
            None,
            "بدنهٔ چرخ‌کاری با رنگ خاک رس طبیعی و نوار لعابی دستی در لبه.",
            "ماگ خاکی مینیمال با نوار لعابی، ۳۲۰ میلی‌لیتر",
        ),
        (
            "maag-dosheh-zarrin",
            "ماگ دوغ‌خوری زرین",
            520000,
            None,
            "ماگ بزرگ دوغ‌خوری با دستهٔ پهن و لعاب زرین‌فام؛ انتخاب میز صبحانه.",
            "ماگ دوغ‌خوری بزرگ زرین‌فام، ۵۰۰ میلی‌لیتر",
        ),
        (
            "maag-sorkh-atashin",
            "ماگ سرخ آتشفشان",
            365000,
            420000,
            "لعاب واکنشی سرخ با موج‌های مسی؛ هر ماگ نقش یکتای خود را از کوره می‌گیرد.",
            "ماگ سرخ لعاب واکنشی با رگه‌های مسی، ۳۴۰ میلی‌لیتر",
        ),
    ],
    "ashtrays": [
        (
            "zirsegari-lajevardi",
            "زیرسیگاری لاجوردی گرد",
            195000,
            None,
            "زیرسیگاری گرد با سه‌شیار جای سیگار و لعاب لاجوردی براق.",
            "زیرسیگاری گرد لاجوردی، قطر ۱۱ سانتی‌متر",
        ),
        (
            "zirsegari-kaki-hendesi",
            "زیرسیگاری خاکی نقش هندسی",
            220000,
            260000,
            "نقش هندسی کنده‌کاری‌شده روی بدنهٔ خاکی؛ الهام‌گرفته از کاشی‌کاری اصفهان.",
            "زیرسیگاری خاکی با نقش هندسی کنده‌کاری‌شده",
        ),
        (
            "zirsegari-sefid-trqi",
            "زیرسیگاری ترقه‌ای مستطیل",
            245000,
            None,
            "فرم مستطیل با محفظهٔ داخلی عمیق برای تمیز نگه‌داشتن میز.",
            "زیرسیگاری مستطیل لعاب ترقه‌ای، ۱۴×۹ سانتی‌متر",
        ),
        (
            "zirsegari-fiouze-borag",
            "زیرسیگاری فیروزه‌ای پایه‌دار",
            265000,
            None,
            "پایهٔ باریک و کاسهٔ فیروزه‌ای؛ تلفیقی از ظرافت قدیمی و کاربرد امروزی.",
            "زیرسیگاری پایه‌دار فیروزه‌ای، ارتفاع ۷ سانتی‌متر",
        ),
        (
            "zirsegari-do-nafare",
            "زیرسیگاری دونهزار دوتایی",
            320000,
            380000,
            "دو کاسهٔ مجزا روی صفحهٔ مشترک؛ مناسب میز پذیرایی و تراس.",
            "زیرسیگاری دوتایی روی صفحهٔ مشترک، ۲۲×۱۱ سانتی‌متر",
        ),
        (
            "zirsegari-siah-sabegh",
            "زیرسیگاری مشکی سبه‌ریز",
            185000,
            None,
            "لعاب مشکی مات با لبهٔ صیقلی؛ سبک و مقاوم برای استفادهٔ روزمره.",
            "زیرسیگاری مشکی مات، قطر ۱۰ سانتی‌متر",
        ),
    ],
    "spice": [
        (
            "adviyedan-set3-lajevardi",
            "ست ادویه‌دان ۳ عددی لاجوردی",
            480000,
            560000,
            "سه ادویه‌دان هم‌اندازه با دربِ چوبی بلوط و سوراخ ریزی قابل تنظیم.",
            "ست ۳ عددی ادویه‌دان با درب چوب بلوط",
        ),
        (
            "nemkdan-sefid-toroq",
            "نمک‌دان سفید ترقه‌ای تک‌دانه",
            165000,
            None,
            "نمک‌دان تک‌دانه با قاشق کوچک چوبی و لعاب سفید ترقه‌ای.",
            "نمک‌دان سفید ترقه‌ای همراه قاشق چوبی",
        ),
        (
            "adviyedan-fiouze-bozorg",
            "ادویه‌دان فیروزه‌ای درشت",
            235000,
            None,
            "حجم بالا برای زردچوبه و دارچین؛ دربِ لاستیکی واترتایت.",
            "ادویه‌دان درشت فیروزه‌ای، ۴۵۰ میلی‌لیتر",
        ),
        (
            "adviyedan-kaki-jft",
            "جفت ادویه‌دان خاکی نقش‌دار",
            340000,
            395000,
            "دو دانِ هم‌خانواده با نقش دست‌نگار گل و مرغ روی بدنهٔ خاکی.",
            "جفت ادویه‌دان خاکی با نقش گل و مرغ",
        ),
        (
            "soorkhdan-lajevardi",
            "سورخ‌دار لاجوردی دیواری",
            275000,
            None,
            "سورخ‌دار قابل نصب روی دیوار یا یخچال با لعاب لاجوردی.",
            "سورخ‌دار لاجوردی قابل نصب، ارتفاع ۱۶ سانتی‌متر",
        ),
        (
            "adviyedan-chobi-srf",
            "ست ادویه‌دان سرامیکی چوب‌روبان",
            520000,
            610000,
            "چهار ادویه‌دان با روبان چوبی حکاکی‌شده نام ادویه به فارسی.",
            "ست ۴ عددی ادویه‌دان با برچسب چوبی حکاکی‌شده",
        ),
    ],
    "canisters": [
        (
            "shirinidan-lajevardi-bozorg",
            "شیرینی‌دان لاجوردی بزرگ",
            590000,
            690000,
            "شیرینی‌دان دربدار با درپوش نعلبکی و حجم ۱٫۸ لیتری برای مهمانی.",
            "شیرینی‌دان بزرگ لاجوردی، ۱٫۸ لیتر",
        ),
        (
            "kouze-shiri-sfid",
            "کوزهٔ عسل سفید مات",
            260000,
            None,
            "کوزهٔ عسل با دربِ بسته و لبهٔ چکه‌گیر؛ لعاب مات غذاساز.",
            "کوزهٔ عسل سفید مات با لبهٔ چکه‌گیر، ۴۵۰ میلی‌لیتر",
        ),
        (
            "shirinidan-kaki-motvaset",
            "شیرینی‌دان خاکی متوسط",
            430000,
            495000,
            "اندازهٔ میانه با درپوش چوبی و بدنهٔ خاکی نسوز.",
            "شیرینی‌دان متوسط خاکی با درپوش چوبی، ۱٫۲ لیتر",
        ),
        (
            "kouze-torshi-fiouze",
            "کوزهٔ ترشی فیروزه‌ای دو لیتری",
            640000,
            None,
            "کوزهٔ دهان‌گشاد برای ترشی و خیارشور؛ مقاوم در برابر اسید.",
            "کوزهٔ ترشی فیروزه‌ای، ۲ لیتر",
        ),
        (
            "shirinidan-set3-zarrin",
            "ست کوزه و شیرینی‌دان زرین ۳ تکه",
            880000,
            990000,
            "یک شیرینی‌دان و دو کوزهٔ هم‌خانواده با خط زرین دور لبه؛ هدیهٔ مجلسی.",
            "ست ۳ تکه کوزه و شیرینی‌دان با خط زرین",
        ),
        (
            "kouze-gousht-siah",
            "کوزهٔ گوشت مشکی نسوز",
            470000,
            None,
            "کوزهٔ نسوز پخت گوشت با جدارهٔ ضخیم؛ همان کوزهٔ سنتی با لعاب مدرن.",
            "کوزهٔ پخت مشکی نسوز، ۱٫۵ لیتر",
        ),
    ],
}

MATERIALS = ["لعاب و خاک رس سفید", "خاک رس قرمز", "سرامیک سنگی (Stoneware)", "خاک رس نسوز"]
DIMENSIONS = {
    "mug": ["۸×۹×۱۱ cm", "۷٫۵×۸٫۵×۱۰ cm", "۸٫۵×۹×۱۲ cm"],
    "ashtray": ["قطر ۱۱ cm", "۱۴×۹×۳ cm", "قطر ۱۰ cm"],
    "spice_jar": ["۶×۶×۱۲ cm", "۵×۵×۱۰ cm", "۷×۷×۱۴ cm"],
    "canister": ["۱۳×۱۳×۲۰ cm", "۱۰×۱۰×۱۵ cm", "۱۵×۱۵×۲۴ cm"],
}

COUPONS = [
    # code, type, value, min_order, days_valid, usage_limit(0=unlimited)
    ("WELCOME15", "percentage", 15, 500000, 90, 0),
    ("KILN100", "fixed", 100000, 800000, 45, 200),
]

CAROUSELS = [
    {
        "title": "سفارشی‌سازی ماگ لاجوردی",
        "subtitle": "هر اثر یکتا و بی‌نظیر، ساخته‌شده با دست در کارگاه تن‌سِرام",
        "image_url": "/carousel/hero-1.svg",
        "link_url": "/shop",
        "sort_order": 0,
    },
    {
        "title": "مجموعه جدید فیروزه‌ای",
        "subtitle": "renovated artisan collection — تازه از کوره",
        "image_url": "/carousel/hero-2.svg",
        "link_url": "/category/ceramic-ashtrays",
        "sort_order": 1,
    },
    {
        "title": "هدیهٔ ویژه برای علاقه‌مندان سفال",
        "subtitle": "ست‌های هدیه با بسته‌بندی دست‌ساز",
        "image_url": "/carousel/hero-3.svg",
        "link_url": "/category/spice-jars",
        "sort_order": 2,
    },
]


def build_rows() -> dict:
    """Build plain-data rows consumed by scripts/seed.py and tests."""
    now = datetime.now(UTC)
    categories_out = []
    products_out = []
    images_out = []
    coupons_out = []

    for cat_key, cat_name, cat_slug, shape in CATEGORIES:
        categories_out.append(
            {
                "name": cat_name,
                "slug": cat_slug,
                "description": f"مجموعهٔ دست‌سازِ {cat_name}؛ ساخته‌شده در کارگاه سرامیک تن‌سِرام.",
            }
        )
        for i, (sku_slug, name, price, compare, desc, short) in enumerate(
            PRODUCTS[cat_key], start=1
        ):
            slug = f"{sku_slug}"
            products_out.append(
                {
                    "name": name,
                    "slug": slug,
                    "category_slug": cat_slug,
                    "description": desc,
                    "short_description": short,
                    "price": float(price),
                    "compare_at_price": float(compare) if compare else None,
                    "stock_qty": [12, 7, 3, 18, 9, 25][i - 1],
                    "sku": f"TC-{shape.upper()[:3]}-{i:02d}",
                    "weight_grams": {"mug": 380, "ashtray": 300, "spice_jar": 340, "canister": 900}[
                        shape
                    ],
                    "material": MATERIALS[i % len(MATERIALS)],
                    "dimensions": DIMENSIONS[shape][i % len(DIMENSIONS[shape])],
                }
            )
            for angle in range(1, 4):
                images_out.append(
                    {
                        "product_slug": slug,
                        "url": f"/products/{shape}-{i}-{angle}.svg",
                        "alt_text": f"{name} — نمای {angle}",
                        "sort_order": angle,
                        "is_primary": angle == 1,
                    }
                )

    for code, dtype, value, min_order, days, limit in COUPONS:
        coupons_out.append(
            {
                "code": code,
                "discount_type": dtype,
                "discount_value": float(value),
                "min_order_amount": float(min_order),
                "expires_at": now + timedelta(days=days),
                "usage_limit": limit,
                "used_count": 0,
            }
        )

    return {
        "categories": categories_out,
        "products": products_out,
        "images": images_out,
        "coupons": coupons_out,
        "carousels": CAROUSELS,
    }
