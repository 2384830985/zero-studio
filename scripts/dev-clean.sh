#!/bin/bash

# 清理可能占用的端口
echo "🧹 清理端口占用..."

# 清理函数
cleanup_port() {
    local port=$1
    local pids=$(lsof -ti :$port 2>/dev/null)
    if [ ! -z "$pids" ]; then
        echo "发现端口 $port 被占用，正在清理..."
        echo "$pids" | xargs kill -9 2>/dev/null
        sleep 1
        # 再次检查
        local remaining=$(lsof -ti :$port 2>/dev/null)
        if [ ! -z "$remaining" ]; then
            echo "强制清理端口 $port..."
            echo "$remaining" | xargs kill -9 2>/dev/null
        fi
    fi
}

# 清理相关端口
cleanup_port 5173
cleanup_port 5174
cleanup_port 5858
cleanup_port 9222

# 清理可能的 Electron 和 Vite 进程
echo "清理相关进程..."
pkill -f "vite" 2>/dev/null || true
pkill -f "electron" 2>/dev/null || true

echo "✅ 端口清理完成"

# 等待一下确保端口完全释放
sleep 2

# 启动开发环境
echo "🚀 启动开发环境..."
cross-env NODE_ENV=development ELECTRON=1 vite
