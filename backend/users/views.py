from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import User, Role
from .serializers import UserSerializer, RoleSerializer, UserRegistrationSerializer 


class RegisterView(generics.CreateAPIView):
    """
    Enpoint rejestracji użytkownika.
    W praktyce można ograniczyć tylko dla adminów (IsAdminUser).
    Frontend i tak nie będzie rejestrował użytkowników. Endpoint jest backupowy do np. seedowania użytkowników w testach.
    """
    permission_classes = [IsAdminUser]
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    
    
class MeView(generics.RetrieveAPIView):
    """
    Zwraca dane aktualnie zalogowanego użytkownika.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    
    def get_object(self):               # type: ignore
        return self.request.user
    
    
class LogoutView(APIView):
    """
    Prosty logout:
    - frontend usuwa token JWT z localStorage/cookies
    - (opcjonalnie) można tu dodać blacklistę jeśli zostanie właczona w SimpleJWT
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)