@echo off
chcp 65001 >nul
title DDS 停止脚本

echo ========================================
echo   DDS 视觉设计派单管理系统 - 停止中...
echo ========================================
echo.

echo 正在关闭 Node.js 相关进程...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr "LISTENING" ^| findstr ":3000 :5173"') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo ========================================
echo   服务已停止！
echo ========================================
pause
