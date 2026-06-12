@echo off
chcp 65001 >nul
title DDS 启动脚本

echo ========================================
echo   DDS 视觉设计派单管理系统 - 启动中...
echo ========================================
echo.

echo [1/2] 启动后端服务 (端口 3000)...
start "DDS-后端" cmd /k "cd /d %~dp0backend && node server.js"

timeout /t 3 /nobreak >nul

echo [2/2] 启动前端服务 (端口 5173)...
start "DDS-前端" cmd /k "cd /d %~dp0frontend && npx vite --port 5173"

echo.
echo ========================================
echo   启动完成！
echo   本机访问: http://localhost:5173
echo ========================================
echo.
pause
