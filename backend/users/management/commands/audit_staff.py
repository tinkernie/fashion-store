from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = "List staff/superuser accounts for access review (run monthly)."

    def handle(self, *args, **options):
        User = get_user_model()
        qs = User.objects.filter(is_staff=True).order_by("phone_number")
        if not qs.exists():
            self.stdout.write("No staff accounts.")
            return
        for u in qs:
            self.stdout.write(
                f"{u.phone_number} | staff={u.is_staff} superuser={u.is_superuser} "
                f"active={u.is_active} | {u.first_name} {u.last_name}".strip()
            )
