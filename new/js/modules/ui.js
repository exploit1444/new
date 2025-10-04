/**
 * UI Module - Handles user interface interactions and updates
 */

export class UI {
  constructor() {
    this.isInitialized = false;
    this.activeModals = new Set();
    this.notifications = [];
    this.theme = "dark";
    this.settings = {
      autoSave: true,
      showNotifications: true,
      compactMode: false,
      animations: true,
    };
  }

  async init() {
    try {
      this.loadSettings();
      this.setupEventListeners();
      this.initializeUI();
      this.isInitialized = true;
      console.log("UI module initialized");
    } catch (error) {
      console.error("Failed to initialize UI:", error);
      throw error;
    }
  }

  setupEventListeners() {
    // Modal management
    document.addEventListener("click", e => {
      if (e.target.classList.contains("modal")) {
        this.closeModal(e.target);
      }
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", e => {
      this.handleKeyboardShortcuts(e);
    });

    // Window events
    window.addEventListener("beforeunload", () => {
      this.saveSettings();
    });

    // AI command events
    document.addEventListener("ai-start-recording", () => {
      if (window.streamStudio) {
        window.streamStudio.startRecording();
      }
    });

    document.addEventListener("ai-stop-recording", () => {
      if (window.streamStudio) {
        window.streamStudio.stopRecording();
      }
    });

    document.addEventListener("ai-start-streaming", () => {
      if (window.streamStudio) {
        window.streamStudio.startStreaming();
      }
    });

    document.addEventListener("ai-stop-streaming", () => {
      if (window.streamStudio) {
        window.streamStudio.stopStreaming();
      }
    });

    document.addEventListener("ai-take-screenshot", () => {
      if (window.streamStudio) {
        window.streamStudio.takeScreenshot();
      }
    });

    document.addEventListener("ai-toggle-mute", () => {
      if (window.streamStudio) {
        window.streamStudio.toggleMute();
      }
    });

    document.addEventListener("ai-clear-chat", () => {
      if (window.streamStudio && window.streamStudio.chat) {
        window.streamStudio.chat.clearChat();
      }
    });
  }

  initializeUI() {
    this.setupAudioMeters();
    this.setupMicrophoneSelection();
    this.updateTheme();
    this.loadUserPreferences();
  }

  setupAudioMeters() {
    // Initialize audio meters with default values
    const micMeter = document.getElementById("micMeter");
    const systemMeter = document.getElementById("systemMeter");

    if (micMeter) micMeter.style.width = "0%";
    if (systemMeter) systemMeter.style.width = "0%";
  }

  async setupMicrophoneSelection() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(
        device => device.kind === "audioinput"
      );

