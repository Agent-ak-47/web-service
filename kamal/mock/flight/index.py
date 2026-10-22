import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from common import serve


PORT = 8081
RESOURCE = 'flights'

ITEMS = {
    4: {
        'id': 4,
        'airline': 'Royal Air Maroc',
        'flightNumber': 'RAM205',
        'departureCity': 'Casablanca',
        'arrivalCity': 'Marrakech',
        'departureDate': '2026-06-05T07:30:00Z',
        'arrivalDate': '2026-06-05T08:30:00Z',
        'availableSeats': 60,
        'totalSeats': 150,
        'price': 890.00,
        'active': True,
    },
    5: {
        'id': 5,
        'airline': 'Air Arabia',
        'flightNumber': '3O342',
        'departureCity': 'Fes',
        'arrivalCity': 'Paris',
        'departureDate': '2026-06-12T09:00:00Z',
        'arrivalDate': '2026-06-12T12:15:00Z',
        'availableSeats': 2,
        'totalSeats': 180,
        'price': 1450.00,
        'active': True,
    },
}


if __name__ == '__main__':
    serve(RESOURCE, ITEMS, PORT)
