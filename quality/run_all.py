"""Run several quality campaigns and summarise their exit codes.

External tools keep their own prerequisites (Docker, Newman, JMeter, Snyk token,
Sonar token). See quality/README.md.
"""

import argparse
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PYTHON = sys.executable

CAMPAIGNS = {
    'coverage': [PYTHON, 'quality/coverage/run_coverage.py', '--python', '--node', '--frontend'],
    'java': [PYTHON, 'quality/coverage/run_coverage.py', '--java'],
    'postman': [PYTHON, 'quality/postman/run_newman.py'],
    'selenium': [PYTHON, 'quality/selenium/run_selenium.py'],
    'jmeter': [PYTHON, 'quality/jmeter/run_jmeter.py'],
    'zap': [PYTHON, 'quality/zap/run_zap.py'],
    'snyk': [PYTHON, 'quality/snyk/run_snyk.py'],
    'sonar': [PYTHON, 'quality/sonar/run_sonar.py'],
}

GROUPS = {
    'coverage': ['coverage'],
    'dynamic': ['postman', 'selenium', 'jmeter'],
    'security': ['zap', 'snyk'],
    'static': ['java', 'sonar'],
    'all': ['coverage', 'java', 'postman', 'selenium', 'jmeter', 'zap', 'snyk', 'sonar'],
}


def run(name):
    command = CAMPAIGNS[name]
    print(f'\n=== {name} ===')
    print(' '.join(command))
    result = subprocess.run(command, cwd=ROOT)

    return name, result.returncode


def main():
    parser = argparse.ArgumentParser(description='Run the ATLAS TRIPS quality campaigns.')
    parser.add_argument('--coverage', action='store_true', help='Coverage.py + Istanbul (Python, Node, frontend).')
    parser.add_argument('--java', action='store_true', help='JUnit, JaCoCo and Checkstyle.')
    parser.add_argument('--postman', action='store_true', help='Postman collection through Newman.')
    parser.add_argument('--selenium', action='store_true', help='Selenium end-to-end suite.')
    parser.add_argument('--jmeter', action='store_true', help='JMeter performance plan.')
    parser.add_argument('--zap', action='store_true', help='OWASP ZAP baseline scan.')
    parser.add_argument('--snyk', action='store_true', help='Snyk dependency and code scans.')
    parser.add_argument('--sonar', action='store_true', help='SonarQube analysis.')
    parser.add_argument('--dynamic', action='store_true', help='Postman, Selenium and JMeter.')
    parser.add_argument('--security', action='store_true', help='ZAP and Snyk.')
    parser.add_argument('--all', action='store_true', help='Every campaign.')
    args = parser.parse_args()

    selected = [name for name in CAMPAIGNS if getattr(args, name, False)]

    for group in ('dynamic', 'security', 'all'):
        if getattr(args, group, False):
            selected.extend(GROUPS[group])

    if not selected:
        parser.print_help()
        return 1

    ordered = list(dict.fromkeys(selected))
    results = [run(name) for name in ordered]

    print('\n=== Summary ===')
    for name, code in results:
        print(f'{name:10} {"OK" if code == 0 else f"FAILED ({code})"}')

    return 0 if all(code == 0 for _, code in results) else 1


if __name__ == '__main__':
    sys.exit(main())
