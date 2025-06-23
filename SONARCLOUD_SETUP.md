# SonarCloud 配置指南

本项目已配置 SonarCloud 代码质量分析和 GitHub 集成。

## 配置文件

- `sonar-project.properties` - SonarCloud 主配置文件
- `.sonarcloud.properties` - SonarCloud 额外配置
- `.github/workflows/ci.yml` - 完整的 CI/CD 流水线
- `.github/workflows/sonar.yml` - 独立的 SonarCloud 分析工作流

## 设置步骤

### 1. SonarCloud 账户设置

1. 访问 [SonarCloud](https://sonarcloud.io/)
2. 使用 GitHub 账户登录
3. 创建新的组织或使用现有组织
4. 导入 GitHub 仓库

### 2. 获取项目密钥

1. 在 SonarCloud 项目页面，复制项目密钥
2. 更新 `sonar-project.properties` 中的配置：
   ```properties
   sonar.projectKey=your-actual-project-key
   sonar.organization=your-organization-key
   ```

### 3. 配置 GitHub Secrets

在 GitHub 仓库设置中添加以下 Secrets：

- `SONAR_TOKEN`: 从 SonarCloud 获取的令牌
  1. 在 SonarCloud 中：Account → Security → Generate Tokens
  2. 创建新令牌并复制
  3. 在 GitHub 仓库：Settings → Secrets and variables → Actions
  4. 添加新的 repository secret

## 本地使用

### 生成 ESLint 报告
```bash
npm run lint:report
```

### 本地 SonarCloud 分析
```bash
# 需要设置 SONAR_TOKEN 环境变量
export SONAR_TOKEN=your-sonar-token
npm run sonar
