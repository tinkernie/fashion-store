import django.dispatch

cart_changed = django.dispatch.Signal()  # args: user, session_key, action ('add'/'remove'), variant_id, quantity
order_placed = django.dispatch.Signal()  # args: user, order, items_data
