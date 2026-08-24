from abc import ABC, abstractmethod

class BasePaymentGateway(ABC):
    @abstractmethod
    def create_transaction(self, payment, order) -> dict:
        """
        Return a dict with at least:
        - 'gateway_reference': str
        - 'status': str (pending/authorized/succeeded/failed)
        - 'raw_response': dict
        """
        pass

    @abstractmethod
    def verify_callback(self, request_data: dict) -> dict:
        """
        Validate callback payload and return:
        - 'gateway_reference': str
        - 'status': str
        - 'raw_response': dict
        """
        pass