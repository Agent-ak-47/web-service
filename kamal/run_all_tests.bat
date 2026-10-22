@echo off
setlocal

set "ROOT=%~dp0"
set "FAILED="

for %%S in (user reservation payment) do (
    echo.
    echo === %%S ===
    py -3.11 "%ROOT%%%S\run_tests.py"
    if errorlevel 1 set "FAILED=1"
)

if defined FAILED (
    echo.
    echo Some service suites failed.
    exit /b 1
)

echo.
echo All service suites passed.
exit /b 0
