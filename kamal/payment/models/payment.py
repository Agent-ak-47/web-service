from models import db


class Payment(db.Model):
    __tablename__ = 'payments'

    id = db.Column(db.BigInteger, primary_key=True)
    reservation_id = db.Column(
        db.BigInteger,
        db.ForeignKey('reservations.id', ondelete='CASCADE'),
        nullable=False,
    )
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    method = db.Column(
        db.Enum('CARD', 'CASH', 'BANK_TRANSFER', 'PAYPAL'),
        nullable=False,
    )
    status = db.Column(
        db.Enum('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED'),
        nullable=False,
        default='PENDING',
    )
    payment_date = db.Column(db.DateTime, nullable=True)
    transaction_ref = db.Column(db.String(64), nullable=True, unique=True)
    card_mask = db.Column(db.String(4), nullable=True)
    error_code = db.Column(db.String(64), nullable=True)
