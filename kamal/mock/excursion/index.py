import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from common import serve


PORT = 8084
RESOURCE = 'excursions'

ITEMS = {
    1: {
        'id': 1,
        'title': 'Marrakech medina tour',
        'location': 'Marrakech',
        'description': 'Guided tour of the medina and the souks.',
        'date': '2026-06-06',
        'startTime': '09:00:00',
        'dureeMinutes': 180,
        'capacity': 30,
        'availableSeats': 12,
        'price': 120.00,
        'guide': 'Youssef',
        'imageUrl': 'imgs/sahara/market-berber-rugs.jpeg',
        'available': True,
    },
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
        'imageUrl': 'imgs/palace/riad-courtyard-02.jpeg',
        'available': True,
    },
    3: {
        'id': 3,
        'title': 'Agafay desert excursion',
        'location': 'Marrakech',
        'description': 'Dinner and a show under the stars.',
        'date': '2026-06-07',
        'startTime': '16:00:00',
        'dureeMinutes': 300,
        'capacity': 40,
        'availableSeats': 25,
        'price': 260.00,
        'guide': 'Hassan',
        'imageUrl': 'imgs/sahara/camp-berber-tent.png',
        'available': True,
    },
}


if __name__ == '__main__':
    serve(RESOURCE, ITEMS, PORT)
