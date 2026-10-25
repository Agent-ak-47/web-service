from models import db


class ReservationHistory(db.Model):
    __tablename__ = 'reservation_history'

    id = db.Column(db.BigInteger, primary_key=True)
    reservation_id = db.Column(
        db.BigInteger,
        db.ForeignKey('reservations.id', ondelete='CASCADE'),
        nullable=False,
    )
    status_before = db.Column(db.String(20), nullable=True)
    status_after = db.Column(db.String(20), nullable=False)
    comment = db.Column(db.String(255), nullable=True)
    actor = db.Column(db.String(80), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False)
