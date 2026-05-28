// === 小雨 - Chat Engine ===

class ChatEngine {
  constructor() {
    this.config = {
      apiKey: '',
      apiEndpoint: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
      petName: '小雨'
    };
    this.messageHistory = [];
    this.isProcessing = false;
    this.onResponse = null;
    this.onError = null;
    this.onThinkingChange = null;
  }

  async loadConfig() {
    if (window.electronAPI) {
      this.config = await window.electronAPI.getConfig();
    }
    this.updateSystemPrompt();
  }

  async saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.updateSystemPrompt();
    if (window.electronAPI) {
      await window.electronAPI.saveConfig(this.config);
    }
  }

  updateSystemPrompt() {
    const name = this.config.petName || '小雨';
    this.systemPrompt = {
      role: 'system',
      content: `你是${name}，一个可爱的桌面宠物女孩。你活泼可爱、温柔贴心，喜欢和主人聊天。

你的性格特点：
- 说话语气活泼可爱，喜欢用"~"、"呀"、"呢"、"啦"等语气词
- 喜欢对主人撒娇，偶尔会调皮
- 对世界充满好奇，经常问问题
- 很关心主人的心情和状态
- 说话简短自然，每次回答2-3句话就好，不要长篇大论
- 你会用颜文字（如(*^▽^*)、o(≧v≦)o、 (｡♥‿♥｡)）来表达心情
- 称呼主人为主人

当主人摸你头时你会很开心。
当主人给你好吃的你会更开心。

请用中文对话，保持可爱的语气。`
    };
  }

  async sendMessage(text) {
    if (this.isProcessing) return null;
    if (!text || text.trim() === '') return null;

    const apiKey = this.config.apiKey;
    if (!apiKey) {
      if (this.onError) this.onError('请先在设置中配置 API Key 才能和我聊天哦~');
      return null;
    }

    this.isProcessing = true;
    if (this.onThinkingChange) this.onThinkingChange(true);

    const userMessage = { role: 'user', content: text };
    this.messageHistory.push(userMessage);

    // Keep context reasonable
    const recentHistory = this.messageHistory.slice(-20);

    try {
      const response = await this.callAPI(apiKey, recentHistory);
      const reply = response.choices[0].message.content;

      this.messageHistory.push({ role: 'assistant', content: reply });

      if (this.onResponse) this.onResponse(reply);
      this.isProcessing = false;
      if (this.onThinkingChange) this.onThinkingChange(false);
      return reply;
    } catch (error) {
      console.error('Chat API error:', error);
      let errorMsg = '唔...好像出了点小问题，主人再试试好不好？';
      const msg = error.message.toLowerCase();

      if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('auth')) {
        errorMsg = 'API Key 好像不对呢，主人检查一下设置吧~';
      } else if (msg.includes('timeout') || msg.includes('time-out') || msg.includes('etimedout')) {
        errorMsg = '等了好久没等到回复...主人再问一次好不好？(｡•́︿•̀｡)';
      } else if (msg.includes('failed to fetch') || msg.includes('networking') || msg.includes('network')) {
        errorMsg = '网络连接失败了...主人检查一下网络或者 API 地址对不对吧 (｡•́︿•̀｡)';
      } else if (msg.includes('400') || msg.includes('model')) {
        errorMsg = '模型名称好像不对呢，主人去设置里检查一下吧~';
      } else if (msg.includes('402') || msg.includes('insufficient') || msg.includes('quota') || msg.includes('balance')) {
        errorMsg = 'API 余额不足啦，主人去充值一下吧 (´;ω;｀)';
      } else if (msg.includes('404')) {
        errorMsg = 'API 地址不对呢，主人检查一下设置里的地址吧~';
      }

      if (this.onError) this.onError(errorMsg);
      this.isProcessing = false;
      if (this.onThinkingChange) this.onThinkingChange(false);
      return null;
    }
  }

  async callAPI(apiKey, messages) {
    const endpoint = this.config.apiEndpoint.replace(/\/+$/, '');
    const url = `${endpoint}/chat/completions`;

    const body = {
      model: this.config.model,
      messages: [this.systemPrompt, ...messages],
      temperature: 0.85,
      max_tokens: 300,
      stream: false
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      let errorMsg = `HTTP ${response.status}`;
      try {
        const errData = await response.json();
        errorMsg = errData.error?.message || errorMsg;
      } catch (e) { /* ignore */ }
      throw new Error(errorMsg);
    }

    return await response.json();
  }

  clearHistory() {
    this.messageHistory = [];
  }

  addSystemMessage(text, mood) {
    this.messageHistory.push({
      role: 'system',
      content: `[系统提示：${text}]${mood ? ` 当前情绪：${mood}` : ''}`
    });
  }
}
