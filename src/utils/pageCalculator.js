/**
 * 页面计算工具
 * 根据内容长度、字体大小、行高、页面尺寸、段间距等因素计算页面数量
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
 * @param {number} options.paragraphSpacing - 段间距(px)
 * @returns {number} 总页数
 */
export function calculateTotalPages(content, options = {}) {
  const {
    fontSize,
    lineHeight,
    pageWidth,
    pageHeight,
    padding,
    paragraphSpacing,
  } = options;

  // 计算有效显示区域
  const effectiveWidth = pageWidth - padding * 2;
  const effectiveHeight = pageHeight - padding * 2;

  // 计算每行字符数（中文字符按2个字符宽度计算）
  const avgCharWidth = fontSize * 0.6; // 平均字符宽度
  const charsPerLine = Math.floor(effectiveWidth / avgCharWidth);

  // 计算行高（像素）
  const lineHeightPx = fontSize * lineHeight;

  // 分析内容，计算段落数和总行数
  const { totalLines, paragraphCount } = analyzeContentStructure(
    content,
    charsPerLine
  );

  // 计算总的垂直空间需求（包括段间距）
  const totalVerticalSpace =
    totalLines * lineHeightPx + (paragraphCount - 1) * paragraphSpacing;

  // 计算总页数
  const totalPages = Math.ceil(totalVerticalSpace / effectiveHeight);

  return Math.max(1, totalPages);
}

/**
 * 分析内容结构，计算段落数和总行数
 * @param {string} content - 文本内容
 * @param {number} charsPerLine - 每行字符数
 * @returns {Object} 包含总行数和段落数的对象
 */
function analyzeContentStructure(content, charsPerLine) {
  // 按段落分割内容（以双换行符或单换行符分割）
  const paragraphs = content
    .split(/\n\s*\n|\n/)
    .filter((p) => p.trim().length > 0);

  let totalLines = 0;
  const paragraphCount = paragraphs.length;

  paragraphs.forEach((paragraph) => {
    const actualCharCount = calculateActualCharCount(paragraph.trim());
    const linesInParagraph = Math.ceil(actualCharCount / charsPerLine);
    totalLines += linesInParagraph;
  });

  return { totalLines, paragraphCount };
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
 * @param {number} options.fontSize - 字体大小(px)
 * @param {number} options.lineHeight - 行高倍数
 * @param {number} options.pageWidth - 页面宽度(px)
 * @param {number} options.pageHeight - 页面高度(px)
 * @param {number} options.padding - 页面内边距(px)
 * @param {number} options.paragraphSpacing - 段间距(px)
 * @returns {string} 当前页显示的内容
 */
export function getPageContent(content, currentPage, options = {}) {
  const {
    fontSize,
    lineHeight,
    pageWidth,
    pageHeight,
    padding,
    paragraphSpacing,
  } = options;

  // 计算有效显示区域
  const effectiveWidth = pageWidth - padding * 2;
  const effectiveHeight = pageHeight - padding * 2;

  // 计算每行字符数
  const avgCharWidth = fontSize * 0.6;
  const charsPerLine = Math.floor(effectiveWidth / avgCharWidth);

  // 计算行高（像素）
  const lineHeightPx = fontSize * lineHeight;

  // 计算当前页能容纳的垂直空间
  const availableHeight = effectiveHeight;

  // 按段落分割内容
  const paragraphs = content
    .split(/\n\s*\n|\n/)
    .filter((p) => p.trim().length > 0);

  // 计算每个段落的行数和高度
  const paragraphInfo = paragraphs.map((paragraph) => {
    const actualCharCount = calculateActualCharCount(paragraph.trim());
    const lines = Math.ceil(actualCharCount / charsPerLine);
    const height = lines * lineHeightPx;
    return {
      content: paragraph.trim(),
      lines,
      height,
      actualCharCount,
    };
  });

  // 计算当前页的起始位置
  const targetStartHeight = (currentPage - 1) * availableHeight;
  let currentHeight = 0;
  let pageContent = "";
  let isFirstParagraphInPage = true;

  for (let i = 0; i < paragraphInfo.length; i++) {
    const paragraph = paragraphInfo[i];
    const paragraphTotalHeight =
      paragraph.height + (i > 0 ? paragraphSpacing : 0);

    // 如果当前段落开始位置超过了目标页面范围，跳过
    if (currentHeight + paragraphTotalHeight <= targetStartHeight) {
      currentHeight += paragraphTotalHeight;
      continue;
    }

    // 如果当前段落在目标页面范围内
    if (currentHeight < targetStartHeight + availableHeight) {
      // 添加段间距（除了页面第一个段落）
      if (!isFirstParagraphInPage && i > 0) {
        pageContent += "\n\n";
      }

      // 计算段落在当前页的显示部分
      const paragraphStartInPage = Math.max(
        0,
        targetStartHeight - currentHeight
      );
      const paragraphEndInPage = Math.min(
        paragraph.height,
        targetStartHeight + availableHeight - currentHeight
      );

      if (paragraphEndInPage > paragraphStartInPage) {
        // 计算段落中需要显示的字符范围
        const startLine = Math.floor(paragraphStartInPage / lineHeightPx);
        const endLine = Math.ceil(paragraphEndInPage / lineHeightPx);

        const startChar = startLine * charsPerLine;
        const endChar = Math.min(
          endLine * charsPerLine,
          paragraph.actualCharCount
        );

        const paragraphContent = paragraph.content.substring(
          startChar,
          endChar
        );
        pageContent += paragraphContent;

        isFirstParagraphInPage = false;
      }
    }

    currentHeight += paragraphTotalHeight;

    // 如果已经超出当前页面范围，停止处理
    if (currentHeight >= targetStartHeight + availableHeight) {
      break;
    }
  }

  return pageContent;
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
    paragraphSpacing: 12, // 新增段间距选项
  };
}
