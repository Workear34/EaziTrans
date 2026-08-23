# GitHub Pages 自动部署 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 推送 `v*` tag 时通过 GitHub Actions 自动构建并发布到 GitHub Pages（`https://workear34.github.io/EaziTrans/`）。

**Architecture:** `vite.config.js` 通过环境变量 `DEPLOY_BASE_PATH` 条件设置 base 路径；新增 `.github/workflows/deploy.yml`，在 tag 推送时用官方 Pages Actions（configure-pages / upload-pages-artifact / deploy-pages）构建并部署。

**Tech Stack:** Vite 8、GitHub Actions（actions/checkout@v4、actions/setup-node@v4、actions/configure-pages@v5、actions/upload-pages-artifact@v3、actions/deploy-pages@v4）

## Global Constraints

- 触发条件：仅 `v*` 格式 tag 推送，不触发于分支推送。
- 本地开发与本地构建行为不变：未设置 `DEPLOY_BASE_PATH` 时 base 保持 `'/'`。
- 部署子路径固定为 `/EaziTrans/`。
- 项目无测试框架与 lint 工具，验证方式为构建产物检查。

---

### Task 1: Vite base 路径条件配置

**Files:**
- Modify: `vite.config.js`

**Interfaces:**
- Consumes: 无
- Produces: 环境变量 `DEPLOY_BASE_PATH`（字符串），CI workflow 在 Task 2 中依赖此变量名。

- [ ] **Step 1: 修改 vite.config.js 添加条件 base**

在 `export default defineConfig({...})` 中加入 `base` 字段：

```js
import { defineConfig } from 'vite';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig({
  base: process.env.DEPLOY_BASE_PATH || '/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        settings: fileURLToPath(new URL('./settings.html', import.meta.url)),
      },
    },
  },
});
```

- [ ] **Step 2: 回归验证——不带变量构建**

Run: `npm run build`
Expected: 构建成功；`dist/index.html` 中资源引用以 `/assets/...` 开头（无 `/EaziTrans/` 前缀）。

- [ ] **Step 3: 带变量构建验证**

PowerShell 下运行：

```powershell
$env:DEPLOY_BASE_PATH = '/EaziTrans/'; npm run build; Remove-Item Env:DEPLOY_BASE_PATH
```

Expected: 构建成功；`dist/index.html` 与 `dist/settings.html` 中资源引用以 `/EaziTrans/assets/...` 开头。

- [ ] **Step 4: Commit**

```bash
git add vite.config.js
git commit -m "build: 支持通过 DEPLOY_BASE_PATH 配置 Vite base 路径"
```

---

### Task 2: 创建 GitHub Actions 部署 Workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: Task 1 的 `DEPLOY_BASE_PATH` 环境变量。
- Produces: 完整可运行的 Pages 部署流水线。

- [ ] **Step 1: 创建 workflow 文件**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          DEPLOY_BASE_PATH: /EaziTrans/

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: 校验 YAML 语法**

Run: `node -e "const fs=require('fs');const yl=require('child_process');" 2>$null; npx --yes js-yaml .github/workflows/deploy.yml > $null; if ($?) { Write-Output 'YAML OK' }`

Expected: 输出 `YAML OK`（若 npx js-yaml 不可用，可用任何 YAML 解析器或目视校验缩进后跳过此步，并在真实 tag 推送时验证）。

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: 推送 v* tag 时自动构建并发布到 GitHub Pages"
```

---

### Task 3: 交付说明（前置手动操作）

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: 无
- Produces: 文档说明，告知仓库管理员完成一次性 Pages 设置。

- [ ] **Step 1: 在 README.md 合适位置添加「部署」小节**

```markdown
## 部署

项目通过 GitHub Actions 自动发布到 GitHub Pages：推送 `v*` 格式的 tag
（如 `v0.4.0`）即可触发构建与部署，站点地址为
`https://workear34.github.io/EaziTrans/`。

首次启用前需在仓库 **Settings → Pages → Build and deployment → Source**
中选择 **GitHub Actions**，否则部署会失败。
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: 补充 GitHub Pages 部署说明"
```

---

## 最终验证（人工）

1. 推送所有提交到 main：`git push origin main`
2. 确认仓库 Settings → Pages → Source 已选 **GitHub Actions**
3. 打测试 tag 并推送：`git tag v0.3.2-test; git push origin v0.3.2-test`
4. 观察 Actions 运行成功后访问 `https://workear34.github.io/EaziTrans/`，验证翻译页与设置页均正常加载（资源无 404）
5. 删除测试 tag：`git push origin :refs/tags/v0.3.2-test; git tag -d v0.3.2-test`
