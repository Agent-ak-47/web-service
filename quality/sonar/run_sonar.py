"""Start the local SonarQube server and send the ATLAS TRIPS analysis.

The scanner needs a user token:
  1. open http://localhost:9000 and sign in with admin / admin,
  2. My Account -> Security -> Generate Tokens,
  3. set SONAR_TOKEN in the shell, then run this script again.

Examples:
  py -3.11 quality/sonar/run_sonar.py
  py -3.11 quality/sonar/run_sonar.py --no-start
  py -3.11 quality/sonar/run_sonar.py --stop
"""

import argparse
import os
import subprocess
import time
import urllib.error
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
COMPOSE_FILE = ROOT / 'quality' / 'sonar' / 'docker-compose.sonar.yml'
STATUS_URL = 'http://localhost:9000/api/system/status'
SCANNER_IMAGE = 'sonarsource/sonar-scanner-cli:latest'
HOST_URL = 'http://host.docker.internal:9000'


def compose(*arguments):
    command = ['docker', 'compose', '-f', str(COMPOSE_FILE), *arguments]
    print(' '.join(command))

    return subprocess.run(command, cwd=ROOT).returncode


def server_is_up():
    try:
        with urllib.request.urlopen(STATUS_URL, timeout=3) as response:
            return b'"status":"UP"' in response.read()
    except (urllib.error.URLError, TimeoutError, OSError):
        return False


def wait_for_server(timeout=240):
    print('Waiting for SonarQube...')
    deadline = time.monotonic() + timeout

    while time.monotonic() < deadline:
        if server_is_up():
            print('SonarQube is up on http://localhost:9000')

            return True

        time.sleep(5)

    print('SonarQube did not become ready in time. Check: docker compose -f quality/sonar/docker-compose.sonar.yml logs sonarqube')

    return False


def scan(token):
    command = [
        'docker', 'run', '--rm',
        '-e', f'SONAR_HOST_URL={HOST_URL}',
        '-e', f'SONAR_TOKEN={token}',
        '-v', f'{ROOT}:/usr/src',
        '-w', '/usr/src',
        SCANNER_IMAGE,
    ]
    print('Running sonar-scanner...')

    return subprocess.run(command).returncode


def main():
    parser = argparse.ArgumentParser(description='SonarQube analysis for ATLAS TRIPS.')
    parser.add_argument('--no-start', action='store_true', help='Only run the scanner.')
    parser.add_argument('--stop', action='store_true', help='Stop and remove the SonarQube stack.')
    args = parser.parse_args()

    if args.stop:
        return compose('down')

    if not args.no_start:
        if compose('up', '-d') != 0:
            return 1

        if not wait_for_server():
            return 1

    token = os.environ.get('SONAR_TOKEN', '').strip()

    if not token:
        print('SONAR_TOKEN is missing. Open http://localhost:9000, generate a token, then set SONAR_TOKEN and rerun.')
        return 2

    return scan(token)


if __name__ == '__main__':
    raise SystemExit(main())
