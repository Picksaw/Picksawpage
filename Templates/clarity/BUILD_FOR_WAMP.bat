@echo off
echo === Storm Blade - Build for WAMP ===
echo.
echo This will build dist/index.html
echo.
where npm >nul 2>nul
if %errorlevel% neq 0 (
  echo ERROR: Node.js not found!
  echo Install it from https://nodejs.org - LTS version
  echo Then run this again.
  pause
  exit /b
)

echo Installing dependencies...
call npm install

echo Building game...
call npm run build

echo.
echo === BUILD DONE ===
echo Your game is at: dist\index.html
echo.
echo To put on WAMP:
echo 1. Copy dist\index.html to C:\wamp64\www\stormblade\index.html
echo 2. Open http://localhost/stormblade/
echo.
pause
