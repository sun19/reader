export default class TtsData {
  static getTtsData() {
    //ttsVolume 音量 ttsPitch 音调 ttsRate 语速
    const defaultTtsData = {
      ttsVolume: 1.0,
      ttsPitch: 0.1,
      ttsRate: 0.8,
      ttsVoiceIndex: 0,
      useOnlineTts: false, // 是否使用在线TTS
      onlineTtsConfig: null, // 在线TTS配置
      speakSpeed: 5, // 在线TTS语速
    };
    let json = localStorage.getItem("ttsData");
    return JSON.parse(json) || defaultTtsData;
  }

  static setTtsData(ttsData) {
    localStorage.setItem("ttsData", JSON.stringify(ttsData));
  }

  static getOnlineTtsConfigs() {
    let configs = localStorage.getItem("onlineTtsConfigs");
    return JSON.parse(configs) || [];
  }

  static setOnlineTtsConfigs(configs) {
    localStorage.setItem("onlineTtsConfigs", JSON.stringify(configs));
  }

  static importOnlineTtsConfig(config) {
    const configs = this.getOnlineTtsConfigs();
    // 检查是否已存在相同ID的配置
    const existingIndex = configs.findIndex(c => c.id === config.id);
    if (existingIndex >= 0) {
      configs[existingIndex] = config;
    } else {
      configs.push(config);
    }
    this.setOnlineTtsConfigs(configs);
  }

  static removeOnlineTtsConfig(id) {
    const configs = this.getOnlineTtsConfigs();
    const filteredConfigs = configs.filter(c => c.id !== id);
    this.setOnlineTtsConfigs(filteredConfigs);
  }
}
