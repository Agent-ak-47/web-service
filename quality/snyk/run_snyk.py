"""Run Snyk open-source and code scans on every project of the repository.

Snyk is a SaaS scanner: the CLI must be installed and authenticated once with
`snyk auth`. No token is stored in the repository.
"""

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
REPORTS = ROOT / 'quality' / 'reports' / 'snyk'
PROJECTS = [
    ROOT / 'frontend',
    ROOT / 'kamal',
    ROOT / 'marwan' / 'backend',
    ROOT / 'mohammed' / 'backend',
    ROOT / 'package-service',
]


def run(command):
    print(' '.join(command))
    return subprocess.run(command, cwd=ROOT).returncode


def main():
    parser = argparse.ArgumentParser(description='Run Snyk on the ATLAS TRIPS projects.')
    parser.add_argument('--severity', default='medium',
                        choices=['low', 'medium', 'high', 'critical'])
    parser.add_argument('--skip-code', action='store_true', help='Skip the Snyk Code (SAST) scan.')
    args = parser.parse_args()

    snyk = shutil.which('snyk')

    if snyk is None:
        print('Snyk CLI is missing. Run: npm install -g snyk')
        return 2

    REPORTS.mkdir(parents=True, exist_ok=True)

    failures = []

    open_source_json = REPORTS / 'snyk-open-source.json'
    code = run([
        snyk, 'test', '--all-projects',
        f'--severity-threshold={args.severity}',
        f'--json-file-output={open_source_json}',
    ])

    if code not in (0, 1):
        failures.append('open-source')

    if not args.skip_code:
        code_json = REPORTS / 'snyk-code.json'
        code = run([
            snyk, 'code', 'test', '--all-projects',
            f'--severity-threshold={args.severity}',
            f'--json-file-output={code_json}',
        ])

        if code not in (0, 1):
            failures.append('code')

    summary = {
        'projects': [str(path.relative_to(ROOT)) for path in PROJECTS],
        'severity_threshold': args.severity,
        'failed_scans': failures,
    }
    (REPORTS / 'summary.json').write_text(json.dumps(summary, indent=2), encoding='utf-8')

    print(f'Reports: {REPORTS}')

    return 2 if failures else 0


if __name__ == '__main__':
    sys.exit(main())
