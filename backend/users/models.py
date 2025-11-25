from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    PermissionsMixin,
    BaseUserManager,
)


class Role(models.Model):
    """
    Prosta tabela ról biznesowych użytkownika.
    Przykłady: HR, Quality, Automation, Admin, Viewer
    """
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    
    def __str__(self):
        return self.name
    
    
class UserManager(BaseUserManager):
    """ 
    Manager dla cusotomowego modelu User logującego po emailu.
    """
    
    def create_user(self, email, password=None, role=None, **extra_fileds):
        if not email:
            raise ValueError("Users must have an email address")
        
        email = self.normalize_email(email)
        user = self.model(email=email, role=role, **extra_fileds)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fileds):
        """ 
        Używane przez komendę createsuperuser.
        Rolę można nadać ręcznie później w panelu admina.
        """
        extra_fileds.setdefault("is_staff", True)
        extra_fileds.setdefault("is_superuser", True)
        extra_fileds.setdefault("is_active", True)
        
        if extra_fileds.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fileds.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        
        return self.create_user(email, password, **extra_fileds)
    
    
class User(AbstractBaseUser, PermissionsMixin):
    """
    Customowy model użytkownika logującego się po emailu.
    Powiązany z rolą biznesową przez klucz obcy.
    """
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    role = models.ForeignKey(Role, on_delete=models.PROTECT, null=True, blank=True, related_name="users")
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.email}" or f"User {self.pk}"