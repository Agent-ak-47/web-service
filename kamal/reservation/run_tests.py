import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def interpreter():
    venv = ROOT / '.venv'

    for candidate in (venv / 'Scripts' / 'python.exe', venv / 'bin' / 'python'):
        if candidate.exists():
            return str(candidate)

    raise SystemExit(f'Missing virtual environment: {venv}')


def main():
    result = subprocess.run(
        [interpreter(), '-m', 'pytest', *sys.argv[1:]],
        cwd=ROOT,
    )

    return result.returncode


if __name__ == '__main__':
    raise SystemExit(main())
