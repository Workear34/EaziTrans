// src/api/responses.js
import { Provider, registerProvider } from './index.js';
import { langMap } from '../settings.js';

export class ResponsesProvider extends Provider {
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
      instructions: systemPrompt,
      input: [
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
    let currentEvent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (!data) continue;

          try {
            const json = JSON.parse(data);

            if (currentEvent === 'response.output_text.delta') {
              if (json.delta) yield json.delta;
            } else if (currentEvent === 'response.completed') {
              return;
            }
            // 忽略 response.created, response.in_progress, output_item.added 等其他事件
          } catch {
            // skip malformed JSON
          }

          currentEvent = '';
        }
      }
    }
  }
}

registerProvider('openai-responses', ResponsesProvider);
