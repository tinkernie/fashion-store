from django.core.management.base import BaseCommand
from notifications.models import NotificationTemplate

DEFAULT_TEMPLATES = [
    {
        'type': 'order_confirmation',
        'subject_template': 'سفارش {{ order_number }} با موفقیت ثبت شد — فروشگاه لوکس',
        'body_template': '{{ user_name }} عزیز، سفارش شما به شماره {{ order_number }} با مبلغ {{ total }} تومان با موفقیت ثبت گردید و در حال آماده‌سازی است. مشاهده فاکتور: {{ invoice_url }}',
    },
    {
        'type': 'order_status_change',
        'subject_template': 'وضعیت سفارش {{ order_number }}: {{ new_status_fa|default:new_status }}',
        'body_template': '{{ user_name }} عزیز، وضعیت سفارش شما به شماره {{ order_number }} به «{{ new_status_fa|default:new_status }}» تغییر یافت. جهت مشاهده جزئیات سفارش به حساب کاربری خود مراجعه فرمایید: {{ frontend_url }}/profile?tab=orders',
    },
    {
        'type': 'shipping_update',
        'subject_template': 'سفارش شما تحویل شرکت پست شد — کد رهگیری {{ tracking_number|default:"" }}',
        'body_template': '{{ user_name }} عزیز، سفارش شما به شماره {{ order_number }} بسته‌بندی شد و جهت ارسال تحویل شرکت پست گردید. کد رهگیری پستی: {{ tracking_number|default:"در انتظار صدور" }}',
    },
    {
        'type': 'welcome',
        'subject_template': 'به فروشگاه لوکس فشن خوش آمدید',
        'body_template': '{{ user_name }} عزیز، از اینکه به جمع مشتریان خاص لوکس پیوستید بسیار خرسندیم. برای مشاهده جدیدترین کالکشن‌های فصلی به وب‌سایت مراجعه فرمایید: {{ frontend_url }}/collections',
    },
    {
        'type': 'generic',
        'subject_template': 'اطلاعیه سیستم — فروشگاه لوکس',
        'body_template': 'کاربر گرامی، یک پیام سیستمی جدید برای شما ثبت شده است: {{ message|default:"" }}',
    },
]


class Command(BaseCommand):
    help = 'Initialize default notification templates in Persian'

    def handle(self, *args, **options):
        for tpl in DEFAULT_TEMPLATES:
            NotificationTemplate.objects.update_or_create(
                type=tpl['type'],
                defaults={
                    'subject_template': tpl['subject_template'],
                    'body_template': tpl['body_template'],
                    'is_active': True,
                }
            )
        self.stdout.write(self.style.SUCCESS('Persian notification templates initialized.'))
