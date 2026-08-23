from .models import Payment

class PaymentSelector:
    @staticmethod
    def get_payment_by_authority(authority: str) -> Payment or None:
        return Payment.objects.filter(authority=authority).select_related('order', 'user').first()

    @staticmethod
    def get_payments_for_order(order_id: str) -> list[Payment]:
        return Payment.objects.filter(order_id=order_id).order_by('-created_at')