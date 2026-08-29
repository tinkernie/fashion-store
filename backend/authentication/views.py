from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView as SimpleJWTTokenRefreshView
from .services import AuthService
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    TokenRefreshSerializer,
    VerifyEmailSerializer,
    ResendVerificationSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    ChangePasswordSerializer,
)

from django.db import transaction

from rest_framework.throttling import ScopedRateThrottle
from .permissions import IsTokenValid
from .repositories import TokenRepository, UserRepository
from .selectors import UserSelector
from .tasks import send_verification_email


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = AuthService()
        data = service.login_user(**serializer.validated_data)
        return Response(data, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"error": "Refresh token required"}, status=status.HTTP_400_BAD_REQUEST
            )
        service = AuthService()
        service.logout_user(refresh_token)
        return Response(
            {"message": "Logged out successfully."},
            status=status.HTTP_205_RESET_CONTENT,
        )


class CustomTokenRefreshView(SimpleJWTTokenRefreshView):
    # Inherits built-in rotation and blacklisting; we just override permission if needed.
    permission_classes = [permissions.AllowAny]


class TokenVerifyView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # SimpleJWT provides a verify endpoint; we can simply use the library or a custom check.
        from rest_framework_simplejwt.tokens import AccessToken

        token = request.data.get("token")
        try:
            AccessToken(token)
        except Exception:
            return Response(
                {"detail": "Token is invalid or expired"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return Response({}, status=status.HTTP_200_OK)


class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = AuthService()
        result = service.verify_email(str(serializer.validated_data["token"]))
        return Response(result, status=status.HTTP_200_OK)


class ResendVerificationView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResendVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user_selector = UserSelector()
        user = user_selector.get_user_by_email(serializer.validated_data["email"])
        if user and not user.is_active:
            token = TokenRepository.create_verification_token(user)
            transaction.on_commit(
                lambda: send_verification_email.delay(str(user.id), str(token.token))
            )
        return Response(
            {
                "message": "If the account exists and is not active, a verification email has been sent."
            }
        )


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = AuthService()
        result = service.request_password_reset(serializer.validated_data["email"])
        return Response(result)


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = AuthService()
        result = service.reset_password(**serializer.validated_data)
        return Response(result)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = AuthService()
        result = service.change_password(user=request.user, **serializer.validated_data)
        return Response(result)
