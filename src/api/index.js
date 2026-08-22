// src/api/index.js

export class Provider {
  // 提供商对应的 API 端点路径，配合 resolveEndpointUrl 使用
  static endpointPath = '';

  buildRequest(text, srcLang, tgtLang, config) {
    throw new Error('Not implemented');
  }

  async *stream(response) {
    throw new Error('Not implemented');
  }
}

const providers = {};

export function registerProvider(name, ProviderClass) {
  providers[name] = ProviderClass;
}

export function createProvider(name) {
  const ProviderClass = providers[name];
  if (!ProviderClass) {
    throw new Error(`Unknown provider: ${name}`);
  }
  return new ProviderClass();
}

// 将用户配置的 API 基础地址解析为提供商的实际端点地址。
// 兼容两种填法：基础地址（如 https://api.deepseek.com）或完整端点地址（已含路径则原样返回）。
export function resolveEndpointUrl(baseUrl, path) {
  const trimmed = String(baseUrl || '').trim().replace(/\/+$/, '');
  return trimmed.endsWith(path) ? trimmed : trimmed + path;
}