# Backend Engineering Tasks & API Requirements

> **Status:** Pending Backend Execution  
> **Target App:** `users` / `common`  
> **Context:** Frontend e-commerce workflows have migrated to OTP-first signup. This document defines the backend schema and serializer updates needed to support user profile emails without breaking SMS-based auth.

---

## 1. User Model: Email Field Addition

### Objective
Allow authenticated users who sign up via phone OTP to add and update an email address from their profile settings.

### Schema Changes (`common/models.py`)
Add an optional, nullable email field to `common.User`:

```python
# In common/models.py -> class User(BaseModel, AbstractBaseUser, PermissionsMixin)
email = models.EmailField(
    max_length=255,
    unique=True,
    null=True,
    blank=True,
    db_index=True,
    help_text="User email address (optional, added post-signup via profile).",
)
```

### Constraints & Invariants
- Conditionally unique for non-null/non-empty values:
  ```python
  models.UniqueConstraint(
      fields=["email"],
      name="unique_user_email_non_null",
      condition=models.Q(email__isnull=False) & ~models.Q(email=""),
      violation_error_message="A user with this email address already exists.",
  )
  ```
- Soft-delete aware: ensure `deleted_at IS NULL` condition if soft-deleted rows should not block email reuse.

---

## 2. Serializers & API Endpoints

### Update `backend/users/serializers.py`
1. **`UserProfileSerializer`**:
   Expose `email` in read responses:
   ```python
   email = serializers.EmailField(read_only=True)
   ```
2. **`UpdateProfileSerializer`**:
   Allow updating email via `PATCH /api/users/me/`:
   ```python
   email = serializers.EmailField(required=False, allow_null=True, allow_blank=True)
   ```

### Validation & Verification
- Test duplicate email rejection with friendly `400 BusinessException` ("A user with this email already exists.").
- Ensure existing phone-only OTP users are unaffected by the migration.
