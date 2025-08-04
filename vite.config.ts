import fs from 'node:fs'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'node:url'
import electron from 'vite-plugin-electron/simple'
import renderer from 'vite-plugin-electron-renderer'
import pkg from './package.json'

// 在 ES 模块中正确获取 __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  fs.rmSync('dist-electron', { recursive: true, force: true })

  const isServe = command === 'serve'
  const isBuild = command === 'build'
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG

  // 设置环境变量确保 Electron 能正确启动
  if (isServe) {
    process.env.ELECTRON = '1'
    process.env.NODE_ENV = 'development'
  }

  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    plugins: [
      vue(),
      electron({
        main: {
          // Shortcut of `build.lib.entry`
          entry: 'electron/main/index.ts',
          onstart(args) {
            if (process.env.VSCODE_DEBUG) {
              console.log(/* For `.vscode/.debug.script.mjs` */'[startup] Electron App')
            } else {
              console.log('🚀 Starting Electron in development mode...')
              // 添加延迟，确保 VITE_DEV_SERVER_URL 被正确设置
              // setTimeout(() => {
              //   console.log('🔄 Delayed Electron startup with VITE_DEV_SERVER_URL:', process.env.VITE_DEV_SERVER_URL)
              //   args.startup(['--inspect=5858', '--remote-debugging-port=9222'])
              // }, 2000) // 延迟 1 秒
              // 直接启动，不添加可能冲突的调试参数
              args.startup()
            }
          },
          vite: {
            build: {
              sourcemap,
              minify: isBuild,
              outDir: 'dist-electron/main',
              lib: {
                entry: 'electron/main/index.ts',
                formats: ['es'],
                fileName: () => 'index.js',
              },
              rollupOptions: {
                // Some third-party Node.js libraries may not be built correctly by Vite, especially `C/C++` addons,
                // we can use `external` to exclude them to ensure they work correctly.
                // Others need to put them in `dependencies` to ensure they are collected into `app.asar` after the app is built.
                // Of course, this is not absolute, just this way is relatively simple. :)
                external: Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
                output: {
                  format: 'es',
                },
              },
            },
          },
        },
        preload: {
          // Shortcut of `build.rollupOptions.input`.
          // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
          input: 'electron/preload/index.ts',
          vite: {
            build: {
              sourcemap: sourcemap ? 'inline' : undefined, // #332
              minify: isBuild,
              outDir: 'dist-electron/preload',
              rollupOptions: {
                external: Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
              },
            },
          },
        },
        // Ployfill the Electron and Node.js API for Renderer process.
        // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
        // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
        renderer: process.env.NODE_ENV === 'test'
          ? // https://github.com/electron-vite/vite-plugin-electron-renderer/issues/78#issuecomment-2053600808
          undefined
          : {},
      }),
      renderer({
        resolve: {
          serialport: { type: 'cjs' },
          got: { type: 'esm' },
        },
      }),
    ],
    server: {
      port: 5173,
      host: '127.0.0.1',
      strictPort: false, // 允许端口自动切换，确保能够启动
      // 在开发模式下启用热重载
      hmr: {
        port: 5174,
      },
      // 自动打开浏览器（仅在非 Electron 环境下）
      open: !process.env.ELECTRON,
    },
    clearScreen: false,
    base: './',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          // 确保资源文件使用相对路径
          assetFileNames: 'assets/[name]-[hash][extname]',
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
        },
      },
    },
    // 新增配置以确保 index.html 被正确构建
    optimizeDeps: {
      include: ['electron'],
    },
  }
})
