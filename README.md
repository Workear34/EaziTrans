# EaziTrans
一个基于大模型的 AI 翻译界面实现。

**请注意：**

**1. 本项目为实验性项目，可能会存在问题，且随时可能暂停/停止开发。**

**2. 请保管好您的 API 密钥，目前项目使用并不安全的 localStorage 存储密钥，后续会改进密钥存储方式。**
## 特点
- 支持自动识别语言和多种语言互译
- 兼容 Open AI Chat Completions API/Responses API + Anthropic API协议
- Bootstrap 带来的简洁美观的响应式界面
- Prompt 自定义功能
- 界面交互简单，无冗余功能和广告
- 源代码开放
## 使用技术
- OpenCode 辅助创作
- Bootstrap
- Bootstrap Icons
- Vite
## 运行 & 构建方法
1. `git clone` 项目到本地
2. 运行 `npm run dev` 查看
3. 运行 `npm run build` 构建
4. 将 `dist` 目录下的所有文件拷贝到服务器根目录中
## 部署

项目通过 GitHub Actions 自动发布到 GitHub Pages：推送 `v*` 格式的 tag
（如 `v0.4.0`）即可触发构建与部署，站点地址为
`https://workear34.github.io/EaziTrans/`。

首次启用前需在仓库 **Settings → Pages → Build and deployment → Source**
中选择 **GitHub Actions**，否则部署会失败。
## 许可协议
GPLv3