"""Run an OWASP ZAP baseline scan through Docker.

The baseline scan is passive: it spiders the frontend and reports missing
security headers, exposed files and similar low-risk findings. It does not
perform destructive active attacks.
"""

import argparse
import shutil
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
ZAP_DIR = ROOT / 'quality' / 'zap'
REPORTS = ROOT / 'quality' / 'reports' / 'zap'
IMAGE = 'ghcr.io/zaproxy/zaproxy:stable'
DEFAULT_TARGET = 'http://host.docker.internal:4200'


def is_reachable(url):
    try:
        with urllib.request.urlopen(url, timeout=5):
            return True
    except (urllib.error.URLError, OSError):
        return False


def main():
    parser = argparse.ArgumentParser(description='Run the OWASP ZAP baseline scan.')
    parser.add_argument('--target', default=DEFAULT_TARGET,
                        help='Target URL as seen from the ZAP container.')
    parser.add_argument('--minutes', type=int, default=2, help='Spider time limit.')
    parser.add_argument('--image', default=IMAGE, help='ZAP Docker image.')
    parser.add_argument('--fail-on-warn', action='store_true',
                        help='Return a non-zero code when warnings are found.')
    args = parser.parse_args()

    docker = shutil.which('docker')

    if docker is None:
        print('Docker is required to run ZAP. Install Docker Desktop and retry.')
        return 2

    if not is_reachable(args.target.replace('host.docker.internal', 'localhost')):
        print(f'The target is not reachable at {args.target}. Start the frontend first.')
        return 2

    REPORTS.mkdir(parents=True, exist_ok=True)

    command = [
        docker, 'run', '--rm',
        '-v', f'{ZAP_DIR}:/zap/config:ro',
        '-v', f'{REPORTS}:/zap/wrk:rw',
        args.image,
        'zap-baseline.py',
        '-t', args.target,
        '-c', '/zap/config/zap-baseline.conf',
        '-m', str(args.minutes),
        '-r', 'zap-report.html',
        '-J', 'zap-report.json',
        '-w', 'zap-report.md',
    ]

    if not args.fail_on_warn:
        command.append('-I')

    print(' '.join(command))
    result = subprocess.run(command)

    print(f'Reports: {REPORTS}')

    return result.returncode


if __name__ == '__main__':
    sys.exit(main())
