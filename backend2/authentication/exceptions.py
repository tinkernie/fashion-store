from common.exceptions import BusinessException


class InvalidTokenException(BusinessException):
    default_code = "invalid_token"


class TokenExpiredException(BusinessException):
    default_code = "token_expired"
