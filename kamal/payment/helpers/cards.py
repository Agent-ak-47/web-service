import re
from datetime import datetime, timezone

CARD_NUMBER_PATTERN = re.compile(r'^\d{12,19}$')
EXPIRY_PATTERN = re.compile(r'^(0[1-9]|1[0-2])/(\d{2}|\d{4})$')
CVV_PATTERN = re.compile(r'^\d{3,4}$')


def normalize_card_number(value):
    if not isinstance(value, str):
        return ''

    return re.sub(r'[\s-]', '', value)


def mask_of(card_number):
    return card_number[-4:]


def is_valid_expiry(value):
    if not isinstance(value, str):
        return False

    match = EXPIRY_PATTERN.fullmatch(value.strip())

    if match is None:
        return False

    month = int(match.group(1))
    year = int(match.group(2))

    if year < 100:
        year += 2000

    now = datetime.now(timezone.utc)

    return (year, month) >= (now.year, now.month)


def is_valid_card(card_number, expiration, cvv):
    if CARD_NUMBER_PATTERN.fullmatch(card_number) is None:
        return False

    if not is_valid_expiry(expiration):
        return False

    if not isinstance(cvv, str) or CVV_PATTERN.fullmatch(cvv.strip()) is None:
        return False

    return True
