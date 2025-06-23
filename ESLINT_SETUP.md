# ESLint 配置和提交校验

本项目已配置了 ESLint 代码检查和提交前校验。

## 配置文件

- `.eslintrc.cjs` - ESLint 配置文件
- `.husky/pre-commit` - Git 提交前钩子
- `package.json` 中的 `lint-staged` 配置

## 可用命令

```bash
# 检查代码风格问题
npm run lint:check

# 自动修复可修复的问题
npm run lint

# 手动运行 lint-staged
npx lint-staged
```

## 规则说明

### Vue 相关规则
- 允许单词组件名称
- 检查未使用的变量
- 允许多个根元素（Vue 3）

### TypeScript 相关规则
- 检查未使用的变量
- 警告使用 `any` 类型
- 不强制函数返回类型注解

### 通用规则
- 警告 `console` 语句
- 禁止 `debugger`
- 强制使用 `const`
- 禁止使用 `var`
- 强制使用严格相等 `===`
- 强制使用大括号

### 代码风格
- 2 空格缩进
- 单引号
- 不使用分号
- 多行时使用尾随逗号

## 提交校验

每次 `git commit` 时会自动运行 ESLint 检查：
- 只检查暂存的文件
- 自动修复可修复的问题
- 如果有错误，提交会被阻止
- 修复错误后可以重新提交

## Electron 特殊配置

`electron/` 目录下的文件有特殊配置：
- 允许使用 `console.log`
- 提供 Node.js 全局变量支持

## 忽略文件

以下目录会被忽略：
- `dist/`
- `dist-*/`
- `node_modules/`
- `.git/`
