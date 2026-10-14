from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model
from common.exceptions import BusinessException
from .repositories import UserRepository
from .selectors import UserSelector
from .validators import UserValidator

User = get_user_model()


class UserService:
    def update_profile(self, user: User, data: dict) -> User:
        allowed_fields = {"first_name", "last_name", "email"}
        filtered = {k: v for k, v in data.items() if k in allowed_fields}
        if "email" in filtered:
            email = (filtered["email"] or "").strip().lower() or None
            if email and User.objects.filter(
                email=email, deleted_at__isnull=True
            ).exclude(id=user.id).exists():
                raise BusinessException("A user with this email address already exists.")
            filtered["email"] = email
        if not filtered:
            raise BusinessException("No valid fields to update.")
        for field in ["first_name", "last_name"]:
            if field in filtered:
                UserValidator.validate_name(filtered[field], field_name=field)
        from django.db import IntegrityError

        try:
            return UserRepository.update_user(user, **filtered)
        except IntegrityError:
            raise BusinessException("A user with this email address already exists.")

    def change_phone_request(self, user: User, new_phone: str) -> dict:
        from authentication.validators import PhoneValidator
        from authentication.models import OtpCode
        from authentication.repositories import OtpRepository
        import secrets
        from django.conf import settings

        new_phone = PhoneValidator.validate(new_phone)
        UserValidator.validate_phone_unique(new_phone, exclude_user_id=user.id)
        with transaction.atomic():
            OtpCode.objects.filter(
                phone_number=new_phone, purpose=OtpCode.PURPOSE_LOGIN, is_used=False
            ).update(is_used=True)
            raw = "".join(secrets.choice("0123456789") for _ in range(max(4, min(int(settings.OTP_LENGTH), 8))))
            OtpRepository.create_otp(new_phone, raw, OtpCode.PURPOSE_LOGIN)
            # stash pending phone on user session? store via PhoneChangeRequest
            from .models import PhoneChangeRequest

            PhoneChangeRequest.objects.filter(user=user, is_used=False).update(is_used=True)
            PhoneChangeRequest.objects.create(user=user, new_phone=new_phone)
        from notifications.tasks import send_otp_sms

        transaction.on_commit(lambda: send_otp_sms.delay(new_phone, raw))
        return {"message": "OTP sent to new number."}

    def confirm_phone_change(self, user: User, new_phone: str, code: str) -> dict:
        from authentication.models import OtpCode
        from authentication.validators import PhoneValidator

        new_phone = PhoneValidator.validate(new_phone)
        with transaction.atomic():
            otp = (
                OtpCode.objects.select_for_update()
                .filter(phone_number=new_phone, purpose=OtpCode.PURPOSE_LOGIN, is_used=False)
                .order_by("-created_at")
                .first()
            )
            if not otp:
                raise BusinessException("Invalid or expired code.", code="invalid_otp")
            if timezone.now() >= otp.expires_at:
                otp.is_used = True
                otp.save(update_fields=["is_used", "updated_at"])
                raise BusinessException("Code expired.", code="otp_expired")
            if not otp.check_code(code):
                otp.attempts += 1
                if otp.attempts >= otp.max_attempts:
                    otp.is_used = True
                otp.save(update_fields=["attempts", "is_used", "updated_at"])
                raise BusinessException("Invalid code.", code="invalid_otp")
            if User.objects.filter(phone_number=new_phone).exclude(id=user.id).exists():
                raise BusinessException("Phone already in use.", code="phone_exists")
            otp.is_used = True
            otp.save(update_fields=["is_used", "updated_at"])
            from .models import PhoneChangeRequest

            PhoneChangeRequest.objects.filter(user=user, is_used=False).update(is_used=True)
            user.phone_number = new_phone
            user.save(update_fields=["phone_number", "updated_at"])
            from rest_framework_simplejwt.token_blacklist.models import (
                BlacklistedToken,
                OutstandingToken,
            )

            for t in OutstandingToken.objects.select_for_update().filter(user=user):
                BlacklistedToken.objects.get_or_create(token=t)
        return {"message": "Phone changed. Please log in again."}

    # Admin actions
    def deactivate_user(self, user_id: str, requested_by: User) -> dict:
        user = UserSelector.get_user_by_id(user_id)
        if not user:
            raise BusinessException("User not found.", code="not_found")
        if user == requested_by:
            raise BusinessException(
                "You cannot deactivate your own account.", code="self_deactivate"
            )
        UserRepository.deactivate_user(user)
        return {"message": f"User {user.phone_number} deactivated."}

    def activate_user(self, user_id: str, requested_by: User) -> dict:
        user = UserSelector.get_user_by_id(user_id)
        if not user:
            raise BusinessException("User not found.", code="not_found")
        UserRepository.activate_user(user)
        return {"message": f"User {user.phone_number} activated."}

    def admin_update_user(self, user_id: str, data: dict, requested_by: User) -> User:
        user = UserSelector.get_user_by_id(user_id)
        if not user:
            raise BusinessException("User not found.", code="not_found")
        allowed = {"first_name", "last_name", "is_active"}
        update_data = {k: v for k, v in data.items() if k in allowed}

        if user == requested_by and update_data.get("is_active") is False:
            raise BusinessException(
                "You cannot deactivate your own account.",
                code="self_deactivate",
            )
        return UserRepository.update_user(user, **update_data)

    def assign_groups(self, user_id: str, group_ids: list, requested_by: User):
        user = UserSelector.get_user_by_id(user_id)
        if not user:
            raise BusinessException("User not found.")
        from django.contrib.auth.models import Group

        if user == requested_by:
            raise BusinessException("Cannot change your own groups.", code="self_assign")
        groups = Group.objects.filter(id__in=group_ids)
        if groups.count() != len(set(str(g) for g in group_ids)):
            raise BusinessException("One or more groups not found.", code="not_found")
        user.groups.set(groups)
        return {"groups": list(user.groups.values_list("name", flat=True))}


