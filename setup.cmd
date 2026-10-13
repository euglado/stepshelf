@echo off
cd /d "%~dp0"
node scripts\setup.mjs
if errorlevel 1 echo Setup failed. See README. / Kurulum basarisiz. README dosyasina bakin.
pause
