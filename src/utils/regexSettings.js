export default class RegexSettings {
  static STORAGE_KEY = "reader_regex_settings";

  /**
   * 获取正则表达式设置
   * @returns {Object} 正则表达式设置对象
   */
  static getSettings() {
    const settingsStr = localStorage.getItem(this.STORAGE_KEY);
    return settingsStr ? JSON.parse(settingsStr) : {
      enabled: false,
      pattern: "",
      flags: "g",
      highlightColor: "#ffff00"
    };
  }

  /**
   * 保存正则表达式设置
   * @param {Object} settings 正则表达式设置对象
   */
  static saveSettings(settings) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
  }

  /**
   * 更新正则表达式设置
   * @param {Object} newSettings 新的设置对象
   */
  static updateSettings(newSettings) {
    const currentSettings = this.getSettings();
    const updatedSettings = { ...currentSettings, ...newSettings };
    this.saveSettings(updatedSettings);
    return updatedSettings;
  }
}