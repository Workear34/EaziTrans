// src/api/index.js

export class Provider {
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