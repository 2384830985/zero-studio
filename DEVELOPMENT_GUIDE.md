# 🚀 开发指南

## 快速开始

现在你只需要一个简单的命令就可以启动完整的开发环境：

```bash
npm run dev
```

这个命令 (`cross-env NODE_ENV=development ELECTRON=1 vite`) 会：
- 设置开发环境变量 (NODE_ENV=development, ELECTRON=1)
- 启动 Vite 开发服务器 (端口 5173)
- 自动编译 Electron 主进程和预加载脚本
- 启动 Electron 应用
- 启用热重载和调试功能

## 可用的开发命令

```bash
# 🎯 主要开发命令
npm run dev              # 启动完整开发环境 (推荐)

# 🔧 备用和调试命令
npm run test:dev         # 测试开发环境准备情况
npm run dev:manual       # 手动启动方式 (如果自动方式有问题)
npm run electron:dev     # 等同于 npm run dev
npm run electron:serve   # 使用 concurrently 的启动方式

# 📝 代码质量
npm run type-check       # TypeScript 类型检查
npm run lint            # ESLint 检查和自动修复
npm run quality-check   # 完整质量检查

# 🏗️ 构建相关
npm run build           # 构建生产版本
npm run electron:build  # 构建 Electron 应用
npm run preview         # 预览构建结果
```

## 开发环境配置

### Vite 开发服务器
- **端口**: 5173
- **主机**: 127.0.0.1
- **热重载端口**: 5174
- **自动重载**: ✅ 启用

### Electron 调试
- **主进程调试端口**: 5858
- **远程调试端口**: 9222
- **开发者工具**: 自动启用

## 项目结构

```
big-brother-studio/
├── src/                 # Vue 前端代码
│   ├── components/      # Vue 组件
│   ├── types/          # TypeScript 类型定义
│   └── App.vue         # 主应用组件
├── electron/           # Electron 相关代码
│   ├── main/           # 主进程代码
│   └── preload/        # 预加载脚本
├── dist/               # 前端构建输出
├── dist-electron/      # Electron 构建输出
└── vite.config.ts      # Vite 配置文件
```

## 开发工作流

1. **启动开发环境**
   ```bash
   npm run dev
   ```

2. **编辑代码**
   - Vue 组件会自动热重载
   - Electron 主进程修改需要重启应用
   - TypeScript 类型检查实时进行

3. **调试**
   - 前端：使用浏览器开发者工具
   - Electron 主进程：连接到端口 5858
   - 渲染进程：使用 Electron 内置开发者工具

4. **代码质量检查**
   ```bash
   npm run quality-check
   ```

5. **构建测试**
   ```bash
   npm run build
   ```

## 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 检查端口占用
   lsof -i :5173
   lsof -i :5174
   
   # 杀死占用进程
   kill -9 <PID>
   ```

2. **Electron 启动失败**
   ```bash
   # 首先运行测试脚本检查环境
   npm run test:dev
   
   # 使用手动启动方式
   npm run dev:manual
   
   # 清理构建缓存
   rm -rf dist-electron
   npm run dev
   ```

3. **Node.js 版本兼容性**
   ```bash
   # 检查 Node.js 版本
   node --version
   
   # 项目要求 Node.js >= 22.12.0
   # 当前使用 16.20.0 可能导致构建问题
   ```

4. **依赖问题**
   ```bash
   # 重新安装依赖
   rm -rf node_modules package-lock.json
   npm install
   ```

### 调试技巧

1. **启用详细日志**
   ```bash
   DEBUG=vite:* npm run dev
   ```

2. **Electron 主进程调试**
   - 在 Chrome 中访问 `chrome://inspect`
   - 连接到 `127.0.0.1:5858`

3. **渲染进程调试**
   - 在 Electron 应用中按 `Ctrl+Shift+I` (Windows/Linux) 或 `Cmd+Option+I` (Mac)

## 环境变量

开发环境支持以下环境变量：

```bash
# 开发模式
NODE_ENV=development

# Vite 开发服务器 URL
VITE_DEV_SERVER_URL=http://127.0.0.1:5173

# VS Code 调试模式
VSCODE_DEBUG=1

# SonarCloud Token (本地分析)
SONAR_TOKEN=your-token-here
```

## 性能优化

1. **热重载优化**
   - 只修改 Vue 组件时无需重启 Electron
   - 使用 HMR 端口 5174 进行快速更新

2. **构建优化**
   - 开发模式启用 sourcemap
   - 生产模式启用代码压缩

3. **调试优化**
   - 启用 Electron 调试端口
   - 支持远程调试功能

## 下一步

- 🔧 升级 Node.js 到 22.12.0+ 以获得最佳兼容性
- 🧪 添加单元测试和 E2E 测试
- 📦 配置自动化部署流程
- 🔍 集成更多代码质量工具

现在你可以享受简化的开发体验了！🎉
