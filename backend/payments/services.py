import os
from decimal import Decimal
from django.db import transaction
from django.conf import settings
from common.exceptions import BusinessException
from .repositories import PaymentRepository
from .selectors import PaymentSelector
from .gateways.registry import GATEWAYS
from orders.models import Order
from orders.repositories import OrderRepository
from .models import Payment

class PaymentService:
    @transaction.atomic
    def initiate_payment(self, user, order_id: str, gateway: str = 'dummy') -> dict:
        from orders.selectors import OrderSelector
        # H5/H10: lock order to prevent double payment race
        try:
            order = Order.objects.select_for_update().get(id=str(order_id))
        except Order.DoesNotExist:
            raise BusinessException("Order not found.")
        if order.user_id != user.id and not user.is_staff:
            raise BusinessException("Order not found.")
        if order.status not in [Order.Status.AWAITING_PAYMENT, Order.Status.PENDING]:
            raise BusinessException("Order cannot be paid in its current status.")

        # H10: block dummy gateway in production
        if gateway == 'dummy' and not settings.DEBUG and os.environ.get("ALLOW_DUMMY_GATEWAY", "False").lower() not in ("true","1","yes"):
            raise BusinessException("Dummy gateway not allowed in production.")

        # Check for existing successful payment atomically (locked order)
        if order.payments.filter(status=Payment.Status.SUCCEEDED).exists():
            raise BusinessException("Order already has a successful payment.")

        # H10: amount validation
        amount = order.total
        if not isinstance(amount, Decimal):
            amount = Decimal(str(amount))
        amount = amount.quantize(Decimal("0.01"))
        if amount <= Decimal("0.00"):
            raise BusinessException("Invalid order amount.")

        payment = PaymentRepository.create_payment(order, user, str(amount), gateway)

        # Call gateway to initiate transaction
        gateway_cls = GATEWAYS.get(gateway)
        if not gateway_cls:
            raise BusinessException(f"Unknown gateway: {gateway}")
        gw = gateway_cls()
        result = gw.create_transaction(payment, order)

        # Update payment with gateway result inside same transaction
        PaymentRepository.update_payment(
            payment,
            status=result['status'],
            gateway_reference=result['gateway_reference'],
            raw_response=result['raw_response'],
        )

        if result['status'] == Payment.Status.SUCCEEDED:
            # Transition order to PAID inside same atomic
            from orders.services import OrderService
            # Use same transaction - transition_status has its own atomic (nested savepoint)
            order_service = OrderService()
            order_service.transition_status(str(order.id), Order.Status.PAID, note='Payment succeeded')
            # Link payment to order - refresh order
            order.refresh_from_db()
            order.payment = payment
            order.save(update_fields=["payment", "updated_at"])
            payment.refresh_from_db()

        return self._serialize_payment(payment)

    @transaction.atomic
    def verify_callback(self, gateway: str, request_data: dict) -> dict:
        # H10: gateway allowlist check
        if gateway not in GATEWAYS:
            raise BusinessException(f"Unknown gateway: {gateway}")
        # Block dummy in prod for callbacks too
        if gateway == 'dummy' and not settings.DEBUG and os.environ.get("ALLOW_DUMMY_GATEWAY", "False").lower() not in ("true","1","yes"):
            raise BusinessException("Dummy gateway not allowed in production.")

        gateway_cls = GATEWAYS.get(gateway)
        gw = gateway_cls()
        # Basic signature verification placeholder: require gateway-specific HMAC if configured
        # For real gateways, verify request_data['signature'] against settings
        result = gw.verify_callback(request_data)
        # H10: validate result structure
        if not result or 'gateway_reference' not in result or 'status' not in result:
            raise BusinessException("Invalid gateway response.")
        # Truncate callback_data to prevent JSON bomb
        if isinstance(request_data, dict) and len(str(request_data)) > 10000:
            request_data = {"truncated": True}

        # Find payment by gateway_reference with lock
        payment = Payment.objects.select_for_update().filter(gateway_reference=result['gateway_reference']).first()
        if not payment:
            raise BusinessException("Payment not found for this reference.")

        # H10: fix inverted logic - check before update, idempotent handling
        was_succeeded = payment.status == Payment.Status.SUCCEEDED
        is_now_succeeded = result['status'] == Payment.Status.SUCCEEDED

        # Only update if status changing
        if payment.status != result['status']:
            PaymentRepository.update_payment(
                payment,
                status=result['status'],
                raw_response=result['raw_response'],
                callback_data=request_data,
            )
            payment.refresh_from_db()
        else:
            # Still update callback_data for audit
            PaymentRepository.update_payment(
                payment,
                callback_data=request_data,
                raw_response=result['raw_response'],
            )
            payment.refresh_from_db()

        if is_now_succeeded and not was_succeeded:
            # Transition order to PAID if not already, order locked
            order = Order.objects.select_for_update().get(id=payment.order_id)
            if order.status not in [Order.Status.PAID, Order.Status.PACKING, Order.Status.SHIPPING, Order.Status.DELIVERED]:
                from orders.services import OrderService
                order_service = OrderService()
                order_service.transition_status(str(order.id), Order.Status.PAID, note='Payment verified via callback')
                order.refresh_from_db()
                order.payment = payment
                order.save(update_fields=["payment", "updated_at"])
        return {'message': 'Callback processed.'}

    def _serialize_payment(self, payment) -> dict:
        return {
            'id': str(payment.id),
            'order_id': str(payment.order_id),
            'authority': payment.authority,
            'amount': str(payment.amount),
            'gateway': payment.gateway,
            'status': payment.status,
            'gateway_reference': payment.gateway_reference,
            'created_at': payment.created_at.isoformat(),
        }
