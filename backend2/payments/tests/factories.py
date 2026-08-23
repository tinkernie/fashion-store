import factory
from factory.django import DjangoModelFactory
from payments.models import Payment
from orders.tests.factories import OrderFactory
from common.tests.factories import UserFactory

class PaymentFactory(DjangoModelFactory):
    class Meta:
        model = Payment
    order = factory.SubFactory(OrderFactory)
    user = factory.SubFactory(UserFactory)
    amount = '100.00'
    gateway = 'dummy'
    status = Payment.Status.PENDING
    authority = factory.Sequence(lambda n: f'PAY-{n:012X}')