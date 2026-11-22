"""Run the Selenium end-to-end suite against the Angular frontend."""

import argparse
import importlib.util
import os
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SUITE = ROOT / 'quality' / 'selenium'
REPORTS = ROOT / 'quality' / 'reports' / 'selenium'
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:4200')


def is_reachable(url):
    try:
        with urllib.request.urlopen(url, timeout=5):
            return True
    except (urllib.error.URLError, OSError):
        return False


def main():
    parser = argparse.ArgumentParser(description='Run the ATLAS TRIPS Selenium suite.')
    parser.add_argument('--browser', choices=['chrome', 'firefox'], default='chrome')
    parser.add_argument('--headed', action='store_true', help='Show the browser window.')
    parser.add_argument('--url', default=FRONTEND_URL, help='Frontend base URL.')
    args = parser.parse_args()

    if importlib.util.find_spec('selenium') is None:
        print('Selenium is missing. Run: py -3.11 -m pip install -r quality/selenium/requirements.txt')
        return 2

    if not is_reachable(args.url):
        print(f'The frontend is not reachable at {args.url}. Start it first.')
        return 2

    REPORTS.mkdir(parents=True, exist_ok=True)

    environment = os.environ.copy()
    environment['FRONTEND_URL'] = args.url
    environment['SELENIUM_BROWSER'] = args.browser
    environment['SELENIUM_HEADLESS'] = '0' if args.headed else '1'

    command = [sys.executable, '-m', 'pytest', '-v', '--tb=short']

    if importlib.util.find_spec('pytest_html') is not None:
        command += [
            f'--html={REPORTS / "report.html"}',
            '--self-contained-html',
        ]

    print(' '.join(command))
    result = subprocess.run(command, cwd=SUITE, env=environment)

    if result.returncode == 0 and importlib.util.find_spec('pytest_html') is not None:
        print(f'Report: {REPORTS / "report.html"}')

    return result.returncode


if __name__ == '__main__':
    sys.exit(main())
