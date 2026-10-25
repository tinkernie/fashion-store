from celery import shared_task


@shared_task(name="products.tasks.cleanup_expired_discounts")
def cleanup_expired_discounts_task():
    from products.services import cleanup_expired_discounts

    return cleanup_expired_discounts()
