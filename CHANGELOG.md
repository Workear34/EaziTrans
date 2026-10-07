# 更新日志

## 0.3.2 2026-9-13

- 翻译加载提示由全屏遮罩改为按钮内 spinner（Bootstrap spinner）
- 设置页 System Prompt / User Prompt 增加用途说明与「恢复默认」小按钮
- 设置页改为标签页分类（翻译 API / 界面和交互 / 关于）
- 新增「重置所有设置」按钮及确认对话框
- 新增源文本字数统计
- 输入框为空时自动禁用翻译按钮
- 翻译、复制按钮改为图标；调整交换语言按钮样式
- 优化翻译界面布局、文本框分隔线及 Toast 样式与显示逻辑
- 修复主题选项 auto 带前导空格导致刷新后为空
- 修复页面编码错乱
- JS 代码移入 src/js 目录，模态框封装为 ui.js 通用 Modal；抽取 DEFAULT_SETTINGS 并新增 resetSettings
- 新增 GitHub Actions 自动部署到 GitHub Pages（推送 main 分支触发），支持 DEPLOY_BASE_PATH 配置 Vite base 路径
- 更新项目依赖、README 及相关设计文档

## 0.3.1 2026-8-22

- API 地址支持填写基础地址，自动拼接各提供商端点路径，修复 DeepSeek Responses API 404
- 各提供商适配器显式关闭思考模式（DeepSeek v4 默认开启）
- 设置页 API 地址提示文案更新
- 补全导航栏 active 状态

## 0.3.0 2026-8-9

- 新增 OpenAI Responses API 提供商支持
- JS 代码模块化拆分（settings / ui / api）
- 新增 Anthropic Claude 提供商支持
- 修复设置验证与错误提示逻辑

## 0.2.7 2026-8-4

- 修复深色模式无法随系统变化问题
- 修复自动翻译选项丢失问题

## 0.2.6 2025-8-16

- 提示信息改为 Bootstrap Toast 实现
- 页面更加简洁

## 0.2.5 2025-8-16

增加更改语言时自动翻译的功能

## 0.2.4 2025-8-14

使用现代方法实现复制功能

## 0.2.3 2025-8-13

- 增加自定义模型支持
- 修复无法保存 System Prompt 和 User Prompt 的问题

## 0.2.2 2025-8-12

增加葡萄牙语支持

## 0.21 2025-8-12

- 项目整体迁移至 Vite
- 优化逻辑，修复部分 BUG

## 0.2 Prototype 2025-8-12

- 使用 bootstrap + bootstrap-icons 重构
- 支持任意兼容 OpenAI 接口的 API 地址

## 0.1 Prototype 2025-8-11

首个版本
