import Theme from "./theme";

export default class StyleUtil {
  /**
   * fontsize 字体大小
   * fontWeight 字体粗细
   * spacing / lineHeight 行距
   * letterSpacing 字间距
   * wordSpacing 单词间距
   * textIndent 段落缩进
   * paragraphSpacing 段落间距
   * justify 是否两端对齐
   * hyphenate 是否自动连字符
   * fontFamily: 字体
   */
  static getStyle() {
    //backgroundColor: '#ffffff', fontColor: '#171717', btnBgColor: '#cccccc'
    const defaultStyle = {
      fontSize: 14,
      fontWeight: 400,
      lineHeight: 1.7,
      letterSpacing: 2.0,
      wordSpacing: 2.5,
      textIndent: 2,
      paragraphSpacing: 1,
      justify: true,
      hyphenate: false,
      writingMode: "horizontal-tb",
      fontColor: "#171717",
      backgroundColor: "#ffffff",
      fontFamily: "Microsoft YaHei",
      btnBgColor: "#cccccc",
      maxColumnCount: 2,
      pageAnimation: "translate", // 新增翻页动画设置，默认为平移
    };
    let json = localStorage.getItem("style");
    return JSON.parse(json) || defaultStyle;
  }

  static setMaxColumnCount(maxColumnCount) {
    localStorage.setItem("maxColumnCount", maxColumnCount);
  }

  static setStyle(bookStyle) {
    localStorage.setItem("style", JSON.stringify(bookStyle));
  }

  static getThemeIndex() {
    // 获取当前的样式
    const currentStyle = this.getStyle();
    // 查找匹配的主题索引
    const index = Theme.getThemes().findIndex(
      (item) =>
        item.backgroundColor === currentStyle.backgroundColor &&
        item.fontColor === currentStyle.fontColor
    );
    // 如果没有找到匹配的索引，返回 0
    return index !== -1 ? index : 0;
  }
}
