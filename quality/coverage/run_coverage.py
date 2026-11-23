"""Run the coverage campaign for every language of the project.

Python      : Coverage.py through pytest-cov
JavaScript  : Istanbul through @vitest/coverage-istanbul (frontend) and c8 (Node services)
Java        : JaCoCo through Maven (supports local JDK or Docker eclipse-temurin:25-jdk)

Every report is written under quality/reports/coverage/.
"""

import argparse
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
REPORTS = ROOT / 'quality' / 'reports' / 'coverage'
NPM = shutil.which('npm') or 'npm'
PYTHON_SERVICES = ('user', 'reservation', 'payment')
NODE_SERVICES = {
    'flight': ROOT / 'mohammed' / 'backend',
    'excursion': ROOT / 'marwan' / 'backend',
}


def run(command, cwd, label):
    print(f'\n=== {label} ===')
    print(' '.join(str(part) for part in command))

    result = subprocess.run(command, cwd=cwd)

    if result.returncode != 0:
        print(f'[FAIL] {label} (exit {result.returncode})')

    return result.returncode


def python_interpreter(service):
    candidates = (
        ROOT / 'kamal' / service / '.venv' / 'Scripts' / 'python.exe',
        ROOT / 'kamal' / service / '.venv' / 'bin' / 'python',
    )

    for candidate in candidates:
        if candidate.exists():
            return candidate

    return Path(sys.executable)


def python_coverage():
    status = 0

    for service in PYTHON_SERVICES:
        service_dir = ROOT / 'kamal' / service
        xml = REPORTS / f'python-{service}.xml'
        html = REPORTS / f'html-python-{service}'
        status |= run([
            str(python_interpreter(service)),
            '-m', 'pytest',
            '--cov=controls',
            '--cov=helpers',
            '--cov=models',
            '--cov=config',
            '--cov=index',
            '--cov-report=term-missing',
            f'--cov-report=xml:{xml}',
            f'--cov-report=html:{html}',
            '-q',
        ], service_dir, f'Coverage.py - {service}')

    mock_xml = REPORTS / 'python-mock.xml'
    mock_html = REPORTS / 'html-python-mock'
    status |= run([
        str(python_interpreter('reservation')),
        '-m', 'pytest', 'kamal/mock/tests',
        '--cov=kamal/mock',
        '--cov-report=term-missing',
        f'--cov-report=xml:{mock_xml}',
        f'--cov-report=html:{mock_html}',
        '-q',
    ], ROOT, 'Coverage.py - mocks')

    return status


def node_coverage():
    status = 0

    for service, service_dir in NODE_SERVICES.items():
        status |= run(
            [NPM, 'run', 'test:coverage'],
            service_dir,
            f'Istanbul (c8) - {service}',
        )

    return status


def frontend_coverage():
    status = run(
        [NPM, 'run', 'test:coverage'],
        ROOT / 'frontend',
        'Istanbul - Angular frontend',
    )
    source = ROOT / 'frontend' / 'coverage' / 'lcov.info'
    target = REPORTS / 'frontend-lcov.info'

    if source.exists():
        REPORTS.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, target)

    return status


def check_local_java_version():
    java = shutil.which('java')
    if not java:
        return 0
    try:
        output = subprocess.check_output([java, '-version'], stderr=subprocess.STDOUT, text=True)
        match = re.search(r'version\s+"(\d+)', output)
        if match:
            return int(match.group(1))
    except Exception:
        pass
    return 0


def java_coverage_docker():
    docker = shutil.which('docker')
    if not docker:
        print('[FAIL] Docker is required to run package-service tests under JDK 25.')
        return 2

    m2_cache = Path.home() / '.m2'
    m2_cache.mkdir(parents=True, exist_ok=True)
    pkg_dir = (ROOT / 'package-service').resolve()

    command = [
        docker, 'run', '--rm',
        '-v', f'{pkg_dir}:/workspace',
        '-v', f'{m2_cache}:/root/.m2',
        '-w', '/workspace',
        'eclipse-temurin:25-jdk',
        'sh', '-c', "sed -i 's/\r$//' mvnw && chmod +x mvnw && ./mvnw -B -q verify"
    ]
    return run(command, ROOT / 'package-service', 'JaCoCo + Checkstyle + JUnit (Docker JDK 25) - package-service')


def java_coverage_local():
    wrapper = 'mvnw.cmd' if os.name == 'nt' else 'mvnw'
    maven = ROOT / 'package-service' / wrapper
    command = [str(maven), '-q', 'verify']

    if not maven.exists():
        command = ['mvn.cmd' if os.name == 'nt' else 'mvn', '-q', 'verify']

    return run(command, ROOT / 'package-service', 'JaCoCo + Checkstyle + JUnit (Local) - package-service')


def java_coverage(use_docker=False):
    local_version = check_local_java_version()

    if use_docker or local_version != 25:
        if shutil.which('docker'):
            print(f'Local Java version is {local_version} (package-service requires JDK 25).')
            print('Executing Maven verify inside Docker (eclipse-temurin:25-jdk)...')
            return java_coverage_docker()
        elif local_version != 25:
            print(f'[WARN] Local Java version is {local_version}, but JDK 25 is required and Docker is not available.')

    return java_coverage_local()


def main():
    parser = argparse.ArgumentParser(description='Coverage campaign for ATLAS TRIPS.')
    parser.add_argument('--python', action='store_true', help='Coverage.py on the Flask services.')
    parser.add_argument('--node', action='store_true', help='Istanbul (c8) on the Node services.')
    parser.add_argument('--frontend', action='store_true', help='Istanbul on the Angular app.')
    parser.add_argument('--java', action='store_true', help='JaCoCo, Checkstyle and JUnit on package-service.')
    parser.add_argument('--docker', action='store_true', help='Force Docker execution for Java (JDK 25).')
    parser.add_argument('--all', action='store_true', help='Run every language.')
    args = parser.parse_args()

    if not any((args.python, args.node, args.frontend, args.java, args.all)):
        parser.print_help()
        return 1

    REPORTS.mkdir(parents=True, exist_ok=True)

    status = 0

    if args.all or args.python:
        status |= python_coverage()

    if args.all or args.node:
        status |= node_coverage()

    if args.all or args.frontend:
        status |= frontend_coverage()

    if args.all or args.java:
        status |= java_coverage(use_docker=args.docker)

    print(f'\nReports: {REPORTS}')
    print('Coverage campaign finished.' if status == 0 else 'Coverage campaign finished with failures.')

    return status


if __name__ == '__main__':
    raise SystemExit(main())
