from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from pages.base_page import BasePage


class FlightsPage(BasePage):
    path = '/flights'

    def open(self):
        self.goto()
        self.wait.until(EC.visibility_of_element_located(
            (By.XPATH, "//h1[normalize-space()='Flights']"),
        ))
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, 'kz-card')))

        return self

    def book_first_available(self):
        buttons = self.wait.until(EC.presence_of_all_elements_located(
            (By.XPATH, "//kz-card//button[normalize-space()='Book']"),
        ))

        for button in buttons:
            if button.is_enabled() and button.is_displayed():
                self.driver.execute_script(
                    "arguments[0].scrollIntoView({block: 'center'});",
                    button,
                )
                button.click()

                return True

        raise NoSuchElementException('No bookable flight card was found.')
