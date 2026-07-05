# core/views.py
from rest_framework.generics import GenericAPIView

class BaseAPIView(GenericAPIView):
    # Enforce that all business logic goes through service layer
    pass