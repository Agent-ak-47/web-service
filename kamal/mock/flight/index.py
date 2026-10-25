import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from common import serve


PORT = 8081
RESOURCE = 'flights'

ITEMS = {
    1: {
        'id': 1,
        'airline': 'Royal Air Maroc',
        'flightNumber': 'RAM101',
        'departureCity': 'Casablanca',
        'arrivalCity': 'Paris',
        'departureTime': '2026-06-01T08:00:00Z',
        'arrivalTime': '2026-06-01T11:00:00Z',
        'availableSeats': 150,
        'totalSeats': 180,
        'price': 2450.00,
        'imageUrl': 'imgs/palace/ancient-palace-01.jpeg',
        'active': True,
    },
    2: {
        'id': 2,
        'airline': 'Royal Air Maroc',
        'flightNumber': 'RAM205',
        'departureCity': 'Casablanca',
        'arrivalCity': 'Marrakech',
        'departureTime': '2026-06-05T07:30:00Z',
        'arrivalTime': '2026-06-05T08:30:00Z',
        'availableSeats': 60,
        'totalSeats': 150,
        'price': 890.00,
        'imageUrl': 'imgs/palace/ancient-palace-03.jpeg',
        'active': True,
    },
    3: {
        'id': 3,
        'airline': 'Air France',
        'flightNumber': 'AF1714',
        'departureCity': 'Paris',
        'arrivalCity': 'Istanbul',
        'departureTime': '2026-07-12T14:00:00Z',
        'arrivalTime': '2026-07-12T18:30:00Z',
        'availableSeats': 95,
        'totalSeats': 160,
        'price': 1980.00,
        'imageUrl': 'imgs/palace/riad-upper-view-02.jpeg',
        'active': True,
    },
    4: {
        'id': 4,
        'airline': 'Turkish Airlines',
        'flightNumber': 'TK1826',
        'departureCity': 'Marrakech',
        'arrivalCity': 'Istanbul',
        'departureTime': '2026-07-14T09:15:00Z',
        'arrivalTime': '2026-07-14T14:45:00Z',
        'availableSeats': 22,
        'totalSeats': 140,
        'price': 2150.00,
        'imageUrl': 'imgs/palace/riad-upper-view-03.jpeg',
        'active': True,
    },
}


if __name__ == '__main__':
    serve(RESOURCE, ITEMS, PORT)
