// TXT文本文件处理器
import * as jschardet from 'jschardet';

export class TXTBook {
  constructor(file) {
    this.file = file;
    this.text = null;
    this.metadata = null;
    this.chapters = [];
    this.sections = [];
    this.toc = [];
  }

  async init() {
    try {
      // 使用正确的编码方式读取文件，解决乱码问题
      this.text = await this.readFileWithEncoding(this.file);
    } catch (error) {
      console.error('文件读取失败:', error);
      // 如果编码检测失败，使用原始方式
      this.text = await this.file.text();
    }

    // 确保text是字符串类型
    if (typeof this.text !== 'string') {
      console.warn('文本转换失败，使用空字符串');
      this.text = '';
    }

    const filename = this.file.name || "untitled.txt";

    this.metadata = {
      title: filename.replace(/\.txt$/i, ""),
      author: "Unknown",
      language: this.detectLanguage(this.text),
      identifier: filename,
      description: "Plain text document"
    };

    // 智能章节识别
    this.chapters = this.detectChapters(this.text);
    this.generateSections();
    this.generateTOC();

    return this;
  }

  // 使用正确的编码方式读取文件
  async readFileWithEncoding(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          // 读取为ArrayBuffer以便检测编码
          const arrayBuffer = e.target.result;
          const uint8Array = new Uint8Array(arrayBuffer);

          let detectionResult;
          try {
            // 尝试直接检测Uint8Array
            detectionResult = jschardet.detect(uint8Array);
          } catch (error) {
            console.warn('直接检测Uint8Array失败，尝试转换为字符串:', error);
            const binaryString = new TextDecoder('latin1').decode(uint8Array);
            detectionResult = jschardet.detect(binaryString);
          }

          const encoding = detectionResult.encoding?.toLowerCase() || 'utf-8';
          const decoderEncoding = encoding.includes('gb2312') || encoding.includes('gbk') ? 'gbk' : encoding;
          let text;
          try {
            text = new TextDecoder(decoderEncoding).decode(uint8Array);
          } catch (error) {
            console.error(`使用${decoderEncoding}解码失败，尝试UTF-8:`, error);
            text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
          }

          resolve(text);
        } catch (error) {
          console.error('文件读取错误:', error);
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };

