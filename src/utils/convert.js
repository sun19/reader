export default class Convert {
  /**
   * 检测文本文件编码
   */
  static detectEncoding(bytes) {
    const uint8Array = new Uint8Array(bytes);

    // 检测BOM
    if (uint8Array.length >= 3) {
      // UTF-8 BOM
      if (
        uint8Array[0] === 0xef &&
        uint8Array[1] === 0xbb &&
        uint8Array[2] === 0xbf
      ) {
        return "utf-8";
      }
    }

    if (uint8Array.length >= 2) {
      // UTF-16 LE BOM
      if (uint8Array[0] === 0xff && uint8Array[1] === 0xfe) {
        return "utf-16le";
      }
      // UTF-16 BE BOM
      if (uint8Array[0] === 0xfe && uint8Array[1] === 0xff) {
        return "utf-16be";
      }
    }

    // 简单的编码检测逻辑
    let hasHighBytes = false;
    let validUtf8 = true;

    for (let i = 0; i < Math.min(uint8Array.length, 1000); i++) {
      const byte = uint8Array[i];

      if (byte > 127) {
        hasHighBytes = true;

        // 检查UTF-8序列
        if ((byte & 0xe0) === 0xc0) {
          // 2字节序列
          if (
            i + 1 >= uint8Array.length ||
            (uint8Array[i + 1] & 0xc0) !== 0x80
          ) {
            validUtf8 = false;
            break;
          }
          i++;
        } else if ((byte & 0xf0) === 0xe0) {
          // 3字节序列
          if (
            i + 2 >= uint8Array.length ||
            (uint8Array[i + 1] & 0xc0) !== 0x80 ||
            (uint8Array[i + 2] & 0xc0) !== 0x80
          ) {
            validUtf8 = false;
            break;
          }
          i += 2;
        } else if ((byte & 0xf8) === 0xf0) {
          // 4字节序列
          if (
            i + 3 >= uint8Array.length ||
            (uint8Array[i + 1] & 0xc0) !== 0x80 ||
            (uint8Array[i + 2] & 0xc0) !== 0x80 ||
            (uint8Array[i + 3] & 0xc0) !== 0x80
          ) {
            validUtf8 = false;
            break;
          }
          i += 3;
        } else if ((byte & 0x80) !== 0) {
          validUtf8 = false;
          break;
        }
      }
    }

    if (!hasHighBytes) {
      return "ascii"; // 纯ASCII，可以用UTF-8解码
    }

    if (validUtf8) {
      return "utf-8";
    }

    // 如果不是有效的UTF-8，假设是GB2312/GBK
    return "gb2312";
  }

  /**
   * 使用指定编码解码文本
   */
  static decodeText(bytes, encoding) {
    const uint8Array = new Uint8Array(bytes);

    try {
      switch (encoding.toLowerCase()) {
        case "utf-8":
          return new TextDecoder("utf-8").decode(uint8Array);
        case "utf-16le":
          return new TextDecoder("utf-16le").decode(uint8Array);
        case "utf-16be":
          return new TextDecoder("utf-16be").decode(uint8Array);
        case "ascii":
          return new TextDecoder("ascii").decode(uint8Array);
        case "gb2312":
        case "gbk":
          return new TextDecoder("gb2312").decode(uint8Array);
        default:
          // 默认尝试UTF-8
          return new TextDecoder("utf-8").decode(uint8Array);
      }
    } catch (error) {
      console.warn(`使用${encoding}解码失败，尝试UTF-8:`, error);
      return new TextDecoder("utf-8", { fatal: false }).decode(uint8Array);
    }
  }

  /**
   * 将文本分割成章节
   */
  static splitTextIntoChapters(text) {
    // 简单的章节分割逻辑，可以根据需要调整
    const chapters = [];
    const lines = text.split("\n");
    let currentChapter = { title: "第一章", content: "" };
    let chapterCount = 1;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // 检测章节标题（简单规则）
      if (
        trimmedLine.match(
          /^(第[\d一二三四五六七八九十百千万]+[章节回折]|Chapter\s+\d+|[\d]+\.|序言|前言|后记|附录)/i
        )
      ) {
        if (currentChapter.content.trim()) {
          chapters.push(currentChapter);
        }
        chapterCount++;
        currentChapter = {
          title: trimmedLine || `第${chapterCount}章`,
          content: "",
        };
      } else {
        currentChapter.content += line + "\n";
      }
    }

    // 添加最后一章
    if (currentChapter.content.trim()) {
      chapters.push(currentChapter);
    }

    // 如果没有检测到章节，将整个文本作为一章
    if (chapters.length === 0) {
      chapters.push({
        title: bookTitle.value || "正文",
        content: text,
      });
    }

    return chapters;
  }

  /**
   * 生成content.opf文件内容
   */
  static generateContentOpf(title, author, chapters) {
    // 生成manifest项目
    const manifestItems = chapters
      .map(
        (chapter, index) =>
          `    <item id="chapter${index + 1}" href="chapter${
            index + 1
          }.xhtml" media-type="application/xhtml+xml"/>`
      )
      .join("\n");

    // 生成spine项目
    const spineItems = chapters
      .map((chapter, index) => `    <itemref idref="chapter${index + 1}"/>`)
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<package version="2.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:identifier id="BookId">urn:uuid:${this.generateUUID()}</dc:identifier>
    <dc:title>${this.escapeXml(title)}</dc:title>
    <dc:creator>${this.escapeXml(author)}</dc:creator>
    <dc:language>zh-CN</dc:language>
    <meta name="cover" content="cover-image"/>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
${manifestItems}
  </manifest>
  <spine toc="ncx">
${spineItems}
  </spine>
</package>`;
  }

  /**
   * 生成toc.ncx文件内容
   */
  static generateTocNcx(title, chapters) {
    // 生成导航点
    const navPoints = chapters
      .map(
        (chapter, index) =>
          `    <navPoint id="navpoint-${index + 1}" playOrder="${index + 1}">
      <navLabel>
        <text>${this.escapeXml(chapter.title)}</text>
      </navLabel>
      <content src="chapter${index + 1}.xhtml"/>
    </navPoint>`
      )
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<ncx version="2005-1" xmlns="http://www.daisy.org/z3986/2005/ncx/">
  <head>
    <meta name="dtb:uid" content="urn:uuid:${this.generateUUID()}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${this.escapeXml(title)}</text>
  </docTitle>
  <navMap>
${navPoints}
  </navMap>
</ncx>`;
  }

  /**
   * 生成章节HTML文件内容
   */
  static generateChapterHtml(title, content) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${this.escapeXml(title)}</title>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
</head>
<body>
  <h1>${this.escapeXml(title)}</h1>
  <div>
    ${content
      .split("\n")
      .map((line) =>
        line.trim() ? `<p>${this.escapeXml(line.trim())}</p>` : ""
      )
      .join("\n")}
  </div>
</body>
</html>`;
  }

  /**
   * 生成UUID
   */
  static generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  /**
   * XML转义
   */
  static escapeXml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
}
