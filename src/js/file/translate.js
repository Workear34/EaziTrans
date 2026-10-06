// 片段翻译调度：按字符预算分批、批量失败自动回退逐条、进度上报、取消。
//
// 本模块不碰 DOM、也不认识任何 provider —— 调用方注入一个 translateOnce 即可，
// 因此可以脱离页面单独验证。

export const DEFAULT_BATCH_CHARS = 1500;

/**
 * 按字符预算把片段分组，返回每组包含的片段下标。
 * budget 为 0 / null 时不分组，整个文件作为一组。
 */
export function groupByBudget(segments, budget = DEFAULT_BATCH_CHARS) {
  const total = segments.length;
  if (!budget || budget <= 0) {
    return total ? [Array.from({ length: total }, (_, i) => i)] : [];
  }

  const groups = [];
  let current = [];
  let used = 0;

  for (let i = 0; i < total; i++) {
    const len = segments[i].length;
    // 单条就超过预算时也让它单独成组，否则这一组永远加不进任何后续片段
    if (current.length && used + len > budget) {
      groups.push(current);
      current = [];
      used = 0;
    }
    current.push(i);
    used += len;
  }
  if (current.length) groups.push(current);

  return groups;
}

/** 把一批片段拼成带序号的请求文本 */
export function buildBatchText(segments, indices) {
  return indices.map((idx, n) => `${n + 1}\n${segments[idx]}`).join('\n\n');
}

/**
 * 切分带序号的批量译文。
 * 条数不符、编号不连续或出现空译文都返回 null，交由调用方回退到逐条翻译。
 */
export function splitBatchResponse(text, expected) {
  const blocks = text.split(/\n[ \t]*\n/);
  if (blocks.length !== expected) return null;

  const out = [];
  for (let i = 0; i < blocks.length; i++) {
    const m = /^[ \t]*(\d+)[ \t]*\r?\n([\s\S]*)$/.exec(blocks[i]);
    if (!m || Number(m[1]) !== i + 1) return null;   // 编号必须从 1 连续递增
    const body = m[2].trim();
    if (!body) return null;                          // 空译文视为异常，走回退
    out.push(body);
  }

  return out;
}

/**
 * 翻译片段列表。
 *
 * budget > 0（分块）：返回与 segments 等长的译文数组，交给 parsers 的 render() 填回原文。
 * budget 为 0（不分块）：整份文件一次请求，不套编号协议，返回单元素数组 [整份译文]，
 *   调用方直接把它当最终结果用，不要再走 render()。
 *
 * @param {object} opts
 * @param {string[]} opts.segments 待翻译片段
 * @param {(text: string, signal: AbortSignal) => Promise<string>} opts.translateOnce 单次请求
 * @param {number} [opts.budget] 每批字符预算，0 表示不分块
 * @param {(p: {done: number, total: number}) => void} [opts.onProgress]
 * @param {() => boolean} [opts.shouldCancel]
 * @returns {Promise<string[]>}
 */
export async function translateSegments({
  segments,
  translateOnce,
  budget = DEFAULT_BATCH_CHARS,
  onProgress,
  shouldCancel
}) {
  const total = segments.length;
  if (total === 0) return [];

  // 不分块：整份文件一次请求。大文件套编号协议反而更容易让模型错乱，所以不用。
  if (!budget || budget <= 0) {
    const out = await translateOnce(segments.join('\n\n'));
    onProgress?.({ done: total, total });
    return [out];
  }

  const results = new Array(total);
  const groups = groupByBudget(segments, budget);
  let done = 0;

  const checkCancel = () => { if (shouldCancel?.()) throw new Error('CANCELLED'); };

  for (const group of groups) {
    checkCancel();

    if (group.length === 1) {
      results[group[0]] = await translateOnce(segments[group[0]]);
      done += 1;
      onProgress?.({ done, total });
      continue;
    }

    // 先整批试一次；条数或编号对不上就整批退回逐条翻译
    let translated = null;
    try {
      translated = splitBatchResponse(await translateOnce(buildBatchText(segments, group)), group.length);
    } catch (e) {
      checkCancel();   // 取消要往外抛，不能被当成批量失败而回退
      translated = null;
    }

    if (translated) {
      group.forEach((idx, n) => { results[idx] = translated[n]; });
      done += group.length;
      onProgress?.({ done, total });
    } else {
      for (const idx of group) {
        checkCancel();
        results[idx] = await translateOnce(segments[idx]);
        done += 1;
        onProgress?.({ done, total });
      }
    }
  }

  return results;
}