      // 使用ArrayBuffer方式读取文件
      reader.readAsArrayBuffer(file);
    });
  }
  // 检测文本是否存在乱码迹象
  hasGarbledCharacters(text) {
    const garbledPattern = /[\x00-\x1F\x7F-\x9F\uFFFD]+/g;
    const matches = text.match(garbledPattern);
    if (!matches) return false;
    const garbledLength = matches.reduce((sum, match) => sum + match.length, 0);
    // 如果乱码字符占比超过1%，认为有乱码
    return garbledLength / text.length > 0.01;
  }
  // 检测文本语言
  detectLanguage(text) {
    if (!text) return 'zh';
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const totalChars = text.length;
    return (chineseChars / totalChars > 0.1) ? 'zh' : 'en';
  }

  // 智能章节识别算法
  detectChapters(text) {
    if (!text || typeof text !== 'string') {
      console.warn('无效的文本内容，创建默认章节');
      return [{
        id: 'chapter-0',
        title: this.metadata.title,
        href: 'chapter-0.html',
        startLine: 0,
        content: text || ''
      }];
    }

    const lines = text.split('\n');
    const chapters = [];
    const chapterPatterns = [
      // 中文章节格式
      /^第[\d零一二三四五六七八九十百千万]+[章回节卷]/,
      /^第[\d零一二三四五六七八九十百千万]+章/,
      /^第[\d零一二三四五六七八九十百千万]+回/,
      /^第[\d零一二三四五六七八九十百千万]+节/,
      /^第[\d零一二三四五六七八九十百千万]+折/,

      // 英文章节格式
      /^Chapter\s+\d+/i,
      /^CHAPTER\s+\d+/i,
      /^Part\s+\d+/i,
      /^Section\s+\d+/i,

      // 数字格式
      /^\d+\s*[、.．]/,
      /^\d+\s*[章回节卷]/,
      /^\d+\.\s+/,

      // 罗马数字
      /^[IVXLCDM]+\./,

      // 特殊标记
      /^===+.*===+/,
      /^---+.*---+/,
      /^\*\*\*.*\*\*\*/
    ];

    let currentChapter = null;
    let chapterStart = 0;
    let chapterIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // 检查是否为章节标题
      const isChapterTitle = chapterPatterns.some(pattern => pattern.test(line));

      if (isChapterTitle && line.length > 0 && line.length < 100) {
        // 保存前一个章节
        if (currentChapter) {
          currentChapter.content = lines.slice(chapterStart, i).join('\n');
          chapters.push(currentChapter);
        }

        // 创建新章节
        currentChapter = {
          id: `chapter-${chapterIndex++}`,
          title: line,
          href: `chapter-${chapterIndex - 1}.html`,
          startLine: i,
          content: ''
        };

        chapterStart = i;
      }
    }

    // 处理最后一个章节
    if (currentChapter) {
      currentChapter.content = lines.slice(chapterStart).join('\n');
      chapters.push(currentChapter);
    }

    // 如果没有识别到章节，将整个文本作为一个章节
    if (chapters.length === 0) {
      chapters.push({
        id: 'chapter-0',
        title: this.metadata.title,
        href: 'chapter-0.html',
        startLine: 0,
        content: text
      });
    }

    return chapters;
  }

  // 生成章节结构
  generateSections() {
    this.sections = this.chapters.map((chapter, index) => ({
      id: chapter.id,
      href: chapter.href,
      title: chapter.title,
      linear: "yes",
      cfi: `/6/${index + 2}[${chapter.id}]!`,
      // 添加size属性
      size: chapter.content?.length || 0,
      load: async () => {
        const section = await this.getSection(chapter.href);
        if (section && section.render) {
          const htmlContent = section.render();
          // 创建Blob对象并生成URL
          const blob = new Blob([htmlContent], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          // 存储URL以便后续清理
          section.blobUrl = url;
          return url;
        }
        return '';
      },
      // 添加unload方法
      unload: async () => {
        const section = await this.getSection(chapter.href);
        if (section && section.blobUrl) {
          // 释放Blob URL
          URL.revokeObjectURL(section.blobUrl);
          section.blobUrl = null;
        }
      }
    }));
  }
  destroy() {
    // 释放所有创建的Blob URL
    this.sections.forEach(section => {
      if (section.blobUrl) {
        URL.revokeObjectURL(section.blobUrl);
      }
    });
  }
  // 生成目录
  generateTOC() {
    this.toc = this.chapters.map((chapter, index) => ({
      label: chapter.title,
      href: chapter.href,
      subitems: []
    }));
  }

  // 获取指定章节的内容
  async getSection(href) {
    const chapter = this.chapters.find(ch => ch.href === href);
    if (!chapter) return null;

    const htmlContent = this.convertChapterToHTML(chapter);

    return {
      document: new DOMParser().parseFromString(htmlContent, "text/html"),
      render: () => htmlContent
    };
  }
  // 分割目录链接
  splitTOCHref(href) {
    // 对于TXT文件，我们假设href直接指向章节ID
    return [href.replace(/^#/, ''), null];
  }
  // 获取目录片段
  async getTOCFragment(id) {
    // 查找对应ID的章节
    const chapter = this.chapters.find(ch => ch.id === id);
    if (!chapter) return null;

    // 返回章节的标题和内容片段
    return {
      label: chapter.title,
      text: chapter.content.substring(0, 100) + (chapter.content.length > 100 ? '...' : '')
    };
  }
  // 将章节转换为HTML
  convertChapterToHTML(chapter) {
    const lines = chapter.content.split('\n');
    const htmlLines = lines.map(line => {
      const trimmedLine = line.trim();
      if (trimmedLine === '') {
        return '<br/>';
      }

      // 如果是章节标题，用h1标签
      if (trimmedLine === chapter.title) {
        return `<h1>${this.escapeHTML(trimmedLine)}</h1>`;
      }

      return `<p>${this.escapeHTML(trimmedLine)}</p>`;
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${this.metadata.title} - ${chapter.title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.8;
            margin: 2em;
            color: #333;
            background-color: #fff;
            max-width: 800px;
            margin: 0 auto;
            padding: 2em;
          }
          h1 {
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 0.3em;
            margin: 1.5em 0 1em 0;
            font-size: 1.8em;
          }
          p {
            margin: 0.8em 0;
            text-indent: 2em;
            line-height: 1.8;
            text-align: justify;
          }
          br {
            margin: 1em 0;
          }
          @media (max-width: 600px) {
            body {
              margin: 1em;
              padding: 1em;
            }
            h1 {
              font-size: 1.5em;
            }
        }
        </style>
      </head>
      <body>
        <div id="content">
          ${htmlLines.join('\n')}
        </div>
      </body>
      </html>
    `;
  }

  escapeHTML(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async getCover() {
    return null;
  }

  resolveHref(href) {
    const chapterIndex = this.chapters.findIndex(ch => ch.href === href);
    if (chapterIndex !== -1) {
      return {
        index: chapterIndex,
        anchor: () => document.getElementById("content")
      };
    }
    return null;
  }
  // 解析TXT格式的自定义CFI
  resolveCFI(cfi) {
    try {
      // 首先去掉epubcfi()包装（如果存在）
      const isCFI = /^epubcfi\((.*)\)$/;
      const unwrappedCFI = cfi.match(isCFI)?.[1] ?? cfi;

      // 尝试解析简单的CFI格式: /6/{index}[{chapterId}]!
      const simpleMatch = unwrappedCFI.match(/^\/6\/(\d+)\[([^\]]+)\]!$/);
      if (simpleMatch) {
        const index = parseInt(simpleMatch[1]) - 2; // 减去2，因为generateSections中使用了index + 2
        const chapterId = simpleMatch[2];

        // 验证索引是否有效
        if (index >= 0 && index < this.chapters.length) {
          const chapter = this.chapters[index];
          // 验证章节ID是否匹配
          if (chapter.id === chapterId) {
            return {
              index: index,
              anchor: (doc) => {
                // 返回章节内容的开始位置
                const contentElement = doc.getElementById("content");
                if (contentElement) {
                  // 创建一个范围对象，指向章节开始
                  const range = doc.createRange();
                  range.selectNodeContents(contentElement);
                  range.collapse(true); // 折叠到开始位置
                  return range;
                }
                return null;
              }
            };
          }
        }
      }

      // 尝试解析复杂的epubcfi格式: /6/{index}[{chapterId}]!!/4/2[content],/path/to/element:offset
      const complexMatch = unwrappedCFI.match(/^\/6\/(\d+)\[([^\]]+)\]!!\/4\/2\[content\],(.+)$/);
      if (complexMatch) {
        const index = parseInt(complexMatch[1]) - 2; // 减去2，因为generateSections中使用了index + 2
        const chapterId = complexMatch[2];
        const pathInfo = complexMatch[3]; // 获取路径信息，如 /48,/76/1:40

        // 验证索引是否有效
        if (index >= 0 && index < this.chapters.length) {
          const chapter = this.chapters[index];
          // 验证章节ID是否匹配
          if (chapter.id === chapterId) {
            // 修改正则表达式以匹配逗号分隔的路径格式，如 /48,/76/1:40
            const pathMatch = pathInfo.match(/^(\/(\d+)(?:,\/(\d+))*)\/(\d+):(\d+)$/);
            console.log(pathMatch)

            if (pathMatch) {
              const pageNumber = parseInt(pathMatch[4]); // 提取页数
              const offset = parseInt(pathMatch[5]); // 提取字符偏移量

              return {
                index: index,
                anchor: (doc) => {
                  const contentElement = doc.getElementById("content");
                  if (contentElement) {
                    // 创建一个范围对象
                    const range = doc.createRange();
                    range.selectNodeContents(contentElement);

                    // 优先使用页数定位
                    if (pageNumber > 0) {
                      try {
                        // 查找所有页面元素（假设页面有特定的class或结构）
                        const pageElements = contentElement.querySelectorAll('#footer');
                        if (pageElements.length > 0 && pageNumber <= pageElements.length) {
                          // 定位到指定页面的开始位置
                          const targetPage = pageElements[pageNumber - 1]; // 页码从1开始，数组从0开始
                          range.selectNodeContents(targetPage);
                          range.collapse(true);
                          return range;
                        }
                      } catch (e) {
                        console.warn('定位到指定页面失败，尝试使用字符偏移量:', e);
                      }
                    }

                    // 如果页数定位失败，尝试使用字符偏移量定位
                    if (offset > 0) {
                      try {
                        // 遍历所有文本节点，计算字符位置
                        const walker = doc.createTreeWalker(
                          contentElement,
                          NodeFilter.SHOW_TEXT,
                          null,
                          false
                        );

                        let currentOffset = 0;
                        let targetNode = null;
                        let nodeOffset = 0;

                        while (walker.nextNode()) {
                          const node = walker.currentNode;
                          const textLength = node.textContent.length;

                          if (currentOffset + textLength >= offset) {
                            targetNode = node;
                            nodeOffset = offset - currentOffset;
                            break;
                          }

                          currentOffset += textLength;
                        }

                        if (targetNode) {
                          // 定位到具体的字符位置
                          range.setStart(targetNode, nodeOffset);
                          range.setEnd(targetNode, nodeOffset);
                          return range;
                        }
                      } catch (e) {
                        console.warn('定位到具体字符位置失败，使用章节开始位置:', e);
                      }
                    }

                    // 如果都没有成功，返回章节开始位置
                    range.collapse(true);
                    return range;
                  }
                  return null;
                }
              };
            }
          }
        }
      }

      // 如果都无法解析，返回null
      console.warn('无法解析TXT格式的CFI:', cfi);
      return null;
    } catch (error) {
      console.error('解析TXT格式CFI时出错:', error);
      return null;
    }
  }
  getTOC() {
    return this.toc;
  }

  get metadata() {
    return this._metadata;
  }

  set metadata(value) {
    this._metadata = value;
  }

  get spine() {
    return this.sections.map(section => section.id);
  }
}

// 工厂函数，用于创建TXTBook实例
export const makeTXTBook = async (file) => {
  const book = new TXTBook(file);
  return await book.init();
};

// 辅助函数：检测是否为TXT文件
export const isTXT = ({ name, type }) => {
  return type === "text/plain" ||
    name.endsWith(".txt") ||
    name.endsWith(".TXT") ||
    type === "text/markdown" ||
    name.endsWith(".md") ||
    name.endsWith(".markdown");
};

// 默认导出
export default TXTBook;