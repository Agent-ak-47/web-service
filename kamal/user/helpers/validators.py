import re

EMAIL_PATTERN = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
MIN_PASSWORD_LENGTH = 8


def clean(value):
    return value.strip() if isinstance(value, str) else ''


def is_email(value):
    return bool(EMAIL_PATTERN.match(value))


def is_password(value):
    return isinstance(value, str) and len(value) >= MIN_PASSWORD_LENGTH
