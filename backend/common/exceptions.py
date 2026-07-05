from rest_framework.exceptions import APIException

class BusinessException(APIException):
    status_code = 400
    default_detail = 'A business error occurred.'
    default_code = 'business_error'

    def __init__(self, detail=None, code=None):
        if detail is not None:
            self.detail = detail
        if code is not None:
            self.code = code
        super().__init__(detail, code)