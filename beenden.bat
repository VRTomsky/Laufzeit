@echo off
title Laufzeit beenden
rem Stoppt nur den Laufzeit-Server auf Port 5741, keine anderen Python-Programme.
powershell -NoProfile -Command "$c = Get-NetTCPConnection -LocalPort 5741 -State Listen -ErrorAction SilentlyContinue; if ($c) { $c | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }; 'Laufzeit wurde beendet.' } else { 'Laufzeit lief gerade nicht.' }"
echo.
echo Beim naechsten Anmelden startet Laufzeit wieder automatisch.
echo Sofort wieder starten: start.bat doppelklicken.
pause
