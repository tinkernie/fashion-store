from django.urls import path, include

urlpatterns = [
    path('api/v1/auth/', include('authentication.urls')),
    path('api/v1/users/', include('users.urls')),
    path('api/v1/', include('categories.urls')),
    path('api/v1/', include('collections.urls')),
]
