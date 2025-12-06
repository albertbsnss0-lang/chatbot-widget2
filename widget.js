(function () {
  // Wait for ChatWidgetConfig
  function waitForConfig(callback) {
    if (window.ChatWidgetConfig) {
      callback(window.ChatWidgetConfig);
    } else {
      setTimeout(() => waitForConfig(callback), 30);
    }
  }

  waitForConfig(initChatWidget);

  function initChatWidget(config) {
    // Create the widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'n8n-chat-widget';
    widgetContainer.style.position = 'fixed';
    widgetContainer.style.bottom = '20px';
    widgetContainer.style.right = config.style.position === 'left' ? 'auto' : '20px';
    widgetContainer.style.left = config.style.position === 'left' ? '20px' : 'auto';
    widgetContainer.style.zIndex = '999999';

    // Chat bubble button
    const chatButton = document.createElement('button');
    chatButton.className = 'n8n-chat-widget-button';
    chatButton.style.width = '62px';
    chatButton.style.height = '62px';
    chatButton.style.borderRadius = '50%';
    chatButton.style.border = 'none';
    chatButton.style.cursor = 'pointer';
    chatButton.style.display = 'flex';
    chatButton.style.alignItems = 'center';
    chatButton.style.justifyContent = 'center';
    chatButton.style.background = config.style.secondaryColor;

    chatButton.innerHTML = `
      <svg width="30" height="30" viewBox="0 0 24 24">
        <path fill="white" d="M12 3C7.03 3 3 6.72 3 11c0 2.01.94 3.84 2.5 5.22V21l4.52-2.26c.63.14 1.29.21 1.98.21 4.97 0 9-3.72 9-8s-4.03-8-9-8z"/>
      </svg>
    `;

    // Chat window container
    const chatWindow = document.createElement('div');
    chatWindow.style.width = '380px';
    chatWindow.style.height = '520px';
    chatWindow.style.background = config.style.backgroundColor;
    chatWindow.style.border = '1px solid #ddd';
    chatWindow.style.borderRadius = '18px';
    chatWindow.style.boxShadow = '0 6px 18px rgba(0,0,0,0.15)';
    chatWindow.style.display = 'none';
    chatWindow.style.flexDirection = 'column';

    // Header
    const header = document.createElement('div');
    header.style.padding = '16px';
    header.style.borderBottom = '1px solid #eee';
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.gap = '12px';

    header.innerHTML = `
      <img src="${config.branding.logo}" style="width:42px;height:42px;border-radius:8px;">
      <div style="display:flex;flex-direction:column;">
        <span class="chatbot-header-title">${config.branding.name}</span>
        <small style="color:#555;font-size:13px;">${config.branding.responseTimeText}</small>
      </div>
    `;

    // Messages container
    const messagesDiv = document.createElement('div');
    messagesDiv.style.flex = '1';
    messagesDiv.style.padding = '16px';
    messagesDiv.style.overflowY = 'auto';

    // Input area
    const inputWrapper = document.createElement('div');
    inputWrapper.style.display = 'flex';
    inputWrapper.style.borderTop = '1px solid #eee';
    inputWrapper.style.padding = '10px';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Type a message...';
    input.style.flex = '1';
    input.style.padding = '12px';
    input.style.borderRadius = '12px';
    input.style.border = '1px solid #ccc';

    const sendBtn = document.createElement('button');
    sendBtn.className = 'chatbot-button-primary';
    sendBtn.innerText = 'Send';
    sendBtn.style.marginLeft = '10px';
    sendBtn.style.padding = '10px 16px';
    sendBtn.style.border = 'none';
    sendBtn.style.borderRadius = '12px';
    sendBtn.style.cursor = 'pointer';

    inputWrapper.appendChild(input);
    inputWrapper.appendChild(sendBtn);

    // Append elements
    chatWindow.appendChild(header);
    chatWindow.appendChild(messagesDiv);
    chatWindow.appendChild(inputWrapper);
    widgetContainer.appendChild(chatButton);
    widgetContainer.appendChild(chatWindow);
    document.body.appendChild(widgetContainer);

    // Handle open/close
    chatButton.addEventListener('click', () => {
      chatWindow.style.display = chatWindow.style.display === 'none' ? 'flex' : 'none';
    });

    // Add messages
    function addMessage(text, isBot = false) {
      const msg = document.createElement('div');
      msg.className = isBot ? 'chatbot-bot-message' : 'chatbot-user-message';
      msg.style.marginBottom = '12px';
      msg.innerHTML = text.replace(/\n/g, '<br>');

      messagesDiv.appendChild(msg);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    // Send message to webhook
    async function sendMessage() {
      const text = input.value.trim();
      if (!text) return;

      addMessage(text, false);
      input.value = '';

      try {
        const res = await fetch(config.webhook.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            route: config.webhook.route
          })
        });

        const data = await res.json();
        if (data.reply) addMessage(data.reply, true);
      } catch (err) {
        addMessage("Error connecting to server.", true);
      }
    }

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', e => {
      if (e.key === 'Enter') sendMessage();
    });

    // Show welcome message
    addMessage(config.branding.welcomeText, true);
  }
})();
