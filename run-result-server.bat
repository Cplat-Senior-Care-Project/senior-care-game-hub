@echo off
setlocal

cd /d "%~dp0result-collection-server"

if not exist ".env" (
  if exist ".env.example" (
    copy ".env.example" ".env" >nul
  )
)

echo Result collection server
echo URL: http://127.0.0.1:8787
echo.
node server.js

echo.
pause
