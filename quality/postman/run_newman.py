"""Run the Postman collection with Newman (the Postman CLI).

Newman is optional; the collection can also be imported in the Postman desktop app.
Install Newman with: npm install -g newman
"""

import argparse
import shutil
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
COLLECTION = ROOT / 'quality' / 'postman' / 'ATLAS-TRIPS.postman_collection.json'
ENVIRONMENT = ROOT / 'quality' / 'postman' / 'ATLAS-TRIPS.postman_environment.json'
REPORTS = ROOT / 'quality' / 'reports' / 'postman'


def main():
    parser = argparse.ArgumentParser(description='Run the ATLAS TRIPS Postman collection.')
    parser.add_argument('--html', action='store_true', help='Also write an HTML report (newman-reporter-htmlextra).')
    args = parser.parse_args()

    newman = shutil.which('newman')

    if newman is None:
        print('Newman is not installed. Run: npm install -g newman')
        return 2

    REPORTS.mkdir(parents=True, exist_ok=True)
    command = [
        newman, 'run', str(COLLECTION),
        '-e', str(ENVIRONMENT),
        '--reporters', 'cli,json',
        '--reporter-json-export', str(REPORTS / 'newman-report.json'),
        '--timeout-request', '10000',
        '--delay-request', '200',
    ]

    if args.html:
        command.extend(['--reporters', 'cli,json,htmlextra'])

    print(' '.join(command))
    result = subprocess.run(command)

    return result.returncode


if __name__ == '__main__':
    raise SystemExit(main())
