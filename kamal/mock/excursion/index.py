import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from common import serve


PORT = 8084
RESOURCE = 'excursions'

ITEMS = {
    2: {
        'id': 2,
        'title': 'Bosphorus boat cruise',
        'location': 'Istanbul',
        'description': 'Sunset cruise with buffet.',
        'date': '2026-07-15',
        'startTime': '18:00:00',
        'dureeMinutes': 150,
        'capacity': 80,
        'availableSeats': 41,
        'price': 190.00,
        'guide': 'Selim',
        'available': True,
    },
    3: {
        'id': 3,
        'title': 'Medina food tour',
        'location': 'Marrakech',
        'description': 'Street food walk through the souks.',
        'date': '2026-06-07',
        'startTime': '11:00:00',
        'dureeMinutes': 120,
        'capacity': 20,
        'availableSeats': 0,
        'price': 150.00,
        'guide': 'Yassine',
        'available': True,
    },
}


if __name__ == '__main__':
    serve(RESOURCE, ITEMS, PORT)
