import TtsData from "./ttsData";

export default class Tts {
  static synth = window.speechSynthesis;
  static voices = this.synth.getVoices();
  static isInit = false;
  static audio = null; // 用于播放在线TTS音频

  static getHere = () => "";
  static getNextVoiceText = () => "";
  static getPrevVoiceText = () => "";
  static currentVoiceText = ""; //当前的播放的文本

  static getVoices() {
    const voices = this.synth.getVoices();
    return voices;
  }
  static utterance = null;

  // 初始化语音合成功能
  static init(here, next, prev) {
    if (this.isInit) return;
    this.getHere = here;
    this.isInit = true;
    this.getNextVoiceText = next;
    this.getPrevVoiceText = prev;
  }

  static async speak(content) {
    if (content != null) {
      this.currentVoiceText = content;
    } else {
      this.currentVoiceText = this.getHere();
    }

    if (!this.isInit) {
      console.error("Tts is not initialized. Call Tts.init() first.");
      return;
    }

    const ttsData = TtsData.getTtsData();

    if (ttsData.useOnlineTts && ttsData.onlineTtsConfig) {
      // 使用在线TTS
      await this.speakOnline();
    } else {
      // 使用本地TTS
      this.initUtterace();
      this.synth.speak(this.utterance);

      this.utterance.onend = async () => {
        console.log("Speech synthesis ended.");
        const nextText = await this.getNextVoiceText();
        if (nextText) {
          this.currentVoiceText = nextText;
          return this.speak(this.currentVoiceText);
        }
      };
    }
  }

  static async speakOnline() {
    const ttsData = TtsData.getTtsData();
    const config = ttsData.onlineTtsConfig;

    if (!config) {
      console.error("No online TTS configuration found.");
      return;
    }

    try {
      // 解析URL模板
      let url = config.url;
      let method = "GET";
      let body = null;
      let headers = {};

      // 解析配置中的参数
      if (config.url && config.method && config.body) {
        url = config.url;
        method = config.method || "GET";

        // 替换body中的模板变量
        body = config.body
          .replace(/{{java.encodeURI\(java.encodeURI\(speakText\)\)}}/g, encodeURIComponent(encodeURIComponent(this.currentVoiceText)))
          .replace(/{{speakText}}/g, this.currentVoiceText)
          .replace(/{{speakSpeed}}/g, ttsData.speakSpeed)
          .replace(/{{\(speakSpeed \+ 5\) \/ 10 \+ 4}}/g, ((ttsData.speakSpeed + 5) / 10 + 4).toString());

        // 处理headers
        if (config.contentType) {
          headers['Content-Type'] = config.contentType;
        }

        if (config.headers) {
          headers = { ...headers, ...config.headers };
        }
      }
      else if (config.url.includes(",{")) {
        console.log(config.url);

        // 清理URL中的反引号和多余空格
        let cleanUrl = config.url.replace(/[`']/g, '').trim();

        // 尝试解析配置JSON
        try {
          const [urlPart, configPart] = cleanUrl.split(",{" + "}");
          url = urlPart.trim();
          console.log(urlPart);


          // 修复JSON格式，确保正确闭合
          let fixedConfigPart = configPart.trim();
          if (!fixedConfigPart.endsWith('}')) {
            fixedConfigPart += '}';
          }

          const configObj = JSON.parse("{" + fixedConfigPart);

          method = configObj.method || "GET";

          // 替换模板变量
          if (configObj.body) {
            body = configObj.body
              .replace(/{{java.encodeURI\(java.encodeURI\(speakText\)\)}}/g, encodeURIComponent(encodeURIComponent(this.currentVoiceText)))
              .replace(/{{speakText}}/g, this.currentVoiceText)
              .replace(/{{speakSpeed}}/g, ttsData.speakSpeed)
              .replace(/{{\(speakSpeed \+ 5\) \/ 10 \+ 4}}/g, ((ttsData.speakSpeed + 5) / 10 + 4).toString());
          }

          if (configObj.headers) {
            headers = configObj.headers;
          }
        } catch (parseError) {
          console.error('JSON解析错误，使用纯URL模式:', parseError);
          // 如果JSON解析失败，回退到纯URL模式
          url = cleanUrl.split(",{")[0].trim();
          // 直接替换URL中的模板变量
          url = url
            .replace(/{{java.encodeURI\(java.encodeURI\(speakText\)\)}}/g, encodeURIComponent(encodeURIComponent(this.currentVoiceText)))
            .replace(/{{speakText}}/g, this.currentVoiceText)
            .replace(/{{speakSpeed}}/g, ttsData.speakSpeed)
            .replace(/{{\(speakSpeed \+ 5\) \/ 10 \+ 4}}/g, ((ttsData.speakSpeed + 5) / 10 + 4).toString());
        }
      } else {
        // 如果没有配置JSON，直接替换URL中的模板变量
        url = url
          .replace(/{{java.encodeURI\(java.encodeURI\(speakText\)\)}}/g, encodeURIComponent(encodeURIComponent(this.currentVoiceText)))
          .replace(/{{speakText}}/g, this.currentVoiceText)
          .replace(/{{speakSpeed}}/g, ttsData.speakSpeed)
          .replace(/{{\(speakSpeed \+ 5\) \/ 10 \+ 4}}/g, ((ttsData.speakSpeed + 5) / 10 + 4).toString());
      }

      // 处理contentType和header
      if (config.contentType) {
        headers['Content-Type'] = config.contentType;
      }

      if (config.header) {
        try {
          const headerObj = JSON.parse(config.header);
          headers = { ...headers, ...headerObj };
        } catch (e) {
          console.warn('Invalid header format:', config.header);
        }
      }

      // 发送HTTP请求
      const response = await fetch(url, {
        method: method,
        headers: headers,
        body: method !== "GET" ? body : null
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 获取音频数据
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // 停止当前音频
      if (this.audio) {
        this.audio.pause();
        this.audio = null;
      }

      // 创建新的音频对象
      this.audio = new Audio(audioUrl);

      // 设置音量
      this.audio.volume = ttsData.ttsVolume;

      // 播放音频
      this.audio.play();

      // 音频播放结束后的处理
      this.audio.onended = async () => {
        URL.revokeObjectURL(audioUrl);
        const nextText = await this.getNextVoiceText();
        if (nextText) {
          this.currentVoiceText = nextText;
          return this.speak(this.currentVoiceText);
        }
      };

    } catch (error) {
      console.error("Online TTS error:", error);

      // 显示用户提示
      const errorMessage = error.message.includes("HTTP error")
        ? `在线TTS请求失败: ${error.message}\n已自动切换到本地TTS引擎`
        : `在线TTS服务异常: ${error.message}\n已自动切换到本地TTS引擎`;

      // 创建提示元素
      const toast = document.createElement('div');
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #ff4444;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-size: 14px;
        max-width: 300px;
        word-wrap: break-word;
        animation: slideIn 0.3s ease-out;
      `;
      toast.textContent = errorMessage;

      // 添加动画样式
      const style = document.createElement('style');
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);

      document.body.appendChild(toast);

      // 3秒后自动移除提示
      setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
          if (style.parentNode) {
            style.parentNode.removeChild(style);
          }
        }, 300);
      }, 3000);

