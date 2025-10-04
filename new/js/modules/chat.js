/**
 * Chat Module - Handles live chat functionality
 */

export class Chat {
  constructor() {
    this.messages = [];
    this.isVisible = true;
    this.maxMessages = 100;
    this.autoScroll = true;
    this.moderators = new Set();
    this.blockedUsers = new Set();
  }

  async init() {
    try {
      this.setupEventListeners();
      this.loadChatHistory();
      console.log("Chat module initialized");
    } catch (error) {
      console.error("Failed to initialize chat:", error);
      throw error;
    }
  }

  setupEventListeners() {
    // Chat visibility toggle
    document.getElementById("toggleChat")?.addEventListener("click", () => {
      this.toggleVisibility();
    });

    // Clear chat
    document.getElementById("clearChat")?.addEventListener("click", () => {
      this.clearChat();
    });

    // Auto-scroll when new messages arrive
    const chatMessages = document.getElementById("chatMessages");
    if (chatMessages) {
      chatMessages.addEventListener("scroll", () => {
        const isAtBottom =
          chatMessages.scrollTop + chatMessages.clientHeight >=
          chatMessages.scrollHeight - 10;
        this.autoScroll = isAtBottom;
      });
    }
  }

  sendMessage(message) {
    if (!message.trim()) return;

    const messageObj = {
      id: this.generateMessageId(),
      text: message.trim(),
      timestamp: new Date(),
      user: "You",
      type: "user",
      isModerator: false,
    };

    this.addMessage(messageObj);

    // In a real implementation, you would send this to a chat server
    this.simulateMessageResponse(message);
  }

  addMessage(messageObj) {
    this.messages.push(messageObj);

    // Limit message history
    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }

    this.renderMessage(messageObj);
    this.saveChatHistory();
  }

  renderMessage(messageObj) {
    const chatMessages = document.getElementById("chatMessages");
    if (!chatMessages) return;

    // Remove welcome message if it exists
    const welcomeMessage = chatMessages.querySelector(".welcome-message");
    if (welcomeMessage) {
      welcomeMessage.remove();
    }

    const messageElement = this.createMessageElement(messageObj);
    chatMessages.appendChild(messageElement);

    // Auto-scroll to bottom if enabled
    if (this.autoScroll) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  createMessageElement(messageObj) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${messageObj.type}`;
    messageDiv.dataset.messageId = messageObj.id;

    const timestamp = messageObj.timestamp.toLocaleTimeString();

    let messageHTML = `
            <div class="message-content">
                <div class="message-header">
                    <span class="username ${
                      messageObj.isModerator ? "moderator" : ""
                    }">${messageObj.user}</span>
                    <span class="timestamp">${timestamp}</span>
                </div>
                <div class="message-text">${this.escapeHtml(
                  messageObj.text
                )}</div>
            </div>
        `;

    messageDiv.innerHTML = messageHTML;
    return messageDiv;
  }

  simulateMessageResponse(originalMessage) {
    // Simulate AI or other user responses
    setTimeout(() => {
      const responses = [
        "Great stream!",
        "Love the content!",
        "Can you explain that again?",
        "Awesome!",
        "Thanks for the stream!",
        "This is helpful!",
        "Keep it up!",
        "Amazing work!",
      ];

      const randomResponse =
        responses[Math.floor(Math.random() * responses.length)];
      const randomUser = `Viewer${Math.floor(Math.random() * 1000)}`;

      const responseMessage = {
        id: this.generateMessageId(),
        text: randomResponse,
        timestamp: new Date(),
        user: randomUser,
        type: "viewer",
        isModerator: false,
      };

      this.addMessage(responseMessage);
    }, Math.random() * 3000 + 1000); // Random delay between 1-4 seconds
  }

  toggleVisibility() {
    this.isVisible = !this.isVisible;
    const chatContainer = document.querySelector(".chat-container");
    const toggleBtn = document.getElementById("toggleChat");

    if (chatContainer && toggleBtn) {
      if (this.isVisible) {
        chatContainer.style.display = "flex";
        toggleBtn.title = "Hide Chat";
      } else {
        chatContainer.style.display = "none";
        toggleBtn.title = "Show Chat";
      }
    }
  }

  clearChat() {
    if (confirm("Are you sure you want to clear all chat messages?")) {
      this.messages = [];
      const chatMessages = document.getElementById("chatMessages");
      if (chatMessages) {
        chatMessages.innerHTML = `
                    <div class="welcome-message">
                        <div class="message system">
                            <div class="message-content">
                                Chat cleared. New messages will appear here.
                            </div>
                        </div>
                    </div>
                `;
      }
      this.saveChatHistory();
    }
  }

  addSystemMessage(text) {
    const systemMessage = {
      id: this.generateMessageId(),
      text: text,
      timestamp: new Date(),
      user: "System",
      type: "system",
      isModerator: false,
    };

    this.addMessage(systemMessage);
  }

  addModeratorMessage(text, moderatorName = "Moderator") {
    const modMessage = {
      id: this.generateMessageId(),
      text: text,
      timestamp: new Date(),
      user: moderatorName,
      type: "moderator",
      isModerator: true,
    };

    this.addMessage(modMessage);
  }

  blockUser(username) {
    this.blockedUsers.add(username);
    this.addSystemMessage(`User ${username} has been blocked.`);
  }

  unblockUser(username) {
    this.blockedUsers.delete(username);
    this.addSystemMessage(`User ${username} has been unblocked.`);
  }

  addModerator(username) {
    this.moderators.add(username);
    this.addSystemMessage(`${username} is now a moderator.`);
  }

  removeModerator(username) {
    this.moderators.delete(username);
    this.addSystemMessage(`${username} is no longer a moderator.`);
  }

  generateMessageId() {
    return "msg_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  saveChatHistory() {
    try {
      const history = this.messages.slice(-50); // Save last 50 messages
      localStorage.setItem(
        "streamstudio-chat-history",
        JSON.stringify(history)
      );
    } catch (error) {
      console.warn("Failed to save chat history:", error);
    }
  }

  loadChatHistory() {
    try {
      const saved = localStorage.getItem("streamstudio-chat-history");
      if (saved) {
        const history = JSON.parse(saved);
        this.messages = history;

        // Render saved messages
        const chatMessages = document.getElementById("chatMessages");
        if (chatMessages && history.length > 0) {
          chatMessages.innerHTML = "";
          history.forEach(message => {
            this.renderMessage(message);
          });
        }
      }
    } catch (error) {
      console.warn("Failed to load chat history:", error);
    }
  }

  exportChat() {
    const chatData = {
      exportDate: new Date().toISOString(),
      messageCount: this.messages.length,
      messages: this.messages,
    };

    const blob = new Blob([JSON.stringify(chatData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-export-${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }

  getChatStats() {
    const now = new Date();
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

    const recentMessages = this.messages.filter(
      msg => msg.timestamp > lastHour
    );
    const uniqueUsers = new Set(this.messages.map(msg => msg.user));

    return {
      totalMessages: this.messages.length,
      messagesLastHour: recentMessages.length,
      uniqueUsers: uniqueUsers.size,
      moderators: this.moderators.size,
      blockedUsers: this.blockedUsers.size,
    };
  }

  cleanup() {
    this.saveChatHistory();
    this.messages = [];
  }
}
