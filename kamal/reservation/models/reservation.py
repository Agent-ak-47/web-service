from models import db


class Reservation(db.Model):
    __tablename__ = 'reservations'

    id = db.Column(db.BigInteger, primary_key=True)
    reference = db.Column(db.String(20), nullable=False, unique=True)
    user_id = db.Column(
        db.BigInteger,
        db.ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False,
    )
    item_type = db.Column(
        db.Enum('FLIGHT', 'PACKAGE', 'EXCURSION'),
        nullable=False,
    )
    item_id = db.Column(db.BigInteger, nullable=False)
    item_label = db.Column(db.String(160), nullable=True)
    quantity = db.Column(db.SmallInteger, nullable=False, default=1)
    reservation_date = db.Column(db.DateTime, nullable=False)
    departure_date = db.Column(db.Date, nullable=True)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    total_amount = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    status = db.Column(
        db.Enum('PENDING', 'CONFIRMED', 'PAID', 'CANCELLED', 'REFUNDED', 'EXPIRED'),
        nullable=False,
        default='PENDING',
    )
    cancellation_reason = db.Column(db.String(255), nullable=True)
