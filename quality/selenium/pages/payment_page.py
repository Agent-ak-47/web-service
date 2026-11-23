from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from pages.base_page import BasePage


class PaymentPage(BasePage):
    path = '/payment'

    def wait_ready(self):
        self.wait_url('/payment')
        self.wait.until(EC.visibility_of_element_located(
            (By.XPATH, "//h1[normalize-space()='Payment']"),
        ))

        return self

    def pay_with_card(self, holder='QA Tester', number='4242424242424242',
                      expiration='12/28', cvv='123'):
        self.fill('cardHolder', holder)
        self.fill('cardNumber', number)
        self.fill('expiration', expiration)
        self.fill('cvv', cvv)
        self.click_button('Pay')

        return self

    def has_error(self):
        return self.is_visible("//p[contains(@class, 'error-message')]")

    def error_message(self):
        return self.wait_for_text("//p[contains(@class, 'error-message')]")
