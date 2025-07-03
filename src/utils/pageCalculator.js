/**
 * 页面计算工具
 * 根据内容长度、字体大小、行高、页面尺寸等因素计算页面数量
 */

/**
 * 计算文本内容的总页数
 * @param {string} content - 文本内容
 * @param {Object} options - 计算选项
 * @param {number} options.fontSize - 字体大小(px)
 * @param {number} options.lineHeight - 行高倍数
 * @param {number} options.pageWidth - 页面宽度(px)
 * @param {number} options.pageHeight - 页面高度(px)
 * @param {number} options.padding - 页面内边距(px)
 * @returns {number} 总页数
 */
export function calculateTotalPages(content, options = {}) {
  const {
    fontSize = 16,
    lineHeight = 1.6,
    pageWidth = 800,
    pageHeight = 600,
    padding = 40,
  } = options;

  // 计算有效显示区域
  const effectiveWidth = pageWidth - padding * 2;
  const effectiveHeight = pageHeight - padding * 2;

  // 计算每行字符数（中文字符按2个字符宽度计算）
  const avgCharWidth = fontSize * 0.6; // 平均字符宽度
  const charsPerLine = Math.floor(effectiveWidth / avgCharWidth);

  // 计算每页行数
  const lineHeightPx = fontSize * lineHeight;
  const linesPerPage = Math.floor(effectiveHeight / lineHeightPx);

  // 计算每页字符数
  const charsPerPage = charsPerLine * linesPerPage;

  // 处理内容，计算实际字符数（考虑中英文混合）
  const actualCharCount = calculateActualCharCount(content);

  // 计算总页数
  return Math.max(1, Math.ceil(actualCharCount / charsPerPage));
}

/**
 * 计算实际字符数（中文字符按2个字符宽度计算）
 * @param {string} content - 文本内容
 * @returns {number} 实际字符数
 */
function calculateActualCharCount(content) {
  let count = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    // 判断是否为中文字符
    if (/[\u4e00-\u9fa5]/.test(char)) {
      count += 2; // 中文字符占2个字符宽度
    } else {
      count += 1; // 英文字符占1个字符宽度
    }
  }
  return count;
}

/**
 * 根据当前页码计算显示内容
 * @param {string} content - 完整内容
 * @param {number} currentPage - 当前页码（从1开始）
 * @param {Object} options - 计算选项
 * @returns {string} 当前页显示的内容
 */
export function getPageContent(content, currentPage, options = {}) {
  const {
    fontSize = 16,
    lineHeight = 1.6,
    pageWidth = 800,
    pageHeight = 600,
    padding = 40,
  } = options;

  // 计算有效显示区域
  const effectiveWidth = pageWidth - padding * 2;
  const effectiveHeight = pageHeight - padding * 2;

  // 计算每行字符数
  const avgCharWidth = fontSize * 0.6;
  const charsPerLine = Math.floor(effectiveWidth / avgCharWidth);

  // 计算每页行数
  const lineHeightPx = fontSize * lineHeight;
  const linesPerPage = Math.floor(effectiveHeight / lineHeightPx);

  // 计算每页字符数
  const charsPerPage = charsPerLine * linesPerPage;

  // 计算起始和结束位置
  const startPos = (currentPage - 1) * charsPerPage;
  const endPos = startPos + charsPerPage;
  // 返回当前页内容
  return content.substring(startPos, endPos);
}

/**
 * 获取默认计算选项
 * @returns {Object} 默认选项
 */
export function getDefaultOptions() {
  return {
    fontSize: 16,
    lineHeight: 1.8,
    pageWidth: 800,
    pageHeight: 600,
    padding: 40,
  };
}
