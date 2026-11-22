"""Run the JMeter performance plan and build the HTML dashboard.

JMeter is not bundled with the project. Point --jmeter to jmeter.bat or add
JMeter's bin directory to PATH.
"""

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PLAN = ROOT / 'quality' / 'jmeter' / 'atlas-trips.jmx'
REPORTS = ROOT / 'quality' / 'reports' / 'jmeter'


def find_jmeter(explicit):
    if explicit:
        return explicit
    found = shutil.which('jmeter')
    if found:
        return found
    if os.name == 'nt':
        candidates = list(Path('C:/').glob('apache-jmeter-*/bin/jmeter.bat'))
        candidates += list(Path(os.environ.get('USERPROFILE', '')).glob('apache-jmeter-*/bin/jmeter.bat'))
        if candidates:
            return str(sorted(candidates)[-1])
    return None


def main():
    parser = argparse.ArgumentParser(description='Run the ATLAS TRIPS JMeter plan.')
    parser.add_argument('--jmeter', help='Path to jmeter.bat (or jmeter on Linux).')
    parser.add_argument('--host', help='Override the target host.')
    args = parser.parse_args()

    jmeter = find_jmeter(args.jmeter)

    if not jmeter:
        print('JMeter was not found. Download it from https://jmeter.apache.org/ and pass --jmeter.')
        return 2

    if REPORTS.exists():
        shutil.rmtree(REPORTS)
    REPORTS.mkdir(parents=True)

    command = [
        jmeter, '-n', '-t', str(PLAN),
        '-l', str(REPORTS / 'results.jtl'),
        '-e', '-o', str(REPORTS / 'html'),
    ]

    if args.host:
        command += ['-Jhost', args.host]

    print(' '.join(command))
    result = subprocess.run(command)

    if result.returncode == 0:
        print(f'Report: {REPORTS / "html" / "index.html"}')

    return result.returncode


if __name__ == '__main__':
    sys.exit(main())
