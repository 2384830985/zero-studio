# 🚀 项目快速参考

## SonarCloud Token 配置

⚠️ **安全提醒**: Token 应该通过环境变量或 GitHub Secrets 设置，不要在代码中明文存储！

### 快速设置命令

```bash
# 自动设置本地环境（会提示输入 Token）
npm run sonar:setup

# 手动设置环境变量
export SONAR_TOKEN=your-actual-sonar-token

# 运行 SonarCloud 分析
npm run sonar
```

### GitHub Secret 设置

1. 进入 GitHub 仓库 → **Settings**
2. 选择 **Secrets and variables** → **Actions**
3. 点击 **New repository secret**
4. 添加:
   - **Name**: `SONAR_TOKEN`
   - **Value**: `你的实际 SonarCloud Token`

## 常用命令

```bash
# 代码质量检查
npm run lint:check          # ESLint 检查
npm run lint                # ESLint 自动修复
npm run type-check          # TypeScript 类型检查
npm run quality-check       # 完整质量检查

# SonarCloud
npm run sonar:setup         # 设置本地环境
npm run sonar               # 运行分析
npm run lint:report         # 生成 ESLint 报告

# 构建和开发
npm run dev                 # 开发模式
npm run build               # 构建项目
```

## 文件说明

- `SONAR_TOKEN_SETUP.md` - Token 安全配置详细说明
- `SONARCLOUD_SETUP.md` - SonarCloud 完整设置指南
- `ESLINT_SETUP.md` - ESLint 配置说明
- `.env.example` - 环境变量示例
- `.env.local` - 本地环境变量（不提交到 Git）

## 安全提醒 ⚠️

- ✅ Token 已安全配置为环境变量
- ✅ 敏感文件已添加到 .gitignore
- ❌ 不要在代码中硬编码 Token
- ❌ 不要将 .env.local 提交到 Git
