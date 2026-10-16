@echo off
start "" /b powershell.exe -NoProfile -STA -WindowStyle Hidden -ExecutionPolicy Bypass -File "%~dp0folio-desktop.ps1"
exit /b
