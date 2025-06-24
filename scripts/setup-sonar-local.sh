#!/bin/bash

# SonarCloud 本地设置脚本

echo "🔧 SonarCloud 本地环境设置"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查是否已存在 .env.local
if [ -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️ .env.local 文件已存在${NC}"
    echo -e "${BLUE}当前内容:${NC}"
    cat .env.local
    echo ""
    read -p "是否要覆盖现有文件? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}取消操作${NC}"
        exit 0
    fi
fi

# 提示用户输入 SONAR_TOKEN
echo -e "${BLUE}请输入你的 SonarCloud Token:${NC}"
echo -e "${YELLOW}(从 SonarCloud 获取的认证令牌)${NC}"
read -p "SONAR_TOKEN: " SONAR_TOKEN

if [ -z "$SONAR_TOKEN" ]; then
    echo -e "${RED}❌ SONAR_TOKEN 不能为空${NC}"
    exit 1
fi

# 创建 .env.local 文件
cat > .env.local << EOF
# SonarCloud 本地配置
# 此文件不会被提交到 Git

# SonarCloud Token
SONAR_TOKEN=$SONAR_TOKEN

# 其他环境变量
NODE_ENV=development
EOF

echo -e "${GREEN}✅ .env.local 文件创建成功${NC}"

# 验证设置
echo -e "\n${BLUE}验证设置...${NC}"
source .env.local

if [ -n "$SONAR_TOKEN" ]; then
    echo -e "${GREEN}✅ SONAR_TOKEN 设置成功${NC}"
else
    echo -e "${RED}❌ SONAR_TOKEN 设置失败${NC}"
    exit 1
fi

# 提示下一步操作
echo -e "\n${GREEN}🎉 设置完成！${NC}"
echo -e "${BLUE}现在你可以运行:${NC}"
echo -e "  ${YELLOW}npm run sonar${NC}          # 运行 SonarCloud 分析"
echo -e "  ${YELLOW}npm run quality-check${NC}  # 完整质量检查"

# 提醒 GitHub 设置
echo -e "\n${YELLOW}📝 别忘了在 GitHub 仓库中设置 SONAR_TOKEN Secret:${NC}"
echo -e "  1. 进入 GitHub 仓库 Settings"
echo -e "  2. 选择 Secrets and variables → Actions"
echo -e "  3. 添加 SONAR_TOKEN 并粘贴你的令牌"
