from django.contrib.auth.base_user import BaseUserManager


class UserManager(BaseUserManager):
    """M4: SoftDelete-aware - filters deleted_at__isnull=True, inherits BaseUserManager."""
    use_in_migrations = True

    def get_queryset(self):
        # Filter out soft-deleted users (deleted_at not null)
        return super().get_queryset().filter(deleted_at__isnull=True)

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required.")
        user = self.model(email=self.normalize_email(email), **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        if not extra_fields["is_staff"] or not extra_fields["is_superuser"]:
            raise ValueError("Superuser must have is_staff=True and is_superuser=True.")
        return self.create_user(email, password, **extra_fields)


class UserAllObjectsManager(BaseUserManager):
    """Includes soft-deleted users - no deleted_at filter."""
    use_in_migrations = False

    def get_queryset(self):
        return super().get_queryset()
