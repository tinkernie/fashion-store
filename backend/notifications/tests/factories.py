import factory
from factory.django import DjangoModelFactory
from notifications.models import NotificationTemplate, Notification, UserNotificationPreference
from common.tests.factories import UserFactory


class NotificationTemplateFactory(DjangoModelFactory):
    class Meta:
        model = NotificationTemplate

    type = 'generic'
    subject_template = 'Subject: {{ var }}'
    body_template = 'Body: {{ var }}'
    is_active = True


class NotificationFactory(DjangoModelFactory):
    class Meta:
        model = Notification

    user = factory.SubFactory(UserFactory)
    type = 'generic'
    subject = 'Test subject'
    body = 'Test body'
    is_read = False


class PreferenceFactory(DjangoModelFactory):
    class Meta:
        model = UserNotificationPreference

    user = factory.SubFactory(UserFactory)
    email_order_updates = True
    email_account = True
