import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE','config.settings')
django.setup()
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from products.models import Product
from categories.models import Category
import uuid

User=get_user_model()
client=APIClient()
# test product detail price int
prod=Product.objects.filter(status='published').first()
if prod:
    c=APIClient()
    resp=c.get(f'/api/products/{prod.slug}/')
    print('GET /api/products/<slug>/ status', resp.status_code)
    if resp.status_code==200:
        price=resp.data.get('price')
        print(' price', price, type(price), 'is int?', isinstance(price, int))
        print(' PASS' if isinstance(price, int) else ' FAIL - not int')
    # test variants
    from variants.models import Variant
    variant=Variant.objects.filter(product=prod).first()
    if variant:
        from rest_framework.test import APIClient as AC
        ac=AC()
        # public variant list
        resp2=c.get(f'/api/products/{prod.slug}/variants/')
        if resp2.status_code==200 and resp2.data:
            vprice=resp2.data[0].get('price')
            print(' variant price', vprice, type(vprice), 'int?', isinstance(vprice, int))

# test cart
user=User.objects.filter(is_active=True).first()
if not user:
    user=User.objects.create_user(email=f'test_curr_{uuid.uuid4().hex[:6]}@example.com', password='Passw0rd!123')
client.force_authenticate(user=user)
resp3=client.get('/api/cart/')
print('GET /api/cart/ status', resp3.status_code)
if resp3.status_code==200:
    print(' cart subtotal', resp3.data.get('subtotal'), type(resp3.data.get('subtotal')))
    print(' cart total', resp3.data.get('total'), type(resp3.data.get('total')))
    if resp3.data.get('items'):
        print(' item price', resp3.data['items'][0].get('price'), type(resp3.data['items'][0].get('price')))
        print(' PASS cart int' if isinstance(resp3.data['items'][0].get('price'), int) else ' FAIL')

# test order
from orders.models import Order
order=Order.objects.first()
if order:
    from django.contrib.auth import get_user_model
    User=get_user_model()
    admin=User.objects.filter(is_staff=True).first()
    if admin:
        client.force_authenticate(user=admin)
        resp4=client.get(f'/api/admin/orders/')
        if resp4.status_code==200 and resp4.data:
            # check via service serialization directly
            from orders.services import OrderService
            svc=OrderService()
            # get first order via service
            try:
                data=svc.get_order_by_number(order.order_number, user=admin)
                print(' order total', data.get('total'), type(data.get('total')), 'int?', isinstance(data.get('total'), int))
                print(' order items price', data['items'][0].get('price') if data['items'] else 'no items', type(data['items'][0].get('price')) if data['items'] else 'none')
            except Exception as e:
                print(' order service fail', e)

# test payment
from payments.models import Payment
pay=Payment.objects.first()
if pay:
    from payments.services import PaymentService
    svc=PaymentService()
    ser=svc._serialize_payment(pay)
    print(' payment amount', ser.get('amount'), type(ser.get('amount')), 'int?', isinstance(ser.get('amount'), int))

# test product create with integer price
admin=User.objects.filter(is_staff=True).first()
client.force_authenticate(user=admin)
import uuid as uu
cat=Category.objects.filter(is_active=True).first()
resp_create=client.post('/api/admin/products/', {'title':f'Test Curr {uu.uuid4().hex[:6]}','slug':f'test-curr-{uu.uuid4().hex[:6]}','category_id': str(cat.id) if cat else None, 'price': 420000, 'status':'published'}, format='json')
print('POST /api/admin/products/ with int price status', resp_create.status_code)
if resp_create.status_code==201:
    print(' created price in metadata', resp_create.data.get('metadata', {}).get('price'), type(resp_create.data.get('metadata', {}).get('price')))
    print(' detail price', resp_create.data.get('price'), type(resp_create.data.get('price')))
else:
    print(' create failed', resp_create.data)

print('All currency checks done')
