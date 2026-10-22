@echo off
setlocal

set "ROOT=%~dp0"
set "USER_PY=%ROOT%user\.venv\Scripts\python.exe"
set "RESERVATION_PY=%ROOT%reservation\.venv\Scripts\python.exe"
set "PAYMENT_PY=%ROOT%payment\.venv\Scripts\python.exe"

for %%F in ("%USER_PY%" "%RESERVATION_PY%" "%PAYMENT_PY%") do (
    if not exist "%%~F" (
        echo Missing virtual environment interpreter: %%~F
        echo Run the setup in kamal\README.md section 5.1 first.
        pause
        exit /b 1
    )
)

for %%S in (user reservation payment) do (
    if not exist "%ROOT%%%S\.env" (
        echo Missing %ROOT%%%S\.env - copy .env.example and fill it in.
        pause
        exit /b 1
    )
)

echo Starting mock catalogue services on 8081, 8082 and 8084...
start "Mocks 8081/8082/8084" cmd /k "py -3.11 "%ROOT%mock\run_all.py""

echo Starting user service on 8083...
start "User 8083" cmd /k ""%USER_PY%" "%ROOT%user\index.py""

echo Starting reservation service on 8085...
start "Reservation 8085" cmd /k ""%RESERVATION_PY%" "%ROOT%reservation\index.py""

echo Starting payment service on 8086...
start "Payment 8086" cmd /k ""%PAYMENT_PY%" "%ROOT%payment\index.py""

echo.
echo Started. Health checks:
echo   http://localhost:8081/health
echo   http://localhost:8082/health
echo   http://localhost:8083/health
echo   http://localhost:8084/health
echo   http://localhost:8085/health
echo   http://localhost:8086/health
echo.
pause
