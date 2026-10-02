// 文件字节流 → 文本。
//
// 中文用户手上的 TXT / SRT 常见 GBK / GB18030，直接用 File.text() 会读成乱码。
// 这里按「BOM → UTF-8 严格解码 → 兜底 GB18030」的顺序判断，并把实际使用的编码
// 回传给界面，方便用户发现猜错后手动改。

// 与文件翻译页 #fileEncoding 下拉框的 value 对应
export const ENCODINGS = [
  { value: 'auto', label: '自动检测（推荐）' },
  { value: 'utf-8', label: 'UTF-8' },
  { value: 'gb18030', label: 'GB18030 / GBK（简体中文）' },
  { value: 'big5', label: 'Big5（繁体中文）' },
  { value: 'shift_jis', label: 'Shift_JIS（日语）' },
  { value: 'euc-kr', label: 'EUC-KR（韩语）' },
  { value: 'utf-16le', label: 'UTF-16LE' },
  { value: 'utf-16be', label: 'UTF-16BE' }
];

// BOM 比任何启发式判断都可靠，优先识别
const BOM_TABLE = [
  { bytes: [0xEF, 0xBB, 0xBF], encoding: 'utf-8' },
  { bytes: [0xFF, 0xFE], encoding: 'utf-16le' },
  { bytes: [0xFE, 0xFF], encoding: 'utf-16be' }
];

function matchBom(bytes) {
  return BOM_TABLE.find(bom => bom.bytes.every((b, i) => bytes[i] === b)) || null;
}

function decodeWith(bytes, encoding) {
  // fatal: 遇到非法字节序列直接抛错，而不是静默替换成 U+FFFD
  try {
    return new TextDecoder(encoding, { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

function stripLeadingBom(text) {
  return text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
}

/**
 * 解码文件内容。
 *
 * 注意：自动检测实际是「是合法 UTF-8 就用 UTF-8，否则用 GB18030」的两选一判断，
 * 不是真正的编码探测器。日文 / 韩文文件会被误判成 GB18030 而出现乱码，
 * 此时需要用户在下拉框里手动指定。
 *
 * @param {ArrayBuffer} buffer 文件原始字节
 * @param {string} encoding 用户选择的编码，'auto' 表示自动检测
 * @returns {{ text: string, used: string, detected: boolean }} used 为实际使用的编码
 */
export function decodeBuffer(buffer, encoding = 'auto') {
  const bytes = new Uint8Array(buffer);
  const bom = matchBom(bytes);

  // 用户手动指定：严格按指定编码解码，选错则报错而不是返回乱码
  if (encoding && encoding !== 'auto') {
    const source = bom ? bytes.slice(bom.bytes.length) : bytes;
    const text = decodeWith(source, encoding);
    if (text === null) {
      throw new Error(`无法用 ${encoding} 解码该文件，编码可能选错了，请换一个试试`);
    }
    return { text: stripLeadingBom(text), used: encoding, detected: false };
  }

  // 自动检测 1：BOM
  if (bom) {
    const text = decodeWith(bytes.slice(bom.bytes.length), bom.encoding) ?? '';
    return { text: stripLeadingBom(text), used: bom.encoding, detected: true };
  }

  // 自动检测 2：UTF-8 严格解码
  const utf8 = decodeWith(bytes, 'utf-8');
  if (utf8 !== null) return { text: utf8, used: 'utf-8', detected: true };

  // 自动检测 3：兜底 GB18030
  const gb = decodeWith(bytes, 'gb18030');
  if (gb !== null) return { text: gb, used: 'gb18030', detected: true };

  throw new Error('无法识别该文件的编码，请手动指定编码');
}

/** 编码代号 → 界面展示名 */
export function encodingLabel(value) {
  return ENCODINGS.find(e => e.value === value)?.label ?? value;
}