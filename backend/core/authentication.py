from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed


class ResilientJWTAuthentication(JWTAuthentication):
    """
    Enhanced JWT Authentication backend that safely falls back to AnonymousUser
    if a token is expired or invalid on public endpoints (AllowAny),
    while allowing DRF permission classes (IsAuthenticated, IsAdminUser)
    to strictly enforce 401/403 authorization on protected endpoints.
    """

    def authenticate(self, request):
        header = self.get_header(request)
        if header is None:
            return None

        raw_token = self.get_raw_token(header)
        if raw_token is None:
            return None

        try:
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token
        except (InvalidToken, AuthenticationFailed):
            # Rather than failing early on public endpoints with HTTP 401,
            # return None so DRF treats the request as unauthenticated (AnonymousUser).
            # Protected views with IsAuthenticated or IsAdminUser will still reject with 401/403.
            return None
