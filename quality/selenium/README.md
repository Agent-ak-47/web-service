# Selenium — end-to-end UI tests

The suite drives a real browser against the Angular frontend. Selenium Manager
(bundled with Selenium 4.6+) downloads the matching browser driver on first run.

## Install

```powershell
py -3.11 -m pip install -r quality/selenium/requirements.txt
```

## Run

Start the frontend and the backend stack first, then:

```powershell
py -3.11 quality/selenium/run_selenium.py
```

Useful options:

```powershell
py -3.11 quality/selenium/run_selenium.py --browser firefox
py -3.11 quality/selenium/run_selenium.py --headed
py -3.11 quality/selenium/run_selenium.py --url http://localhost:4200
```

The HTML report is written to `quality/reports/selenium/report.html` when
`pytest-html` is installed.

## Coverage

| Test | Flow |
|------|------|
| `test_home_page_loads` | home page and Angular root |
| `test_sign_in_page_exposes_credentials_fields` | email/password fields |
| `test_bad_credentials_show_an_error` | error popup |
| `test_client_can_sign_in_and_open_bookings` | client login + `/profile/reservations` |
| `test_admin_can_sign_in_and_open_bookings` | admin login + `/admin/reservations` |
| `test_payment_without_a_booking_shows_the_empty_state` | `/payment` empty state |
| `test_client_books_and_pays_a_flight` | book a flight, pay, land on bookings |
| `test_declined_card_keeps_the_booking_unpaid` | declined card (`4000 0000 0000 0002`) |

Selectors live in `pages/` (page object model). Environment variables:
`FRONTEND_URL`, `SELENIUM_BROWSER` (`chrome`/`firefox`), `SELENIUM_HEADLESS`
(`0` to show the window), `SELENIUM_TIMEOUT`.

> The booking tests create reservations and payments in the database. Run them
> against a disposable database or reset the seed afterwards.
