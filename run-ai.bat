@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo   [桥见川渝] 正在启动本地 AI 代理...
echo   启动后请在浏览器打开 http://localhost:8000
echo.
python run.py
pause
