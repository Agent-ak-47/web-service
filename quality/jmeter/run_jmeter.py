"""Run the JMeter performance, saturation and chaos plans.

Supports running either locally (if JMeter is on PATH) or inside Docker
(using the `justb4/jmeter:5.5` container image), eliminating the need for local
JMeter installation.
"""

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
JMETER_DIR = ROOT / 'quality' / 'jmeter'
NOMINAL_PLAN = JMETER_DIR / 'atlas-trips.jmx'
CHAOS_PLAN = JMETER_DIR / 'atlas-trips-stress-chaos.jmx'
REPORTS_DIR = ROOT / 'quality' / 'reports' / 'jmeter'
DOCKER_IMAGE = 'justb4/jmeter:5.5'


def find_jmeter(explicit=None):
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


def run_jmeter_local(jmeter_bin, plan_path, report_dir, host=None):
    report_dir.mkdir(parents=True, exist_ok=True)
    results_file = report_dir / 'results.jtl'
    html_dir = report_dir / 'html'

    if html_dir.exists():
        shutil.rmtree(html_dir)

    command = [
        jmeter_bin, '-n', '-t', str(plan_path),
        '-l', str(results_file),
        '-e', '-o', str(html_dir),
    ]

    if host:
        command += ['-Jhost', host]

    print(' '.join(command))
    return subprocess.run(command).returncode


def run_jmeter_docker(docker_bin, image, plan_path, report_dir, host=None):
    report_dir.mkdir(parents=True, exist_ok=True)
    results_file = report_dir / 'results.jtl'
    html_dir = report_dir / 'html'

    if html_dir.exists():
        shutil.rmtree(html_dir)

    effective_host = host if host else 'host.docker.internal'
    plan_name = plan_path.name
    rel_report_dir = report_dir.relative_to(ROOT).as_posix()

    command = [
        docker_bin, 'run', '--rm',
        '-v', f'{JMETER_DIR}:/test:ro',
        '-v', f'{report_dir}:/reports:rw',
        image,
        '-n', '-t', f'/test/{plan_name}',
        '-l', '/reports/results.jtl',
        '-e', '-o', '/reports/html',
        f'-Jhost={effective_host}',
    ]

    print(' '.join(command))
    return subprocess.run(command).returncode


def execute_plan(plan_name, plan_path, sub_report_dir, use_docker, docker_bin, jmeter_bin, image, host):
    print(f'\n=== Running JMeter Plan: {plan_name} ===')
    if use_docker:
        code = run_jmeter_docker(docker_bin, image, plan_path, sub_report_dir, host)
    else:
        code = run_jmeter_local(jmeter_bin, plan_path, sub_report_dir, host)

    if code == 0:
        html_report = sub_report_dir / 'html' / 'index.html'
        print(f'HTML Dashboard: {html_report}')
    else:
        print(f'[FAIL] Plan {plan_name} finished with exit code {code}')
    return code


def main():
    parser = argparse.ArgumentParser(description='Run ATLAS TRIPS JMeter load and chaos plans.')
    parser.add_argument('--jmeter', help='Path to jmeter.bat or jmeter binary (local run).')
    parser.add_argument('--docker', action='store_true', help='Force running JMeter inside Docker container.')
    parser.add_argument('--image', default=DOCKER_IMAGE, help='JMeter Docker image (default: %(default)s).')
    parser.add_argument('--host', help='Override target host (defaults to host.docker.internal in Docker, localhost on host).')
    parser.add_argument('--plan', choices=['nominal', 'chaos', 'all'], default='nominal',
                        help='Which plan to run: nominal (default), chaos (stress & saturation), or all.')
    parser.add_argument('--chaos', action='store_true', help='Shortcut for --plan chaos.')
    args = parser.parse_args()

    plan_choice = 'chaos' if args.chaos else args.plan

    docker_bin = shutil.which('docker')
    jmeter_bin = find_jmeter(args.jmeter)

    use_docker = args.docker
    if not use_docker and not jmeter_bin:
        if docker_bin:
            print('Local JMeter not detected. Automatically using Docker execution.')
            use_docker = True
        else:
            print('Neither local JMeter nor Docker was found. Install Docker Desktop or JMeter.')
            return 2

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    status = 0

    if plan_choice in ('nominal', 'all'):
        code = execute_plan(
            plan_name='Nominal Catalog & Booking',
            plan_path=NOMINAL_PLAN,
            sub_report_dir=REPORTS_DIR / 'nominal',
            use_docker=use_docker,
            docker_bin=docker_bin,
            jmeter_bin=jmeter_bin,
            image=args.image,
            host=args.host
        )
        status |= code

    if plan_choice in ('chaos', 'all'):
        code = execute_plan(
            plan_name='Stress, Saturation and Chaos',
            plan_path=CHAOS_PLAN,
            sub_report_dir=REPORTS_DIR / 'chaos',
            use_docker=use_docker,
            docker_bin=docker_bin,
            jmeter_bin=jmeter_bin,
            image=args.image,
            host=args.host
        )
        status |= code

    return status


if __name__ == '__main__':
    sys.exit(main())
