from django.urls import path
from . import views

urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("otp/request/", views.OtpRequestView.as_view(), name="otp_request"),
    path("otp/verify/", views.OtpVerifyView.as_view(), name="otp_verify"),
    path("password-reset-otp/", views.PasswordResetViaOtpView.as_view(), name="password_reset_otp"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path(
        "token/refresh/", views.CustomTokenRefreshView.as_view(), name="token_refresh"
    ),
    path("token/verify/", views.TokenVerifyView.as_view(), name="token_verify"),
    path(
        "change-password/", views.ChangePasswordView.as_view(), name="change_password"
    ),
]