class UserExportService:
    """Admin customer-phone export (CSV / dependency-free XLSX).

    Exports exactly the rows the admin users table shows (same search /
    is_active filters). Phone numbers are emitted as TEXT so Excel never
    strips the leading zero of 09… numbers; CSV carries a BOM so Persian
    text renders correctly in Excel.
    """

    COLUMNS = ["phone_number", "first_name", "last_name", "email",
               "is_active", "is_staff", "date_joined"]
    HEADERS = ["Phone", "First name", "Last name", "Email",
               "Active", "Staff", "Joined at"]
    MAX_ROWS = 50000

    @classmethod
    def fetch_rows(cls, filters: dict = None) -> list:
        from .selectors import UserSelector

        qs = UserSelector.list_users(filters).order_by("-date_joined")
        count = qs.count()
        if count > cls.MAX_ROWS:
            raise BusinessException(
                f"Export too large ({count} rows, max {cls.MAX_ROWS}). "
                "Narrow it with search filters first."
            )
        rows = []
        for u in qs.iterator(chunk_size=2000):
            rows.append([
                u.phone_number or "",
                u.first_name or "",
                u.last_name or "",
                getattr(u, "email", None) or "",
                "yes" if u.is_active else "no",
                "yes" if (u.is_staff or u.is_superuser) else "no",
                u.date_joined.isoformat(sep=" ", timespec="seconds") if u.date_joined else "",
            ])
        return rows

    @classmethod
    def to_csv(cls, rows: list) -> bytes:
        import csv
        import io

        buf = io.StringIO()
        buf.write("﻿")  # U+FEFF BOM so Excel renders Persian correctly
        writer = csv.writer(buf)
        writer.writerow(cls.HEADERS)
        writer.writerows(rows)
        return buf.getvalue().encode("utf-8")

    @classmethod
    def to_xlsx(cls, rows: list) -> bytes:
        """Minimal single-sheet .xlsx built with stdlib zipfile only (no
        openpyxl dependency). Every cell is an inline string, so phone
        numbers stay text."""
        import io
        import zipfile
        from xml.sax.saxutils import escape

        def col_letter(idx: int) -> str:
            name = ""
            idx += 1
            while idx:
                idx, rem = divmod(idx - 1, 26)
                name = chr(65 + rem) + name
            return name

        _quote_entity = {"'": "&apos;", '"': "&quot;"}

        def cell(ref: str, value: str, style: int = 0) -> str:
            style_attr = ' s="%d"' % style if style else ""
            text = escape(value, _quote_entity)
            return (
                '<c r="%s" t="inlineStr"%s>'
                "<is><t xml:space=\"preserve\">%s</t></is></c>"
                % (ref, style_attr, text)
            )

        sheet_rows = []
        for r_idx, row in enumerate([cls.HEADERS] + rows, start=1):
            cells = "".join(
                cell(f"{col_letter(c_idx)}{r_idx}", "" if v is None else str(v),
                     style=1 if r_idx == 1 else 0)
                for c_idx, v in enumerate(row)
            )
            sheet_rows.append(f'<row r="{r_idx}">{cells}</row>')
        sheet_xml = (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            "<cols>" + "".join(
                f'<col min="{i}" max="{i}" width="{w}" customWidth="1"/>'
                for i, w in zip(range(1, 8), (18, 16, 16, 28, 9, 9, 21))
            ) + "</cols>"
            f"<sheetData>{''.join(sheet_rows)}</sheetData></worksheet>"
        )
        styles_xml = (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            "<fonts><font><sz val=\"11\"/></font>"
            "<font><b/><sz val=\"11\"/></font></fonts>"
            "<fills><fill><patternFill patternType=\"none\"/></fill>"
            "<fill><patternFill patternType=\"gray125\"/></fill></fills>"
            "<borders><border/></borders>"
            "<cellStyleXfs count=\"1\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\"/></cellStyleXfs>"
            "<cellXfs count=\"2\">"
            "<xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\"/>"
            "<xf numFmtId=\"0\" fontId=\"1\" fillId=\"0\" borderId=\"0\" xfId=\"0\" applyFont=\"1\"/>"
            "</cellXfs><cellStyles count=\"1\">"
            "<cellStyle name=\"Normal\" xfId=\"0\" builtinId=\"0\"/></cellStyles>"
            "</styleSheet>"
        )
        content_types = (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            '<Default Extension="xml" ContentType="application/xml"/>'
            '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
            "</Types>"
        )
        rels = (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
            "</Relationships>"
        )
        wb_rels = (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
            '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
            "</Relationships>"
        )
        workbook = (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            "<sheets><sheet name=\"Customers\" sheetId=\"1\" r:id=\"rId1\"/></sheets></workbook>"
        )
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("[Content_Types].xml", content_types)
            zf.writestr("_rels/.rels", rels)
            zf.writestr("xl/workbook.xml", workbook)
            zf.writestr("xl/_rels/workbook.xml.rels", wb_rels)
            zf.writestr("xl/styles.xml", styles_xml)
            zf.writestr("xl/worksheets/sheet1.xml", sheet_xml)
        return buf.getvalue()

    @classmethod
    def export(cls, filters: dict = None, fmt: str = "csv") -> tuple:
        """Returns (content_bytes, content_type, filename)."""
        from django.utils import timezone as _tz

        fmt = (fmt or "csv").lower()
        if fmt not in ("csv", "xlsx"):
            raise BusinessException("Format must be csv or xlsx.")
        rows = cls.fetch_rows(filters)
        stamp = _tz.now().strftime("%Y%m%d-%H%M%S")
        if fmt == "xlsx":
            return (
                cls.to_xlsx(rows),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                f"mavi-customers-{stamp}.xlsx",
            )
        return (
            cls.to_csv(rows),
            "text/csv; charset=utf-8",
            f"mavi-customers-{stamp}.csv",
        )
