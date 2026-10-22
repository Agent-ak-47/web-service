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

echo.
if defined FAILED (
    echo Some service suites failed.
) else (
    echo All service suites passed.
)

echo Close this window when you are done.
cmd /k
if defined FAILED exit /b 1
exit /b 0
