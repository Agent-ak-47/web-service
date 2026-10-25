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
        'imageUrl': 'imgs/palace/ancient-palace-01.jpeg',
        'available': True,
        'composition': {
            'flights': [
                {
                    'id': 2,
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
                    'id': 1,
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
                {
                    'id': 3,
                    'title': 'Agafay desert excursion',
                    'location': 'Marrakech',
                    'date': '2026-06-07',
                    'startTime': '16:00',
                    'dureeMinutes': 300,
                    'capacity': 40,
                    'availableSeats': 25,
                    'price': 260.00,
                    'position': 2,
                },
            ],
        },
    },
    2: {
        'id': 2,
        'name': 'Istanbul wonders',
        'description': '5 nights, 4-star hotel and historical tours.',
        'destination': 'Istanbul',
        'duration': 5,
        'price': 6200.00,
        'discountPercentage': 0.00,
        'promoPrice': 6200.00,
        'startDate': '2026-06-15',
        'endDate': '2026-10-15',
        'imageUrl': 'imgs/palace/riad-upper-view-01.jpeg',
        'available': True,
        'composition': {
            'flights': [
                {
                    'id': 3,
                    'airline': 'Air France',
                    'flightNumber': 'AF1714',
                    'departureCity': 'Paris',
                    'arrivalCity': 'Istanbul',
                    'departureTime': '2026-07-12T14:00:00Z',
                    'arrivalTime': '2026-07-12T18:30:00Z',
                    'totalSeats': 160,
                    'availableSeats': 95,
                    'price': 1980.00,
                    'position': 1,
                },
                {
                    'id': 4,
                    'airline': 'Turkish Airlines',
                    'flightNumber': 'TK1826',
                    'departureCity': 'Marrakech',
                    'arrivalCity': 'Istanbul',
                    'departureTime': '2026-07-14T09:15:00Z',
                    'arrivalTime': '2026-07-14T14:45:00Z',
                    'totalSeats': 140,
                    'availableSeats': 22,
                    'price': 2150.00,
                    'position': 2,
                },
            ],
            'excursions': [
                {
                    'id': 2,
                    'title': 'Bosphorus boat cruise',
                    'location': 'Istanbul',
                    'date': '2026-07-15',
                    'startTime': '18:00',
                    'dureeMinutes': 150,
                    'capacity': 80,
                    'availableSeats': 41,
                    'price': 190.00,
                    'position': 1,
                },
            ],
        },
    },
}


if __name__ == '__main__':
    serve(RESOURCE, ITEMS, PORT)
