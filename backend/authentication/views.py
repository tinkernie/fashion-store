from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView as SimpleJWTTokenRefreshView
from .services import AuthService
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    OtpRequestSerializer,
    OtpVerifySerializer,
    PasswordResetViaOtpSerializer,
    ChangePasswordSerializer,
)

from rest_framework.throttling import ScopedRateThrottle


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"


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


class OtpRequestView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = OtpRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = AuthService()
        data = service.request_otp(
            serializer.validated_data["phone_number"],
            serializer.validated_data.get("purpose", "login"),
        )
        return Response(data, status=status.HTTP_200_OK)


class OtpVerifyView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = OtpVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = AuthService()
        data = service.verify_otp(
            serializer.validated_data["phone_number"],
            serializer.validated_data["code"],
            serializer.validated_data.get("purpose", "login"),
        )
        return Response(data, status=status.HTTP_200_OK)


class PasswordResetViaOtpView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = PasswordResetViaOtpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = AuthService()
        data = service.reset_password_with_otp(
            serializer.validated_data["phone_number"],
            serializer.validated_data["code"],
            serializer.validated_data["new_password"],
        )
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
    permission_classes = [permissions.AllowAny]


class TokenVerifyView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
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


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = AuthService()
        result = service.change_password(user=request.user, **serializer.validated_data)
        return Response(result)
