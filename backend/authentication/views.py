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
    SignupCompleteSerializer,
    PasswordResetViaOtpSerializer,
    ChangePasswordSerializer,
)

from rest_framework.throttling import ScopedRateThrottle


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def create(self, request, *args, **kwargs):
        # Serializer.create() returns the token payload dict (not a model
        # instance), so bypass the default save-and-serialize flow which
        # would 500 trying to serialize it as a user.
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.save()
        return Response(data, status=status.HTTP_201_CREATED)


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


class SignupCompleteView(APIView):
    """Signup step 2 of 2 (OTP-first flow): create the account with
    name+password after otp/verify with purpose=signup, and log in."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = SignupCompleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = AuthService()
        data = service.complete_signup(
            phone_number=serializer.validated_data["phone_number"],
            signup_token=serializer.validated_data["signup_token"],
            password=serializer.validated_data["password"],
            first_name=serializer.validated_data.get("first_name", ""),
            last_name=serializer.validated_data.get("last_name", ""),
        )
        return Response(data, status=status.HTTP_201_CREATED)


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
        # sid of the calling access token: its login session (including its
        # sibling refresh token) survives the rotation; others are logged out.
        current_sid = None
        try:
            current_sid = (request.auth.payload or {}).get("sid")
        except Exception:
            current_sid = None
        service = AuthService()
        result = service.change_password(
            user=request.user, current_sid=current_sid,
            **serializer.validated_data
        )
        return Response(result)
