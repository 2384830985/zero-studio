#!/bin/bash

# 代码质量检查脚本
# 用于在提交前进行完整的质量检查

echo "🔍 开始代码质量检查..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check_command() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1 通过${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 失败${NC}"
        return 1
    fi
}

# 1. TypeScript 类型检查
echo -e "\n${YELLOW}📝 运行 TypeScript 类型检查...${NC}"
npm run type-check
check_command "TypeScript 类型检查"
TYPE_CHECK=$?

# 2. ESLint 检查
echo -e "\n${YELLOW}🔧 运行 ESLint 检查...${NC}"
npm run lint:check
check_command "ESLint 检查"
LINT_CHECK=$?

# 3. 构建测试
echo -e "\n${YELLOW}🏗️ 运行构建测试...${NC}"
npm run build
check_command "构建测试"
BUILD_CHECK=$?

# 4. 生成 ESLint 报告
echo -e "\n${YELLOW}📊 生成 ESLint 报告...${NC}"
npm run lint:report
check_command "ESLint 报告生成"
REPORT_CHECK=$?

# 总结
echo -e "\n${YELLOW}📋 质量检查总结:${NC}"
TOTAL_ERRORS=0

if [ $TYPE_CHECK -ne 0 ]; then
    echo -e "${RED}❌ TypeScript 类型检查失败${NC}"
    TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
fi

if [ $LINT_CHECK -ne 0 ]; then
    echo -e "${RED}❌ ESLint 检查失败${NC}"
    TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
fi

if [ $BUILD_CHECK -ne 0 ]; then
    echo -e "${RED}❌ 构建测试失败${NC}"
    TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
fi

if [ $TOTAL_ERRORS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 所有检查都通过！代码质量良好，可以提交。${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️ 发现 $TOTAL_ERRORS 个问题，请修复后再提交。${NC}"
    echo -e "${YELLOW}💡 提示: 运行 'npm run lint' 可以自动修复部分问题${NC}"
    exit 1
fi
