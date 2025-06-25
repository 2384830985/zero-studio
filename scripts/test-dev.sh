#!/bin/bash

# 测试开发环境启动脚本

echo "🧪 测试开发环境启动..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查必要的文件
echo -e "${BLUE}检查项目文件...${NC}"

if [ ! -f "vite.config.ts" ]; then
    echo -e "${RED}❌ vite.config.ts 文件不存在${NC}"
    exit 1
fi

if [ ! -f "electron/main/index.ts" ]; then
    echo -e "${RED}❌ electron/main/index.ts 文件不存在${NC}"
    exit 1
fi

if [ ! -f "electron/preload/index.ts" ]; then
    echo -e "${RED}❌ electron/preload/index.ts 文件不存在${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 项目文件检查通过${NC}"

# 检查依赖
echo -e "${BLUE}检查依赖...${NC}"

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️ node_modules 不存在，正在安装依赖...${NC}"
    npm install
fi

echo -e "${GREEN}✅ 依赖检查通过${NC}"

# 清理旧的构建文件
echo -e "${BLUE}清理构建文件...${NC}"
rm -rf dist-electron

# 编译 Electron 代码
echo -e "${BLUE}编译 Electron 代码...${NC}"
npm run compile:electron

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Electron 编译成功${NC}"
else
    echo -e "${RED}❌ Electron 编译失败${NC}"
    exit 1
fi

# 提示用户
echo -e "\n${GREEN}🎉 准备工作完成！${NC}"
echo -e "${BLUE}现在你可以运行以下命令启动开发环境:${NC}"
echo -e "  ${YELLOW}npm run dev${NC}          # 启动 Vite + Electron"
echo -e "  ${YELLOW}npm run dev:manual${NC}   # 使用手动启动方式"

echo -e "\n${BLUE}如果遇到问题，请检查:${NC}"
echo -e "  1. Node.js 版本 (当前: $(node --version))"
echo -e "  2. 端口 5173 是否被占用"
echo -e "  3. Electron 进程是否正常启动"

echo -e "\n${YELLOW}按 Ctrl+C 可以停止开发服务器${NC}"
