from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import RegisterView, MeView, LogoutView


urlpatterns = [
    # JWT
    path("auth/login/", TokenObtainPairView.as_view(), name="auth-login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="auth-token-refresh"),
    
    # Logout
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    
    # Rejestracja (tylko admin, na wszelki wypadek np. seedy)
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    
    # Aktualny użytkownik
    path("auth/me/", MeView.as_view(), name="auth-me"),
]