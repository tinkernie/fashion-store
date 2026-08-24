import uuid
from .models import Payment
from common.exceptions import BusinessException

class PaymentRepository:
    @staticmethod
    def create_payment(order, user, amount: str, gateway: str) -> Payment:
        authority = f"PAY-{uuid.uuid4().hex[:12].upper()}"
        return Payment.objects.create(
            order=order,
            user=user,
            amount=amount,
            gateway=gateway,
            authority=authority,
        )

    @staticmethod
    def update_payment(payment: Payment, **fields):
        allowed = ['status', 'gateway_reference', 'raw_response', 'callback_data']
        for key, value in fields.items():
            if key in allowed:
                setattr(payment, key, value)
        payment.save()