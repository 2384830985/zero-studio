# SonarCloud Token 配置指南

## ⚠️ 重要安全提醒

**绝对不要将 SonarCloud Token 直接写入代码或配置文件中！**

你提供的密钥 `6968f766926e8defb63ba6517ba9a72b45c6dec0` 应该作为 **SONAR_TOKEN** 环境变量或 GitHub Secret 使用。

## 正确的配置方式

### 1. GitHub Actions 配置（推荐）

在 GitHub 仓库中设置 Secret：

1. 进入 GitHub 仓库页面
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**
4. 设置：
   - **Name**: `SONAR_TOKEN`
   - **Secret**: `6968f766926e8defb63ba6517ba9a72b45c6dec0`
5. 点击 **Add secret**

### 2. 本地开发配置

创建本地环境变量文件（不要提交到 Git）：

```bash
# 创建 .env.local 文件（已在 .gitignore 中）
echo "SONAR_TOKEN=6968f766926e8defb63ba6517ba9a72b45c6dec0" > .env.local
```

或者直接在终端中设置：

```bash
# macOS/Linux
export SONAR_TOKEN=6968f766926e8defb63ba6517ba9a72b45c6dec0

# Windows
set SONAR_TOKEN=6968f766926e8defb63ba6517ba9a72b45c6dec0
```

### 3. 本地运行 SonarCloud 分析

```bash
# 设置环境变量后运行
npm run sonar

# 或者一次性设置并运行
SONAR_TOKEN=6968f766926e8defb63ba6517ba9a72b45c6dec0 npm run sonar
```

## 验证配置

### 检查 GitHub Secret 是否设置成功

1. 推送代码到 GitHub
2. 查看 Actions 页面的工作流运行情况
3. 如果 SonarCloud 分析成功运行，说明配置正确

### 本地验证

```bash
# 检查环境变量是否设置
echo $SONAR_TOKEN

# 运行本地分析
npm run sonar
```

## 安全最佳实践

1. ✅ **使用 GitHub Secrets** 存储敏感信息
2. ✅ **使用环境变量** 进行本地开发
3. ✅ **将 .env.local 添加到 .gitignore**
4. ❌ **不要在代码中硬编码密钥**
5. ❌ **不要在配置文件中明文存储密钥**
6. ❌ **不要将密钥提交到版本控制系统**

## 故障排除

如果遇到认证问题：

1. 确认 SONAR_TOKEN 是否正确设置
2. 检查 Token 是否有效（可能已过期）
3. 确认项目密钥和组织密钥是否正确
4. 查看 GitHub Actions 日志获取详细错误信息
