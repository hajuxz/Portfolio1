@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if not errorlevel 1 (
  node server.mjs
) else (
  if exist "%LOCALAPPDATA%\Programs\Microsoft VS Code\Code.exe" (
    set ELECTRON_RUN_AS_NODE=1
    "%LOCALAPPDATA%\Programs\Microsoft VS Code\Code.exe" server.mjs
  ) else (
    echo Install Node.js 22 or newer to start the publishing server.
  )
)
pause