      // 在线TTS失败时回退到本地TTS
      this.initUtterace();
      this.synth.speak(this.utterance);

      this.utterance.onend = async () => {
        const nextText = await this.getNextVoiceText();
        if (nextText) {
          this.currentVoiceText = nextText;
          return this.speak(this.currentVoiceText);
        }
      };
    }
  }

  static setUtterance(ttsDataObj) {
    const newObj = { ...TtsData.getTtsData(), ...ttsDataObj };
    TtsData.setTtsData(newObj);

    if (this.synth.speaking) {
      this.synth.pause();
      this.utterance.volume = newObj.ttsVolume;
      this.utterance.rate = newObj.ttsRate;
      this.utterance.pitch = newObj.ttsPitch;
      this.utterance.voice = this.voices[newObj.ttsVoiceIndex];
      this.synth.resume();
    }

    // 更新在线TTS音频音量
    if (this.audio) {
      this.audio.volume = newObj.ttsVolume;
    }
  }

  static initUtterace() {
    this.utterance = new SpeechSynthesisUtterance(this.currentVoiceText);
    const ttsDataObj = TtsData.getTtsData();
    this.utterance.volume = ttsDataObj.ttsVolume;
    this.utterance.rate = ttsDataObj.ttsRate;
    this.utterance.pitch = ttsDataObj.ttsPitch;
    this.utterance.voice = this.voices[ttsDataObj.ttsVoiceIndex || 0];
  }

  static async speakPrev() {
    if (this.synth.speaking || this.audio) {
      this.stop();
      const prevText = await this.getPrevVoiceText();
      if (prevText) {
        this.currentVoiceText = prevText;
        return this.speak(this.currentVoiceText);
      }
    }
  }

  static async speakNext() {
    if (this.synth.speaking || this.audio) {
      this.stop();
      const nextText = await this.getNextVoiceText();
      if (nextText) {
        this.currentVoiceText = nextText;
        return this.speak(this.currentVoiceText);
      }
    }
  }

  static async resumeSpeak() {
    const ttsData = TtsData.getTtsData();

    if (ttsData.useOnlineTts && this.audio) {
      this.audio.play();
      this.audio.onended = async () => {
        const nextText = await this.getNextVoiceText();
        if (nextText) {
          this.currentVoiceText = nextText;
          return this.speak(this.currentVoiceText);
        }
      };
    } else if (this.synth.paused) {
      this.synth.resume();
      this.utterance.onend = async () => {
        const nextText = await this.getNextVoiceText();
        if (nextText) {
          this.currentVoiceText = nextText;
          return this.speak(this.currentVoiceText);
        }
      };
    }
  }

  static pause() {
    if (this.synth.speaking) {
      this.synth.pause();
    }
    if (this.audio) {
      this.audio.pause();
    }
  }

  static resume() {
    if (this.synth.paused) {
      this.synth.resume();
    }
    if (this.audio) {
      this.audio.play();
    }
  }

  static stop() {
    this.synth.cancel();
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
    window.ttsStop();
  }
}
