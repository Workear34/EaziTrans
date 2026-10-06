// 文件字节流 → 文本。
//
// 编码完全由用户指定，不做任何自动猜测：中文用户手上的 TXT / SRT 常见
// GBK / GB18030，猜错就会得到一屏乱码，不如让用户自己选。
// 这里只做一件「不算猜测」的事：剥掉文件开头的 BOM 字符，
// 否则带 BOM 的文件会在第一段译文前多出一个 U+FEFF。

// 与文件翻译页 #fileEncoding 下拉框的 value 对应，第一项为默认
export const ENCODINGS = [
  { value: 'utf-8', label: 'UTF-8（推荐）' },
  { value: 'gb18030', label: 'GB18030 / GBK（简体中文）' },
  { value: 'big5', label: 'Big5（繁体中文）' },
  { value: 'shift_jis', label: 'Shift_JIS（日语）' },
  { value: 'euc-kr', label: 'EUC-KR（韩语）' },
  { value: 'utf-16le', label: 'UTF-16LE' },
  { value: 'utf-16be', label: 'UTF-16BE' }
];

export const DEFAULT_ENCODING = ENCODINGS[0].value;

/**
 * 解码文件内容。
 *
 * @param {ArrayBuffer} buffer 文件原始字节
 * @param {string} [encoding] 用户选择的编码，默认 UTF-8
 * @returns {{ text: string, used: string }} used 为实际使用的编码
 * @throws 字节序列与所选编码不匹配时抛错，避免把乱码当成正常内容继续翻译
 */
export function decodeBuffer(buffer, encoding = DEFAULT_ENCODING) {
  const bytes = new Uint8Array(buffer);

  let text;
  try {
    // fatal: 遇到非法字节序列直接抛错，而不是静默替换成 U+FFFD
    text = new TextDecoder(encoding, { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`无法用 ${encoding} 解码该文件，请在上方改选正确的编码`);
  }

  // UTF-8 / UTF-16 的 BOM 解码后都是 U+FEFF，去掉以免污染第一段
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

  return { text, used: encoding };
}

/** 编码代号 → 界面展示名 */
export function encodingLabel(value) {
  return ENCODINGS.find(e => e.value === value)?.label ?? value;
}