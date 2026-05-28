// === 小雨 - Main Renderer ===

document.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('petCanvas');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const chatBubble = document.getElementById('chatBubble');
  const chatText = document.getElementById('chatText');
  const chatIndicator = document.getElementById('chatIndicator');
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsPanel = document.getElementById('settingsPanel');
  const closeSettings = document.getElementById('closeSettings');
  const saveSettingsBtn = document.getElementById('saveSettings');
  const petBtn = document.getElementById('petBtn');
  const feedBtn = document.getElementById('feedBtn');
  const settingsStatus = document.getElementById('settingsStatus');

  // Initialize pet
  const pet = new XiaoYu(canvas);

  // Initialize chat engine
  const chat = new ChatEngine();
  await chat.loadConfig();

  // Persist env-provided config so it survives restart
  if (chat.config.apiKey && chat.config.apiEndpoint !== 'https://api.openai.com/v1') {
    chat.saveConfig({
      apiKey: chat.config.apiKey,
      apiEndpoint: chat.config.apiEndpoint
    });
  }

  // Populate settings
  document.getElementById('sPetName').value = chat.config.petName || '小雨';
  document.getElementById('sApiKey').value = chat.config.apiKey || '';
  document.getElementById('sApiEndpoint').value = chat.config.apiEndpoint || 'https://api.openai.com/v1';
  document.getElementById('sModel').value = chat.config.model || 'gpt-4o-mini';

  // Chat callbacks
  chat.onResponse = (text) => {
    showChatBubble(text);
    pet.setTalking(false);
    pet.setMood('happy');
  };

  chat.onError = (text) => {
    showChatBubble(text, true);
    pet.setTalking(false);
  };

  chat.onThinkingChange = (thinking) => {
    if (thinking) {
      chatIndicator.classList.remove('hidden');
      pet.setTalking(true);
    } else {
      chatIndicator.classList.add('hidden');
    }
  };

  // === Functions ===

  function showChatBubble(text, isError = false) {
    chatText.textContent = text;
    chatText.style.color = isError ? '#e07080' : '#333';
    chatBubble.classList.remove('hidden');

    // Auto-hide after 8 seconds or keep for long messages
    clearTimeout(chatBubble._hideTimer);
    const words = text.length;
    const displayTime = Math.max(4000, Math.min(10000, words * 150));
    chatBubble._hideTimer = setTimeout(() => {
      chatBubble.classList.add('hidden');
      if (!isError) {
        pet.setMood('neutral');
      }
    }, displayTime);
  }

  function hideChatBubble() {
    chatBubble.classList.add('hidden');
  }

  // === Send Message ===

  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    if (chat.isProcessing) return;

    chatInput.value = '';
    chatInput.focus();

    // Show thinking indicator
    chatText.textContent = '';
    chatBubble.classList.remove('hidden');
    chatIndicator.classList.remove('hidden');
    pet.setMood('thinking');
    pet.setTalking(false);
    pet.handPosition = 2;

    await chat.sendMessage(text);

    pet.handPosition = 0;
  }

  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn.addEventListener('click', sendMessage);

  // === Pet Interaction ===

  petBtn.addEventListener('click', () => {
    pet.startPet();
    showChatBubble('(*^▽^*) 被主人摸头了好开心~');
    chat.addSystemMessage('主人摸了小雨的头', '开心');
    setTimeout(() => hideChatBubble(), 3000);
    setTimeout(() => pet.setMood('neutral'), 4000);
  });

  feedBtn.addEventListener('click', () => {
    pet.setMood('happy');
    pet.cheekBlush = 0.9;
    showChatBubble('o(≧v≦)o 哇！是给我的吗？谢谢主人！');
    chat.addSystemMessage('主人给了小雨好吃的零食', '非常开心');
    setTimeout(() => hideChatBubble(), 3000);
    setTimeout(() => pet.setMood('neutral'), 4000);
  });

  // === Settings ===

  settingsBtn.addEventListener('click', () => {
    settingsPanel.classList.remove('hidden');
    document.getElementById('sApiKey').value = chat.config.apiKey || '';
    document.getElementById('sPetName').value = chat.config.petName || '小雨';
    document.getElementById('sApiEndpoint').value = chat.config.apiEndpoint || 'https://api.openai.com/v1';
    document.getElementById('sModel').value = chat.config.model || 'gpt-4o-mini';
    settingsStatus.textContent = '';
  });

  closeSettings.addEventListener('click', () => {
    settingsPanel.classList.add('hidden');
  });

  saveSettingsBtn.addEventListener('click', async () => {
    const newConfig = {
      petName: document.getElementById('sPetName').value || '小雨',
      apiKey: document.getElementById('sApiKey').value,
      apiEndpoint: document.getElementById('sApiEndpoint').value || 'https://api.openai.com/v1',
      model: document.getElementById('sModel').value || 'gpt-4o-mini'
    };

    await chat.saveConfig(newConfig);;
    settingsStatus.textContent = '✓ 保存成功~';
    settingsStatus.style.color = '#6BCB77';
    setTimeout(() => {
      settingsStatus.textContent = '';
    }, 2000);
  });

  // === Welcome Message ===

  // Show welcome after a short delay
  setTimeout(() => {
    if (!chat.config.apiKey) {
      showChatBubble('你好主人！(*^▽^*) 我是小雨！\n点击 ⚙ 输入 API Key 就能和我聊天啦~');
    } else {
      showChatBubble('主人回来啦！(*^▽^*) 小雨好想你呀~');
    }
    pet.wave();
  }, 800);

  // Open settings on tray request
  if (window.electronAPI) {
    window.electronAPI.onOpenSettings(() => {
      settingsPanel.classList.remove('hidden');
    });
  }
});
