from pages.flights_page import FlightsPage
from pages.payment_page import PaymentPage
from pages.reservations_page import ReservationsPage
from pages.sign_in_page import SignInPage


CLIENT_EMAIL = 'client@agency.travel'
PASSWORD = 'Password123!'


def test_client_books_and_pays_a_flight(driver):
    sign_in = SignInPage(driver).open()
    sign_in.sign_in(CLIENT_EMAIL, PASSWORD)
    sign_in.wait_path('/')

    flights = FlightsPage(driver).open()
    flights.book_first_available()

    payment = PaymentPage(driver).wait_ready()
    payment.pay_with_card()

    payment.wait_url('/profile/reservations')

    reservations = ReservationsPage(driver)
    reservations.wait_ready()

    assert len(reservations.rows()) > 0


def test_declined_card_keeps_the_booking_unpaid(driver):
    sign_in = SignInPage(driver).open()
    sign_in.sign_in(CLIENT_EMAIL, PASSWORD)
    sign_in.wait_path('/')

    flights = FlightsPage(driver).open()
    flights.book_first_available()

    payment = PaymentPage(driver).wait_ready()
    payment.pay_with_card(number='4000000000000002')

    assert payment.has_error()
    assert 'declined' in payment.error_message().lower()
