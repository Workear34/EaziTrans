import { Provider, registerProvider } from './index.js';
import { langMap } from '../settings.js';

export class OpenAIProvider extends Provider {
  buildRequest(text, srcLang, tgtLang, config) {
    const sourceLang = langMap[srcLang] || srcLang;
    const targetLang = langMap[tgtLang] || tgtLang;

    const systemPrompt = config.systemPrompt
      .replace(/{source_lang}/g, sourceLang)
      .replace(/{target_lang}/g, targetLang);

    const userPrompt = config.promptTemplate
      .replace(/{source_lang}/g, sourceLang)
      .replace(/{target_lang}/g, targetLang)
      .replace(/{text}/g, text);

    const body = {
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      stream: true
    };

    return {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    };
  }

  async *stream(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const json = JSON.parse(data);
            const content = json.choices?.[0]?.delta?.content;
            if (content) yield content;
          } catch {
            // skip malformed JSON lines
          }
        }
      }
    }
  }
}

registerProvider('openai', OpenAIProvider);