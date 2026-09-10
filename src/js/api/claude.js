import { Provider, registerProvider } from './index.js';
import { langMap } from '../settings.js';

export class ClaudeProvider extends Provider {
  static endpointPath = '/v1/messages';

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
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      stream: true
    };

    return {
      method: 'POST',
      headers: {
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
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

            if (currentEvent === 'content_block_delta') {
              if (json.delta?.type === 'text_delta' && json.delta.text) {
                yield json.delta.text;
              }
            } else if (currentEvent === 'message_stop') {
              return;
            }
            // ignore ping, message_start, content_block_start, content_block_stop, message_delta
          } catch {
            // skip malformed JSON
          }

          currentEvent = '';
        }
      }
    }
  }
}

registerProvider('claude', ClaudeProvider);