@echo off
:: Permite que tablets y celulares de la red local abran el sistema en el puerto 8090.
:: Se ejecuta una sola vez. Pide permiso de administrador.
net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -NoProfile -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)
netsh advfirewall firewall delete rule name="Restaurante Pedidos (8090)" >nul 2>&1
netsh advfirewall firewall add rule name="Restaurante Pedidos (8090)" dir=in action=allow protocol=TCP localport=8090 profile=any
echo.
echo Listo. El puerto 8090 quedo abierto para la red local.
pause
