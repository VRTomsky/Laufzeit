@echo off
title Laufzeit
cd /d "%~dp0"
where python >nul 2>nul
if %errorlevel%==0 (
    python server.py
) else (
    where py >nul 2>nul
    if %errorlevel%==0 (
        py -3 server.py
    ) else (
        echo Python wurde nicht gefunden.
        echo Installiere Python von python.org und setze beim Installieren den Haken bei "Add python.exe to PATH".
    )
)
pause
