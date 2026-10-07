import uuid
from django.db import models
from django.utils import timezone


class UUIDPrimaryKeyMixin(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)


class SoftDeleteModel(models.Model):
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)
    objects = SoftDeleteManager()
    all_objects = models.Manager()  # includes deleted

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):
        self.deleted_at = timezone.now()
        self.save(update_fields=["deleted_at", "updated_at"])

    def hard_delete(self):
        super().delete()


class BaseModel(UUIDPrimaryKeyMixin, TimestampedModel, SoftDeleteModel):
    """Ultimate base for all domain entities."""

    class Meta:
        abstract = True


from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.utils import timezone

from django.core.validators import RegexValidator

from .managers import UserAllObjectsManager, UserManager

phone_validator = RegexValidator(
    regex=r"^09\d{9}$",
    message="Phone number must be Iranian mobile like 09123456789.",
)


class User(BaseModel, AbstractBaseUser, PermissionsMixin):

    objects = UserManager()
    all_objects = UserAllObjectsManager()  # M4: includes soft-deleted

    phone_number = models.CharField(
        max_length=15, unique=True, db_index=True, validators=[phone_validator],
        null=True, blank=True,  # temporary for email->SMS migration of existing rows
    )
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    USERNAME_FIELD = "phone_number"
    REQUIRED_FIELDS = []

    class Meta:
        constraints = [
            models.UniqueConstraint(
                "phone_number",
                name="unique_phone_number",
                condition=models.Q(deleted_at__isnull=True),
                violation_error_message="A user with this phone already exists.",
            )
        ]

    def __str__(self):
        return self.phone_number
