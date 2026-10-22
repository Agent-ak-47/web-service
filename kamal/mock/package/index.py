import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from common import serve


PORT = 8082
RESOURCE = 'packages'

ITEMS = {
    1: {
        'id': 1,
        'name': 'Marrakech escape',
        'description': '3 nights, full board and a visit of the medina.',
        'destination': 'Marrakech',
        'duration': 3,
        'price': 2400.00,
        'discountPercentage': 10.00,
        'promoPrice': 2160.00,
        'startDate': '2026-06-01',
        'endDate': '2026-09-30',
        'available': True,
        'composition': {
            'flights': [
                {
                    'id': 4,
                    'airline': 'Royal Air Maroc',
                    'flightNumber': 'RAM205',
                    'departureCity': 'Casablanca',
                    'arrivalCity': 'Marrakech',
                    'departureTime': '2026-06-05T07:30:00Z',
                    'arrivalTime': '2026-06-05T08:30:00Z',
                    'totalSeats': 150,
                    'availableSeats': 60,
                    'price': 890.00,
                    'position': 1,
                },
            ],
            'excursions': [
                {
                    'id': 2,
                    'title': 'Marrakech medina tour',
                    'location': 'Marrakech',
                    'date': '2026-06-06',
                    'startTime': '09:00',
                    'dureeMinutes': 180,
                    'capacity': 30,
                    'availableSeats': 12,
                    'price': 120.00,
                    'position': 1,
                },
            ],
        },
    },
    2: {
        'id': 2,
        'name': 'Istanbul discovery',
        'description': '4 nights with guided visits.',
        'destination': 'Istanbul',
        'duration': 4,
        'price': 3200.00,
        'discountPercentage': 0.00,
        'promoPrice': 3200.00,
        'startDate': '2026-07-01',
        'endDate': '2026-08-31',
        'available': False,
        'composition': {'flights': [], 'excursions': []},
    },
}


if __name__ == '__main__':
    serve(RESOURCE, ITEMS, PORT)
