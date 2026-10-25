from models import db


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.BigInteger, primary_key=True)
    name = db.Column(db.String(80), nullable=False, default='')
    email = db.Column(db.String(160), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum('CLIENT', 'ADMIN'), nullable=False, default='CLIENT')
    phone = db.Column(db.String(30), nullable=True)
    address = db.Column(db.String(255), nullable=True)
    active = db.Column(db.Boolean, nullable=False, default=True)

    def to_json(self):
        return {
            'id': self.id,
            'name': self.name or '',
            'email': self.email,
            'role': self.role,
            'phone': self.phone or '',
            'address': self.address or '',
        }
