# 🎭 zero studio

一个基于 Electron + Vue 3 + TypeScript 构建的现代化桌面应用程序，集成了 AI 对话、文档处理和多种实用工具。

## ✨ 特性

- 🚀 **现代化技术栈**: Electron + Vue 3 + TypeScript + Vite
- 🎨 **美观界面**: 基于 Ant Design Vue 的现代化 UI
- 🤖 **AI 集成**: 支持多种 AI 模型和对话功能
- 📝 **文档处理**: Markdown 渲染、代码高亮、Mermaid 图表
- 🔧 **开发友好**: 热重载、TypeScript 支持、ESLint 代码规范
- 📦 **跨平台**: 支持 Windows、macOS、Linux
- 🔄 **自动化**: GitHub Actions 自动构建和发布

## 🛠️ 技术栈

### 前端框架
- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全的 JavaScript
- **Vite** - 快速的构建工具
- **Ant Design Vue** - 企业级 UI 组件库

### 桌面应用
- **Electron** - 跨平台桌面应用框架
- **electron-builder** - 应用打包和分发

### AI 和数据处理
- **LangChain** - AI 应用开发框架
- **OpenAI** - GPT 模型集成
- **Ollama** - 本地 AI 模型运行

### 文档和渲染
- **Markdown-it** - Markdown 解析器
- **Highlight.js** - 代码语法高亮
- **Mermaid** - 图表和流程图渲染

### 状态管理和工具
- **Pinia** - Vue 状态管理
- **Axios** - HTTP 客户端
- **Express** - 后端服务器

## 📋 系统要求

- **Node.js**: >= 22.12.0
- **Yarn**: 推荐使用 Yarn 作为包管理器
- **操作系统**: Windows 10+, macOS 10.15+, Ubuntu 18.04+

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/2384830985/zero-studio.git
cd zero-studio
```

### 2. 安装依赖

```bash
# 使用 Yarn (推荐)
yarn install

# 或使用 npm
npm install
```

### 3. 配置环境变量

创建环境配置文件：

```bash
# 开发环境
cp .env.local.example .env.local

# 生产环境
cp .env.pro.example .env.pro
```

编辑配置文件，添加必要的 API 密钥和配置。

### 4. 启动开发服务器

```bash
# 启动开发模式
yarn dev

# 或者手动启动
yarn dev:manual
```

## 📦 构建和打包

### 开发构建

```bash
# 编译 TypeScript
yarn compile:electron

# 构建前端
yarn build

# 完整构建
yarn electron:build
```

### 生产构建

```bash
# 构建所有平台
yarn build

# 构建特定平台
yarn build:win     # Windows
yarn build:mac     # macOS
yarn build:linux   # Linux
```

## 🚢 发布版本

### 使用交互式脚本（推荐）

```bash
yarn release
```

### 使用快捷命令

```bash
# 补丁版本 (1.0.0 -> 1.0.1)
yarn release:patch

# 次要版本 (1.0.0 -> 1.1.0)
yarn release:minor

# 主要版本 (1.0.0 -> 2.0.0)
yarn release:major
```

### 手动发布

```bash
# 创建标签
git tag v1.0.0

# 推送标签（触发自动构建）
git push origin v1.0.0
```

## 🔧 开发指南

### 项目结构

```
big-brother-studio/
├── electron/                 # Electron 主进程代码
│   ├── main/                # 主进程
│   ├── preload/             # 预加载脚本
│   └── tsconfig.json        # TypeScript 配置
├── src/                     # Vue 前端代码
│   ├── components/          # 组件
│   ├── views/              # 页面
│   ├── stores/             # Pinia 状态管理
│   └── main.ts             # 入口文件
├── public/                  # 静态资源
├── scripts/                 # 构建脚本
├── .github/workflows/       # GitHub Actions
└── dist/                   # 构建输出
```

### 开发命令

```bash
# 开发模式
yarn dev                    # 启动开发服务器
yarn dev:clean             # 清理后启动
yarn dev:manual            # 手动启动模式

# 构建相关
yarn build                 # 完整构建
yarn compile:electron      # 编译 Electron
yarn compile:electron:watch # 监听模式编译

# 代码质量
yarn lint                  # 修复代码风格
yarn lint:check           # 检查代码风格
yarn type-check           # TypeScript 类型检查

# 测试
yarn test:dev             # 开发测试

# 工具
yarn cleanup              # 清理项目
yarn sonar                # 代码质量分析
```

### 环境变量

#### 开发环境 (`.env.local`)
```env
NODE_ENV=development
ELECTRON=1
VITE_DEV_SERVER_URL=http://localhost:5173
MCP_SERVER_PORT=3000
```

#### 生产环境 (`.env.pro`)
```env
NODE_ENV=production
ELECTRON=1
```

## 🤝 贡献指南

1. **Fork** 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 **Pull Request**

### 代码规范

- 使用 **ESLint** 进行代码检查
- 遵循 **TypeScript** 类型安全
- 提交前会自动运行 **lint-staged** 检查
- 使用 **Husky** 进行 Git hooks 管理

## 📄 许可证

本项目采用自定义的 [Big Brother Studio 许可证](LICENSE)。

### 许可证摘要

- ✅ **个人使用**: 完全免费，无任何限制
- ✅ **学习研究**: 允许用于学习、研究目的
- ✅ **开源项目**: 可以在开源项目中使用
- ✅ **修改分发**: 允许修改和分发
- ❌ **商业使用**: 需要获得明确的书面授权

如需商业使用，请通过 GitHub Issues 或邮件联系获取授权。

### 💼 商业授权

如果你想在商业环境中使用本软件，我们提供灵活的商业授权方案：

**什么情况需要商业授权？**
- 在公司或企业环境中部署使用
- 作为商业产品的一部分进行销售
- 为客户提供基于本软件的付费服务
- 在盈利性项目中使用

**如何获取商业授权？**
1. 通过 [GitHub Issues](https://github.com/2384830985/zero-studio/issues) 创建授权申请
2. 发送邮件至：[764506248@qq.com]
3. 说明你的使用场景和需求

**授权优势**
- 🔒 法律保护和合规使用
- 🛠️ 技术支持和咨询服务
- 🚀 优先获得新功能和更新
- 📞 直接联系开发团队

## 🔗 相关链接

- [Electron 文档](https://www.electronjs.org/docs)
- [Vue 3 文档](https://vuejs.org/)
- [Ant Design Vue](https://antdv.com/)
- [TypeScript 文档](https://www.typescriptlang.org/)
- [Vite 文档](https://vitejs.dev/)

## 📞 支持

如果你遇到任何问题或有建议，请：

1. 查看 [Issues](https://github.com/2384830985/zero-studio/issues)
2. 创建新的 [Issue](https://github.com/2384830985/zero-studio/issues/new)
3. 参考项目文档：
   - [开发指南](DEVELOPMENT_GUIDE.md)
   - [发布指南](RELEASE_GUIDE.md)
   - [调试指南](ELECTRON_DEBUG_GUIDE.md)

## 🎉 致谢

感谢所有为这个项目做出贡献的开发者！

---

<div align="center">
  <p>如果这个项目对你有帮助，请给它一个 ⭐️</p>
  <p>Made with ❤️ by the Big Brother Studio Team</p>
</div>
