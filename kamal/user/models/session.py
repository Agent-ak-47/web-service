from models import db


class Session(db.Model):
    __tablename__ = 'sessions'

    id = db.Column(db.BigInteger, primary_key=True)
    user_id = db.Column(
        db.BigInteger,
        db.ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False,
    )
    token_hash = db.Column(db.String(64), nullable=False, unique=True)
    ip_address = db.Column(db.String(45), nullable=True)
    expires_at = db.Column(db.DateTime, nullable=False)
