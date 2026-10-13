@echo off
cd /d "%~dp0"
call npm run build
if errorlevel 1 goto end
call npm start
:end
pause