      const micSelect = document.getElementById("micSelect");
      if (micSelect) {
        micSelect.innerHTML = '<option value="">Select Microphone</option>';

        audioInputs.forEach(device => {
          const option = document.createElement("option");
          option.value = device.deviceId;
          option.textContent =
            device.label || `Microphone ${device.deviceId.slice(0, 8)}`;
          micSelect.appendChild(option);
        });
      }
    } catch (error) {
      console.warn("Failed to enumerate audio devices:", error);
    }
  }

  handleKeyboardShortcuts(event) {
    // Don't trigger shortcuts when typing in inputs
    if (
      event.target.tagName === "INPUT" ||
      event.target.tagName === "TEXTAREA"
    ) {
      return;
    }

    const isCtrl = event.ctrlKey || event.metaKey;

    switch (event.key.toLowerCase()) {
      case "f1":
        event.preventDefault();
        this.showHelp();
        break;
      case "f2":
        event.preventDefault();
        this.toggleRecording();
        break;
      case "f3":
        event.preventDefault();
        this.toggleStreaming();
        break;
      case "f4":
        event.preventDefault();
        this.takeScreenshot();
        break;
      case "f5":
        event.preventDefault();
        this.refreshSources();
        break;
      case "f12":
        event.preventDefault();
        this.toggleDeveloperTools();
        break;
      case "escape":
        this.closeAllModals();
        break;
      case "s":
        if (isCtrl) {
          event.preventDefault();
          this.saveSettings();
        }
        break;
    }
  }

  toggleRecording() {
    if (window.streamStudio) {
      if (window.streamStudio.isRecording) {
        window.streamStudio.stopRecording();
      } else {
        window.streamStudio.startRecording();
      }
    }
  }

  toggleStreaming() {
    if (window.streamStudio) {
      if (window.streamStudio.isStreaming) {
        window.streamStudio.stopStreaming();
      } else {
        window.streamStudio.startStreaming();
      }
    }
  }

  takeScreenshot() {
    if (window.streamStudio && window.streamStudio.recorder) {
      window.streamStudio.recorder.takeScreenshot();
    }
  }

  refreshSources() {
    this.setupMicrophoneSelection();
    this.showNotification("Sources refreshed", "success");
  }

  toggleDeveloperTools() {
    // Toggle developer tools visibility
    const devTools = document.getElementById("devTools");
    if (devTools) {
      devTools.style.display =
        devTools.style.display === "none" ? "block" : "none";
    } else {
      this.createDeveloperTools();
    }
  }

  createDeveloperTools() {
    const devTools = document.createElement("div");
    devTools.id = "devTools";
    devTools.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 300px;
            height: 200px;
            background: var(--bg-secondary);
            border: 1px solid var(--border-primary);
            border-radius: 8px;
            padding: 16px;
            z-index: 1000;
            overflow-y: auto;
            font-family: monospace;
            font-size: 12px;
        `;

    devTools.innerHTML = `
            <h4>Developer Tools</h4>
            <div id="devStats"></div>
            <button onclick="this.parentElement.remove()">Close</button>
        `;

    document.body.appendChild(devTools);
    this.updateDeveloperStats();
  }

  updateDeveloperStats() {
    const devStats = document.getElementById("devStats");
    if (!devStats) return;

    const stats = {
      recording: window.streamStudio?.isRecording || false,
      streaming: window.streamStudio?.isStreaming || false,
      chatMessages: window.streamStudio?.chat?.messages?.length || 0,
      transcriptSegments:
        window.streamStudio?.transcript?.transcript?.length || 0,
      aiCommands: window.streamStudio?.ai?.commandHistory?.length || 0,
    };

    devStats.innerHTML = Object.entries(stats)
      .map(([key, value]) => `<div>${key}: ${value}</div>`)
      .join("");
  }

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add("active");
      this.activeModals.add(modalId);
      document.body.style.overflow = "hidden";
    }
  }

  closeModal(modal) {
    const modalId = modal.id;
    modal.classList.remove("active");
    this.activeModals.delete(modalId);

    if (this.activeModals.size === 0) {
      document.body.style.overflow = "";
    }
  }

  closeAllModals() {
    this.activeModals.forEach(modalId => {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove("active");
      }
    });
    this.activeModals.clear();
    document.body.style.overflow = "";
  }

  showNotification(message, type = "info", duration = 3000) {
    if (!this.settings.showNotifications) return;

    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Style the notification
    Object.assign(notification.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "12px 16px",
      borderRadius: "8px",
      color: "white",
      fontWeight: "500",
      zIndex: "10000",
      opacity: "0",
      transform: "translateX(100%)",
      transition: "all 0.3s ease",
      maxWidth: "300px",
      wordWrap: "break-word",
    });

    // Set background color based on type
    const colors = {
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
      info: "#6366f1",
    };
    notification.style.backgroundColor = colors[type] || colors.info;

    document.body.appendChild(notification);
    this.notifications.push(notification);

    // Animate in
    setTimeout(() => {
      notification.style.opacity = "1";
      notification.style.transform = "translateX(0)";
    }, 10);

    // Remove after duration
    setTimeout(() => {
      this.removeNotification(notification);
    }, duration);
  }

  removeNotification(notification) {
    notification.style.opacity = "0";
    notification.style.transform = "translateX(100%)";

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }

      const index = this.notifications.indexOf(notification);
      if (index > -1) {
        this.notifications.splice(index, 1);
      }
    }, 300);
  }

  updateTheme(theme = "dark") {
    this.theme = theme;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("streamstudio-theme", theme);
  }

  toggleTheme() {
    const newTheme = this.theme === "dark" ? "light" : "dark";
    this.updateTheme(newTheme);
  }

  loadUserPreferences() {
    // Load saved preferences
    const savedTheme = localStorage.getItem("streamstudio-theme");
    if (savedTheme) {
      this.updateTheme(savedTheme);
    }

    // Load window size and position
    const savedWindowState = localStorage.getItem("streamstudio-window-state");
    if (savedWindowState) {
      try {
        const state = JSON.parse(savedWindowState);
        // Apply window state if needed
      } catch (error) {
        console.warn("Failed to load window state:", error);
      }
    }
  }

  saveSettings() {
    try {
      localStorage.setItem(
        "streamstudio-ui-settings",
        JSON.stringify(this.settings)
      );
      localStorage.setItem(
        "streamstudio-window-state",
        JSON.stringify({
          width: window.innerWidth,
          height: window.innerHeight,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.warn("Failed to save UI settings:", error);
    }
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem("streamstudio-ui-settings");
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn("Failed to load UI settings:", error);
    }
  }

  showHelp() {
    const helpContent = `
            <h2>Keyboard Shortcuts</h2>
            <ul>
                <li><kbd>F1</kbd> - Show this help</li>
                <li><kbd>F2</kbd> - Toggle recording</li>
                <li><kbd>F3</kbd> - Toggle streaming</li>
                <li><kbd>F4</kbd> - Take screenshot</li>
                <li><kbd>F5</kbd> - Refresh sources</li>
                <li><kbd>F12</kbd> - Toggle developer tools</li>
                <li><kbd>Esc</kbd> - Close all modals</li>
                <li><kbd>Ctrl+S</kbd> - Save settings</li>
            </ul>
            
            <h2>AI Voice Commands</h2>
            <ul>
                <li>"Start recording" - Begin recording</li>
                <li>"Stop recording" - End recording</li>
                <li>"Go live" - Start streaming</li>
                <li>"End stream" - Stop streaming</li>
                <li>"Take screenshot" - Capture screenshot</li>
                <li>"Mute audio" - Toggle audio mute</li>
                <li>"Clear chat" - Clear chat messages</li>
            </ul>
        `;

    this.showModalWithContent("Help", helpContent);
  }

  showModalWithContent(title, content) {
    const modalId = "helpModal";
    let modal = document.getElementById(modalId);

    if (!modal) {
      modal = document.createElement("div");
      modal.id = modalId;
      modal.className = "modal";
      modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${title}</h2>
                        <button class="modal-close" onclick="this.closest('.modal').classList.remove('active')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div id="helpContent"></div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn primary" onclick="this.closest('.modal').classList.remove('active')">Close</button>
                    </div>
                </div>
            `;
      document.body.appendChild(modal);
    }

    const helpContent = document.getElementById("helpContent");
    if (helpContent) {
      helpContent.innerHTML = content;
    }

    this.showModal(modalId);
  }

  updateStats() {
    // Update recording stats
    if (window.streamStudio?.recorder) {
      const stats = window.streamStudio.recorder.getRecordingStats();
      document.getElementById(
        "fileSize"
      ).textContent = `${stats.fileSize.toFixed(1)} MB`;
      document.getElementById("bitrate").textContent = `${stats.bitrate.toFixed(
        0
      )} kbps`;
    }

    // Update streaming stats
    if (window.streamStudio?.streamer) {
      const stats = window.streamStudio.streamer.getStreamingStats();
      document.getElementById("viewerCount").textContent = stats.viewerCount;
    }

    // Update developer stats
    this.updateDeveloperStats();
  }

  startStatsUpdate() {
    // Update stats every second
    setInterval(() => {
      this.updateStats();
    }, 1000);
  }

  cleanup() {
    this.saveSettings();
    this.closeAllModals();
    this.notifications.forEach(notification => {
      this.removeNotification(notification);
    });
  }
}
