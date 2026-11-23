import os

import pytest
from selenium import webdriver


BROWSER = os.getenv('SELENIUM_BROWSER', 'chrome').lower()
HEADLESS = os.getenv('SELENIUM_HEADLESS', '1') != '0'


def build_driver():
    if BROWSER == 'firefox':
        options = webdriver.FirefoxOptions()
        if HEADLESS:
            options.add_argument('-headless')
        driver = webdriver.Firefox(options=options)
    else:
        options = webdriver.ChromeOptions()
        if HEADLESS:
            options.add_argument('--headless=new')
        options.add_argument('--window-size=1440,1000')
        options.add_argument('--disable-gpu')
        options.add_argument('--no-sandbox')
        driver = webdriver.Chrome(options=options)

    driver.set_page_load_timeout(30)

    return driver


@pytest.fixture()
def driver():
    instance = build_driver()
    instance.delete_all_cookies()
    yield instance
    instance.quit()
