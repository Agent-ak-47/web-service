import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SERVICES = ('user', 'reservation', 'payment')


def main():
    failed = []

    for service in SERVICES:
        print(f'\n=== {service} ===', flush=True)
        result = subprocess.run(
            [sys.executable, '-m', 'pytest'],
            cwd=ROOT / service,
        )

        if result.returncode != 0:
            failed.append(service)

    if failed:
        print(f'\nFailed suites: {", ".join(failed)}')

        return 1

    print('\nAll service suites passed.')

    return 0


if __name__ == '__main__':
    raise SystemExit(main())
