# EaziTrans

一个基于大模型的 AI 翻译界面实现。

## 在线体验
https://workear34.github.io/EaziTrans/

## **声明：**

**1. 本项目为实验性项目，可能会存在问题，且随时可能暂停/停止开发。**

**2. 请保管好您的 API 密钥，目前项目使用并不安全的 localStorage 存储密钥，后续会改进密钥存储方式。**

**3. 由于本人水平和时间有限，目前代码大量依赖 OpenCode 辅助创作，因此代码质量可能较低。计划未来会逐步减少 AI 代码。**

## 特点

- 支持自动识别语言和多种语言互译
- 兼容 Open AI Chat Completions API/Responses API + Anthropic API协议
- Bootstrap 带来的简洁美观的响应式界面
- Prompt 自定义功能
- 界面交互简单易用
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
4. 构建后将 `dist` 目录下的所有文件拷贝到服务器根目录中

## Todos

- [ ] 翻译按钮前增加字数显示

- [ ] 设置页面选项分类与自动保存提示

- [ ] 改进密钥存储方式

- [ ] IndexDB 实现翻译历史记录

- [ ] File API 文档翻译

## 许可协议

GPLv3
