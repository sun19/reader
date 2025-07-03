/**
 * 阅读设置管理工具
 * 负责保存和加载全局阅读设置
 */

// 默认设置
const DEFAULT_SETTINGS = {
  fontSize: 16,
  lineHeight: 1.8,
  fontFamily: 'Microsoft YaHei',
  backgroundColor: '#ffffff',
  textColor: '#333333',
  isDarkMode: false,
  paragraphSpacing: 12 // 新增段间距设置
};

const SETTINGS_KEY = 'reader_settings';

/**
 * 加载阅读设置
 * @returns {Object} 阅读设置对象
 */
export function loadSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const settings = JSON.parse(saved);
      return { ...DEFAULT_SETTINGS, ...settings };
    }
  } catch (error) {
    console.error('加载设置失败:', error);
  }
  return { ...DEFAULT_SETTINGS };
}

/**
 * 保存阅读设置
 * @param {Object} settings - 要保存的设置
 */
export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('保存设置失败:', error);
  }
}

/**
 * 更新单个设置项
 * @param {string} key - 设置项键名
 * @param {any} value - 设置项值
 */
export function updateSetting(key, value) {
  const currentSettings = loadSettings();
  currentSettings[key] = value;
  saveSettings(currentSettings);
  return currentSettings;
}

/**
 * 重置设置为默认值
 */
export function resetSettings() {
  saveSettings(DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS };
}