from django.contrib.auth.base_user import BaseUserManager


class UserManager(BaseUserManager):
    """M4: SoftDelete-aware - filters deleted_at__isnull=True, inherits BaseUserManager."""
    use_in_migrations = True

    def get_queryset(self):
        # Filter out soft-deleted users (deleted_at not null)
        return super().get_queryset().filter(deleted_at__isnull=True)

    def normalize_phone(self, phone: str) -> str:
        phone = (phone or "").strip().replace(" ", "").replace("-", "")
        if phone.startswith("+98"):
            phone = "0" + phone[3:]
        elif phone.startswith("98") and len(phone) == 12:
            phone = "0" + phone[2:]
        return phone

    def create_user(self, phone_number, password=None, **extra_fields):
        if not phone_number:
            raise ValueError("Phone number is required.")
        phone_number = self.normalize_phone(phone_number)
        import re

        if not re.match(r"^09\d{9}$", phone_number):
            raise ValueError("Phone number must be like 09123456789.")
        user = self.model(phone_number=phone_number, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, phone_number, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        if not extra_fields["is_staff"] or not extra_fields["is_superuser"]:
            raise ValueError("Superuser must have is_staff=True and is_superuser=True.")
        return self.create_user(phone_number, password, **extra_fields)


class UserAllObjectsManager(BaseUserManager):
    """Includes soft-deleted users - no deleted_at filter."""
    use_in_migrations = False

    def get_queryset(self):
        return super().get_queryset()
