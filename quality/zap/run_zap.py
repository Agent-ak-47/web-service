"""Run OWASP ZAP security scans through Docker.

Supports:
  - Baseline scan (passive spider + low-risk checks)
  - Full / Active scan (intrusive penetration testing, fuzzing, attack rules)
  - API scan (active testing against OpenAPI/REST endpoints)
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
        check_url = url.replace('host.docker.internal', 'localhost')
        with urllib.request.urlopen(check_url, timeout=5):
            return True
    except (urllib.error.URLError, OSError):
        return False


def build_zap_command(docker, image, scan_script, target, conf_file, report_prefix,
                      minutes=2, ajax=False, fail_on_warn=False, extra_args=None):
    command = [
        docker, 'run', '--rm',
        '-v', f'{ZAP_DIR}:/zap/config:ro',
        '-v', f'{REPORTS}:/zap/wrk:rw',
        image,
        scan_script,
        '-t', target,
        '-m', str(minutes),
        '-r', f'{report_prefix}.html',
        '-J', f'{report_prefix}.json',
        '-w', f'{report_prefix}.md',
    ]

    if conf_file and (ZAP_DIR / conf_file).exists():
        command.extend(['-c', f'/zap/config/{conf_file}'])

    if ajax:
        command.append('-j')

    if not fail_on_warn:
        command.append('-I')

    if extra_args:
        command.extend(extra_args)

    return command


def run_scan(docker, image, scan_script, target, conf_file, report_prefix,
             minutes=2, ajax=False, fail_on_warn=False, extra_args=None):
    command = build_zap_command(
        docker=docker,
        image=image,
        scan_script=scan_script,
        target=target,
        conf_file=conf_file,
        report_prefix=report_prefix,
        minutes=minutes,
        ajax=ajax,
        fail_on_warn=fail_on_warn,
        extra_args=extra_args
    )
    print(f"\n--- Running ZAP {scan_script} on {target} ---")
    print(' '.join(command))
    result = subprocess.run(command)
    return result.returncode


def main():
    parser = argparse.ArgumentParser(description='Run OWASP ZAP dynamic security scans via Docker.')
    parser.add_argument('--target', default=DEFAULT_TARGET,
                        help='Target URL as seen from the ZAP container (default: %(default)s).')
    parser.add_argument('--mode', choices=['baseline', 'active', 'api'], default='baseline',
                        help='Scan mode: baseline (passive), active (intrusive / full attack), or api.')
    parser.add_argument('--active', action='store_true',
                        help='Shortcut for active / intrusive penetration scan (same as --mode active).')
    parser.add_argument('--minutes', type=int, default=2, help='Spider time limit in minutes.')
    parser.add_argument('--ajax', action='store_true', help='Use Ajax Spider for modern SPA (Angular).')
    parser.add_argument('--image', default=IMAGE, help='ZAP Docker image.')
    parser.add_argument('--fail-on-warn', action='store_true',
                        help='Return non-zero code when warnings are found.')
    args = parser.parse_args()

    docker = shutil.which('docker')
    if docker is None:
        print('Docker is required to run ZAP. Install Docker Desktop and retry.')
        return 2

    if not is_reachable(args.target):
        print(f'The target is not reachable at {args.target}. Start the frontend/backend stack first.')
        return 2

    REPORTS.mkdir(parents=True, exist_ok=True)

    mode = 'active' if args.active else args.mode

    if mode == 'active':
        scan_script = 'zap-full-scan.py'
        conf_file = 'zap-full.conf' if (ZAP_DIR / 'zap-full.conf').exists() else 'zap-baseline.conf'
        report_prefix = 'zap-active-report'
    elif mode == 'api':
        scan_script = 'zap-api-scan.py'
        conf_file = 'zap-baseline.conf'
        report_prefix = 'zap-api-report'
    else:
        scan_script = 'zap-baseline.py'
        conf_file = 'zap-baseline.conf'
        report_prefix = 'zap-report'

    code = run_scan(
        docker=docker,
        image=args.image,
        scan_script=scan_script,
        target=args.target,
        conf_file=conf_file,
        report_prefix=report_prefix,
        minutes=args.minutes,
        ajax=args.ajax,
        fail_on_warn=args.fail_on_warn
    )

    print(f'\nReports generated in: {REPORTS}')
    print(f'HTML report: {REPORTS / (report_prefix + ".html")}')

    return code


if __name__ == '__main__':
    sys.exit(main())
