from django.db import transaction
from common.exceptions import BusinessException
from .repositories import PaymentRepository
from .selectors import PaymentSelector
from .gateways.registry import GATEWAYS
from orders.models import Order
from orders.repositories import OrderRepository
from .models import Payment

class PaymentService:
    def initiate_payment(self, user, order_id: str, gateway: str = 'dummy') -> dict:
        order = Order.objects.filter(id=order_id, user=user).first()
        if not order:
            raise BusinessException("Order not found.")
        if order.status not in [Order.Status.AWAITING_PAYMENT, Order.Status.PENDING]:
            raise BusinessException("Order cannot be paid in its current status.")

        # Check for existing successful payment
        if order.payments.filter(status=Payment.Status.SUCCEEDED).exists():
            raise BusinessException("Order already has a successful payment.")

        amount = order.total
        payment = PaymentRepository.create_payment(order, user, str(amount), gateway)

        # Call gateway to initiate transaction
        gateway_cls = GATEWAYS.get(gateway)
        if not gateway_cls:
            raise BusinessException(f"Unknown gateway: {gateway}")
        gw = gateway_cls()
        result = gw.create_transaction(payment, order)

        # Update payment with gateway result
        PaymentRepository.update_payment(
            payment,
            status=result['status'],
            gateway_reference=result['gateway_reference'],
            raw_response=result['raw_response'],
        )

        if result['status'] == Payment.Status.SUCCEEDED:
            # Transition order to PAID
            order_service = OrderService()   # careful about circular import; we'll import inside method
            from orders.services import OrderService
            order_service.transition_status(order.id, Order.Status.PAID, note='Payment succeeded')
            # Link payment to order
            order.payment = payment
            order.save()

        return self._serialize_payment(payment)

    def verify_callback(self, gateway: str, request_data: dict) -> dict:
        gateway_cls = GATEWAYS.get(gateway)
        if not gateway_cls:
            raise BusinessException(f"Unknown gateway: {gateway}")
        gw = gateway_cls()
        result = gw.verify_callback(request_data)
        # Find payment by gateway_reference
        payment = Payment.objects.filter(gateway_reference=result['gateway_reference']).first()
        if not payment:
            raise BusinessException("Payment not found for this reference.")

        PaymentRepository.update_payment(
            payment,
            status=result['status'],
            raw_response=result['raw_response'],
            callback_data=request_data,
        )
        if result['status'] == Payment.Status.SUCCEEDED and payment.status != Payment.Status.SUCCEEDED:
            # Transition order to PAID if not already
            if payment.order.status != Order.Status.PAID:
                from orders.services import OrderService
                order_service = OrderService()
                order_service.transition_status(payment.order.id, Order.Status.PAID, note='Payment verified via callback')
                payment.order.payment = payment
                payment.order.save()
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