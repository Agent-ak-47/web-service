import os
from pathlib import Path
from urllib.parse import quote_plus

from dotenv import load_dotenv

load_dotenv(Path(__file__).with_name('.env'))


class Config:
    PORT = int(os.getenv('PORT', '8083'))

    SECRET_KEY = os.getenv('SECRET_KEY', '')
    JWT_SECRET = os.getenv('JWT_SECRET', '')
    JWT_ALGORITHM = 'HS256'
    JWT_TTL_MINUTES = int(os.getenv('JWT_TTL_MINUTES', '120'))

    DB_HOST = os.getenv('DB_HOST', '127.0.0.1')
    DB_PORT = int(os.getenv('DB_PORT', '3307'))
    DB_NAME = os.getenv('DB_NAME', 'travel_agency')
    DB_USER = os.getenv('DB_USER', 'app_user')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')

    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{quote_plus(DB_USER)}:{quote_plus(DB_PASSWORD)}"
        f"@{DB_HOST}:{DB_PORT}/{quote_plus(DB_NAME)}?charset=utf8mb4"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 280,
        'pool_size': int(os.getenv('DB_POOL_SIZE', '10')),
        'max_overflow': int(os.getenv('DB_MAX_OVERFLOW', '20')),
    }

    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv('CORS_ORIGINS', 'http://localhost:4200').split(',')
        if origin.strip()
    ]


if not Config.SECRET_KEY:
    raise RuntimeError('SECRET_KEY is missing from the environment.')

if not Config.JWT_SECRET:
    raise RuntimeError('JWT_SECRET is missing from the environment.')

if not Config.DB_PASSWORD:
    raise RuntimeError('DB_PASSWORD is missing from the environment.')
