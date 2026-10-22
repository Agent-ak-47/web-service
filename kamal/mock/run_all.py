import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SERVICES = ('flight', 'package', 'excursion')


def main():
    processes = [
        subprocess.Popen([sys.executable, str(ROOT / service / 'index.py')])
        for service in SERVICES
    ]

    try:
        for process in processes:
            process.wait()
    except KeyboardInterrupt:
        for process in processes:
            process.terminate()

        for process in processes:
            process.wait()

    return 0


if __name__ == '__main__':
    raise SystemExit(main())
