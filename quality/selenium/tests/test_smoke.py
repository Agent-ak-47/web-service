from pages.admin_reservations_page import AdminReservationsPage
from pages.base_page import BASE_URL
from pages.payment_page import PaymentPage
from pages.reservations_page import ReservationsPage
from pages.sign_in_page import SignInPage


CLIENT_EMAIL = 'client@agency.travel'
ADMIN_EMAIL = 'admin@agency.travel'
PASSWORD = 'Password123!'


def test_home_page_loads(driver):
    driver.get(BASE_URL)

    assert 'Atlas Trips' in driver.title
    assert driver.find_element('css selector', 'kz-root').is_displayed()


def test_sign_in_page_exposes_credentials_fields(driver):
    page = SignInPage(driver).open()

    assert page.by_name('email').is_displayed()
    assert page.by_name('password').is_displayed()


def test_bad_credentials_show_an_error(driver):
    page = SignInPage(driver).open()
    page.sign_in(CLIENT_EMAIL, 'not-the-password')

    assert page.has_error()
    assert page.error_message()


def test_client_can_sign_in_and_open_bookings(driver):
    page = SignInPage(driver).open()
    page.sign_in(CLIENT_EMAIL, PASSWORD)
    page.wait_path('/')

    ReservationsPage(driver).open()

    assert 'My bookings' in driver.page_source


def test_admin_can_sign_in_and_open_bookings(driver):
    page = SignInPage(driver).open()
    page.sign_in(ADMIN_EMAIL, PASSWORD)
    page.wait_path('/admin')

    AdminReservationsPage(driver).open()

    assert 'Bookings' in driver.page_source


def test_payment_without_a_booking_shows_the_empty_state(driver):
    sign_in = SignInPage(driver).open()
    sign_in.sign_in(CLIENT_EMAIL, PASSWORD)
    sign_in.wait_path('/')

    driver.get(f'{BASE_URL}/payment')
    payment = PaymentPage(driver).wait_ready()

    assert payment.wait_for_text("//div[contains(@class, 'kz-empty')]") == 'No booking to pay for now.'
