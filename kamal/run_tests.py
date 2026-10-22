import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SERVICES = ('user', 'reservation', 'payment')


def interpreter(service):
    venv = ROOT / service / '.venv'

    for candidate in (venv / 'Scripts' / 'python.exe', venv / 'bin' / 'python'):
        if candidate.exists():
            return str(candidate)

    raise SystemExit(f'Missing virtual environment: {venv}')


def main():
    failed = []

    for service in SERVICES:
        print(f'\n=== {service} ===', flush=True)
        result = subprocess.run(
            [interpreter(service), '-m', 'pytest'],
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
