import os
from urllib.parse import urlparse

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


BASE_URL = os.getenv('FRONTEND_URL', 'http://localhost:4200').rstrip('/')
TIMEOUT = int(os.getenv('SELENIUM_TIMEOUT', '15'))


class BasePage:
    path = '/'

    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, TIMEOUT)

    def goto(self, path=None):
        self.driver.get(f'{BASE_URL}{path if path is not None else self.path}')

        return self

    def by_name(self, name):
        return self.wait.until(EC.visibility_of_element_located((By.NAME, name)))

    def fill(self, name, value):
        element = self.by_name(name)
        element.clear()
        element.send_keys(value)

        return element

    def click_button(self, label):
        button = self.wait.until(EC.element_to_be_clickable(
            (By.XPATH, f"//button[normalize-space()='{label}']"),
        ))
        button.click()

        return button

    def wait_for_text(self, xpath):
        element = self.wait.until(EC.visibility_of_element_located((By.XPATH, xpath)))

        return element.text.strip()

    def wait_url(self, fragment):
        self.wait.until(lambda current: fragment in current.current_url)

        return self.driver.current_url

    def wait_path(self, path):
        self.wait.until(lambda current: urlparse(current.current_url).path == path)

        return self.driver.current_url

    def is_visible(self, xpath):
        elements = self.driver.find_elements(By.XPATH, xpath)

        return bool(elements) and elements[0].is_displayed()
