# GitHub Actions 自动构建并发布到 GitHub Pages — 设计文档

日期：2026-08-23
状态：已批准

## 目标

通过 GitHub Actions 在推送版本 tag 时自动构建项目，并发布到 GitHub Pages（`https://workear34.github.io/EaziTrans/`）。

## 需求

- 触发时机：仅推送 `v*` 格式的 tag（如 `v0.4.0`），与 AGENTS.md 中现有版本发布流程对齐。
- 本地开发与本地构建行为不变（资源引用仍为根路径 `/`）。
- 部署后页面在 `/EaziTrans/` 子路径下可正常访问，两个页面（`index.html` + `settings.html`）均正常工作。

## 设计

### 1. Vite base 路径条件配置（`vite.config.js`）

```js
base: process.env.DEPLOY_BASE_PATH || '/'
```

- CI 构建时设置 `DEPLOY_BASE_PATH=/EaziTrans/`，产物中所有资源引用指向子路径。
- 本地不设置该变量，保持默认根路径，开发与预览不受影响。

### 2. Workflow 文件（`.github/workflows/deploy.yml`）

采用 GitHub 官方推荐的 Pages 部署方式（部署源为 "GitHub Actions"，无需维护 `gh-pages` 分支）：

- **触发**：

  ```yaml
  on:
    push:
      tags: ['v*']
  ```

- **权限**：`contents: read`、`pages: write`、`id-token: write`；并发组 `pages` 限流，取消进行中的旧部署。

- **步骤**：
  1. `actions/checkout@v4`
  2. `actions/setup-node@v4`（Node 22，缓存 npm）
  3. `npm ci`
  4. 设置 `DEPLOY_BASE_PATH=/EaziTrans/` 后执行 `npm run build`
  5. `actions/configure-pages@v5`
  6. `actions/upload-pages-artifact@v3` 上传 `dist/`
  7. `actions/deploy-pages@v4`

### 3. 前置手动操作（一次性，代码无法完成）

仓库 Settings → Pages → Build and deployment → Source 选择 **GitHub Actions**。未设置前 workflow 会失败；将在交付说明中注明。

## 错误处理

- 构建失败（如 `npm ci` 或 `vite build` 出错）：workflow 失败，Pages 保持上一次成功部署的版本不受影响。
- 未在仓库设置 Pages Source：`deploy-pages` 步骤失败并给出明确错误信息，按上述手动操作解决。

## 测试 / 验证

1. 本地执行 `DEPLOY_BASE_PATH=/EaziTrans/ npm run build`，检查 `dist/` 内 HTML 的资源路径带 `/EaziTrans/` 前缀。
2. 不设置变量时执行 `npm run build`，确认路径仍为根路径（回归验证）。
3. 打测试 tag 推送到 origin，观察 Actions 运行结果，访问 `https://workear34.github.io/EaziTrans/` 验证翻译页与设置页可用。

## 范围外

- main 分支推送自动发布（用户明确选择仅 tag 触发）。
- GitHub Release 创建、CHANGELOG 自动化。
