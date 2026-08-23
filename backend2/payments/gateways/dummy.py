from .base import BasePaymentGateway

class DummyGateway(BasePaymentGateway):
    def __init__(self, mode='success'):
        self.mode = mode  # 'success' or 'failure'

    def create_transaction(self, payment, order):
        import uuid
        ref = f'dummy-{uuid.uuid4().hex[:12]}'
        if self.mode == 'success':
            return {
                'gateway_reference': ref,
                'status': 'succeeded',
                'raw_response': {'mock': True, 'status': 'succeeded'},
            }
        else:
            return {
                'gateway_reference': ref,
                'status': 'failed',
                'raw_response': {'mock': True, 'status': 'failed', 'error': 'Insufficient funds'},
            }

    def verify_callback(self, request_data):
        # Dummy verification: just return success
        ref = request_data.get('ref', 'dummy-callback-ref')
        return {
            'gateway_reference': ref,
            'status': 'succeeded',
            'raw_response': request_data,
        }