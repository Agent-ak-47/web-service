from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from pages.base_page import BasePage


class ReservationsPage(BasePage):
    path = '/profile/reservations'

    def open(self):
        self.goto()
        self.wait_ready()

        return self

    def wait_ready(self):
        self.wait.until(EC.visibility_of_element_located(
            (By.XPATH, "//h1[normalize-space()='My bookings']"),
        ))

        return self

    def rows(self):
        self.wait.until(lambda current: (
            current.find_elements(By.CSS_SELECTOR, '.kz-table tbody tr')
            or current.find_elements(By.CSS_SELECTOR, '.kz-empty')
        ))

        return self.driver.find_elements(By.CSS_SELECTOR, '.kz-table tbody tr')
