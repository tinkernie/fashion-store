from .dummy import DummyGateway
from .zarinpal import ZarinpalGateway

GATEWAYS = {
    'dummy': DummyGateway,
    'zarinpal': ZarinpalGateway,
}