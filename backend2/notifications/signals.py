import django.dispatch

order_status_changed = django.dispatch.Signal()   # providing_args=["order", "old_status", "new_status"]