from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from pages.base_page import BasePage


class SignInPage(BasePage):
    path = '/sign-in'

    def open(self):
        self.goto()
        self.wait.until(EC.visibility_of_element_located((By.NAME, 'email')))

        return self

    def sign_in(self, email, password):
        self.fill('email', email)
        self.fill('password', password)
        self.click_button('Sign in')

        return self

    def error_message(self):
        return self.wait_for_text("//p[contains(@class, 'error-message')]")

    def has_error(self):
        return self.is_visible("//p[contains(@class, 'error-message')]")
