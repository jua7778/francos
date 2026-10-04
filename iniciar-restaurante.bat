@echo off
:: Arranca el sistema de pedidos: base de datos, backend Laravel y la pagina en el puerto 8090.
cd /d "%~dp0"

echo Iniciando base de datos...
docker start restaurante-postgres >nul 2>&1

echo Iniciando servidor (backend)...
start "Restaurante - Backend" /min cmd /k "cd /d "%~dp0backend" && php artisan serve --host=127.0.0.1 --port=8000"

echo Iniciando pagina (puerto 8090)...
start "Restaurante - Pagina" /min cmd /k "cd /d "%~dp0frontend" && npm run restaurante"

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4" ^| findstr "192.168."') do set IP=%%a
set IP=%IP: =%

echo.
echo ================================================
echo   En este computador:  http://localhost:8090
echo   En tablets/celulares: http://%IP%:8090
echo ================================================
echo No cierre las ventanas minimizadas mientras se use el sistema.
timeout /t 6 >nul
start http://localhost:8090
pause
