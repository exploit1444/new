/**
 * StreamStudio - Main Application Controller
 * Professional Recording & Streaming Platform with AI Integration
 */

import { Recorder } from "./modules/recorder.js";
import { Streamer } from "./modules/streamer.js";
import { Chat } from "./modules/chat.js";
import { Transcript } from "./modules/transcript.js";
import { AI } from "./modules/ai.js";
import { UI } from "./modules/ui.js";

class StreamStudio {
  constructor() {
    this.recorder = new Recorder();
    this.streamer = new Streamer();
    this.chat = new Chat();
    this.transcript = new Transcript();
    this.ai = new AI();
    this.ui = new UI();

    this.isRecording = false;
    this.isStreaming = false;
    this.currentSource = null;

    // Auth state
    this.auth = this.loadAuth();
    this.postAuthAction = null;

    this.init();
  }

  async init() {
    try {
      // Initialize all modules
      await this.recorder.init();
      await this.streamer.init();
      await this.chat.init();
      await this.transcript.init();
      await this.ai.init();
      await this.ui.init();

      // Set up event listeners
      this.setupEventListeners();

      // Update UI state
      this.updateUI();
      this.updateAuthNav();

      // Start periodic UI stats updates
      this.ui.startStatsUpdate();

      console.log("StreamStudio initialized successfully");
    } catch (error) {
      console.error("Failed to initialize StreamStudio:", error);
      this.showError("Failed to initialize application");
    }
  }

  setupEventListeners() {
    // Recording controls
    document
      .getElementById("startRecording")
      .addEventListener("click", () => this.startRecording());
    document
      .getElementById("stopRecording")
      .addEventListener("click", () => this.stopRecording());

    // Streaming controls
    document
      .getElementById("startStream")
      .addEventListener("click", () => this.startStreaming());
    document
      .getElementById("stopStream")
      .addEventListener("click", () => this.stopStreaming());
    document
      .getElementById("streamPlatform")
      .addEventListener("change", e => this.handlePlatformChange(e));

    // Source selection
    document
      .getElementById("selectSources")
      .addEventListener("click", () => this.showSourceModal());

    // Chat
    document
      .getElementById("sendMessage")
      .addEventListener("click", () => this.sendChatMessage());
    document.getElementById("chatInput").addEventListener("keypress", e => {
      if (e.key === "Enter") this.sendChatMessage();
    });

    // Settings
    document
      .getElementById("settingsBtn")
      .addEventListener("click", () => this.showSettings());
    document
      .getElementById("helpBtn")
      .addEventListener("click", () => this.ui.showHelp());
    document
      .getElementById("closeSettings")
      .addEventListener("click", () => this.hideSettings());
    document
      .getElementById("saveSettings")
      .addEventListener("click", () => this.saveSettings());

    // Auth nav buttons
    document
      .getElementById("signInBtn")
      ?.addEventListener("click", () => this.showAuthModal("signin"));
    document
      .getElementById("signUpBtn")
      ?.addEventListener("click", () => this.showAuthModal("signup"));
    document
      .getElementById("logoutBtn")
      ?.addEventListener("click", () => this.logout());

    // AI controls
    document
      .getElementById("aiCommands")
      .addEventListener("change", e => this.toggleAICommands(e));

    // Quick actions
    document
      .getElementById("screenshotBtn")
      .addEventListener("click", () => this.takeScreenshot());
    document
      .getElementById("muteBtn")
      .addEventListener("click", () => this.toggleMute());

    // Modal controls
    document
      .getElementById("closeSources")
      .addEventListener("click", () => this.hideSourceModal());

    // Source selection
    document.querySelectorAll(".source-item").forEach(item => {
      item.addEventListener("click", e =>
        this.selectSource(e.currentTarget.dataset.type)
      );
    });

    // Settings tabs (scoped to settings modal)
    document.querySelectorAll("#settingsModal .tab-btn").forEach(btn => {
      btn.addEventListener("click", e =>
        this.switchSettingsTab(e.currentTarget.dataset.tab)
      );
    });

    // Transcript controls
    document
      .getElementById("toggleTranscript")
      .addEventListener("click", () => this.toggleTranscript());
    document
      .getElementById("exportTranscript")
      .addEventListener("click", () => this.exportTranscript());

    // Auth modal controls
    document
      .getElementById("authClose")
      ?.addEventListener("click", () => this.hideAuthModal());
    document
      .getElementById("authCancel")
      ?.addEventListener("click", () => this.hideAuthModal());
    document
      .getElementById("authSignInSubmit")
      ?.addEventListener("click", () => this.handleAuthSignIn());
    document
      .getElementById("authSignUpSubmit")
      ?.addEventListener("click", () => this.handleAuthSignUp());
    // Auth tabs (scoped to auth modal)
    document.querySelectorAll("#authModal .tab-btn").forEach(btn => {
      btn.addEventListener("click", e =>
        this.switchAuthTab(e.currentTarget.dataset.tab)
      );
    });
  }

  async startRecording() {
    try {
      if (!this.isAuthenticated()) {
        this.requireAuth(() => this.startRecording());
        return;
      }
      if (!this.currentSource) {
        // Prompt for source and auto-start when selected
        this.startAfterSource = true;
        this.showSourceModal();
        return;
      }

      await this.recorder.start(this.currentSource);
      this.isRecording = true;
      this.updateUI();
      this.updateStatus("Recording", "recording");

      // Start transcript generation
      this.transcript.start();

      console.log("Recording started");
    } catch (error) {
      console.error("Failed to start recording:", error);
      this.showError("Failed to start recording");
    }
  }

  async stopRecording() {
    try {
      await this.recorder.stop();
      this.isRecording = false;
      this.updateUI();
      this.updateStatus("Ready", "ready");

      // Stop transcript generation
      this.transcript.stop();

      console.log("Recording stopped");
    } catch (error) {
      console.error("Failed to stop recording:", error);
      this.showError("Failed to stop recording");
    }
  }

  async startStreaming() {
    try {
      const platform = document.getElementById("streamPlatform").value;
      if (!platform) {
        this.showError("Please select a streaming platform");
        return;
      }

      if (!this.currentSource) {
        this.showError("Please select a video source first");
        return;
      }

      await this.streamer.start(platform, this.currentSource);
      this.isStreaming = true;
      this.updateUI();
      this.updateStatus("Streaming", "streaming");

      console.log("Streaming started");
    } catch (error) {
      console.error("Failed to start streaming:", error);
      this.showError("Failed to start streaming");
    }
  }

  async stopStreaming() {
    try {
      await this.streamer.stop();
      this.isStreaming = false;
      this.updateUI();
      this.updateStatus("Ready", "ready");

      console.log("Streaming stopped");
    } catch (error) {
      console.error("Failed to stop streaming:", error);
      this.showError("Failed to stop streaming");
    }
  }

  handlePlatformChange(event) {
    const platform = event.target.value;
    const startStreamBtn = document.getElementById("startStream");
    startStreamBtn.disabled = !platform;

    // Show/hide platform-specific settings
    this.updateStreamingSettings(platform);
  }

  updateStreamingSettings(platform) {
    // This would show platform-specific configuration options
    console.log("Platform changed to:", platform);
  }

  async selectSource(sourceType) {
    try {
      this.currentSource = await this.recorder.selectSource(sourceType);
      this.hideSourceModal();
      this.updateUI();

      console.log("Source selected:", sourceType);

      // If user attempted to start recording before selecting a source,
      // auto-start now that a source is available
      if (this.startAfterSource) {
        this.startAfterSource = false;
        this.startRecording();
      }
    } catch (error) {
      console.error("Failed to select source:", error);
      this.showError("Failed to select video source");
    }
  }

  sendChatMessage() {
    const input = document.getElementById("chatInput");
    const message = input.value.trim();

    if (message) {
      if (!this.isAuthenticated()) {
        const pendingMessage = message;
        this.requireAuth(() => {
          this.chat.sendMessage(pendingMessage);
        });
        return;
      }
      this.chat.sendMessage(message);
      input.value = "";
    }
  }

  toggleAICommands(event) {
    const enabled = event.target.checked;
    if (enabled && !this.isAuthenticated()) {
      // Revert toggle and prompt auth
      event.target.checked = false;
      this.requireAuth(() => {
        const checkbox = document.getElementById("aiCommands");
        if (checkbox) {
          checkbox.checked = true;
          this.ai.setEnabled(true);
          const statusElement = document.getElementById("aiStatus");
          if (statusElement) statusElement.textContent = "AI: Listening";
        }
      });
      return;
    }
    this.ai.setEnabled(enabled);

    const statusElement = document.getElementById("aiStatus");
    statusElement.textContent = enabled ? "AI: Listening" : "AI: Disabled";
  }

  takeScreenshot() {
    if (this.currentSource) {
      this.recorder.takeScreenshot();
    }
  }

  toggleMute() {
    this.recorder.toggleMute();
  }

  showSourceModal() {
    const modal = document.getElementById("sourcesModal");
    console.log("showSourceModal called, modal element:", modal);
    if (modal) {
      modal.classList.add("active");
      console.log("Modal classes after adding active:", modal.className);
    } else {
      console.error("sourcesModal element not found!");
    }
  }

  hideSourceModal() {
    document.getElementById("sourcesModal").classList.remove("active");
  }

  showSettings() {
    document.getElementById("settingsModal").classList.add("active");
  }

  hideSettings() {
    document.getElementById("settingsModal").classList.remove("active");
  }

  switchSettingsTab(tabName) {
    // Remove active class from all tabs and content
    document
      .querySelectorAll(".tab-btn")
      .forEach(btn => btn.classList.remove("active"));
    document
      .querySelectorAll(".tab-content")
      .forEach(content => content.classList.remove("active"));

    // Add active class to selected tab and content
    document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");
    document.getElementById(`${tabName}Settings`).classList.add("active");
  }

  saveSettings() {
    // Collect settings from form
    const settings = {
      video: {
        resolution: document.getElementById("videoResolution").value,
        frameRate: document.getElementById("frameRate").value,
        bitrate: document.getElementById("videoBitrate").value,
      },
      audio: {
        sampleRate: document.getElementById("sampleRate").value,
        bitrate: document.getElementById("audioBitrate").value,
      },
      streaming: {
        streamKey: document.getElementById("streamKey").value,
        serverUrl: document.getElementById("serverUrl").value,
      },
      ai: {
        apiKey: document.getElementById("aiApiKey").value,
      },
    };

    // Save settings (in a real app, this would be saved to localStorage or server)
    localStorage.setItem("streamstudio-settings", JSON.stringify(settings));

    // Apply settings to modules
    this.recorder.updateSettings(settings.video, settings.audio);
    this.streamer.updateSettings(settings.streaming);
    this.ai.updateSettings(settings.ai);

    this.hideSettings();
    this.showSuccess("Settings saved successfully");
  }

  updateUI() {
    // Update button states
    document.getElementById("startRecording").disabled = this.isRecording;
    document.getElementById("stopRecording").disabled = !this.isRecording;
    document.getElementById("startStream").disabled =
      this.isStreaming || !this.currentSource;
    document.getElementById("stopStream").disabled = !this.isStreaming;

    // Update recording timer
    if (this.isRecording) {
      this.startRecordingTimer();
    } else {
      this.stopRecordingTimer();
    }

    // Update streaming indicator
    const indicator = document.getElementById("streamingIndicator");
    indicator.style.display = this.isStreaming ? "flex" : "none";
  }

  updateStatus(text, type) {
    const statusText = document.getElementById("statusText");
    const statusDot = document.getElementById("statusDot");

    statusText.textContent = text;
    statusDot.className = `status-dot ${type}`;
  }

  startRecordingTimer() {
    this.recordingStartTime = Date.now();
    this.timerInterval = setInterval(() => {
      const elapsed = Date.now() - this.recordingStartTime;
      const hours = Math.floor(elapsed / 3600000);
      const minutes = Math.floor((elapsed % 3600000) / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);

      const timeString = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
      document.getElementById("recordingTimer").textContent = timeString;
      document.getElementById("recordingDuration").textContent = timeString;
    }, 1000);
  }

  stopRecordingTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    document.getElementById("recordingTimer").textContent = "00:00:00";
  }

  showError(message) {
    // Simple error display - in a real app, you'd use a proper notification system
    alert(`Error: ${message}`);
  }

  showSuccess(message) {
    // Simple success display - in a real app, you'd use a proper notification system
    alert(`Success: ${message}`);
  }

  toggleTranscript() {
    const content = document.getElementById("transcriptContent");
    const btn = document.getElementById("toggleTranscript");
    if (!content || !btn) return;

    const isHidden = content.style.display === "none";
    content.style.display = isHidden ? "block" : "none";
    btn.textContent = isHidden ? "Hide" : "Show";
  }

  exportTranscript() {
    this.transcript.exportTranscript("txt");
  }

  // --- Auth helpers ---
  isAuthenticated() {
    return !!this.auth?.email;
  }

  loadAuth() {
    try {
      const raw = localStorage.getItem("streamstudio-auth");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  saveAuth(auth) {
    this.auth = auth;
    try {
      localStorage.setItem("streamstudio-auth", JSON.stringify(auth));
    } catch (e) {}
  }

  clearAuth() {
    this.auth = null;
    localStorage.removeItem("streamstudio-auth");
  }

  requireAuth(actionCallback) {
    this.postAuthAction = actionCallback;
    this.showAuthModal("signin");
  }

  showAuthModal(defaultTab = "signin") {
    const modal = document.getElementById("authModal");
    if (modal) {
      modal.classList.add("active");
      this.switchAuthTab(defaultTab);
    }
  }

  hideAuthModal() {
    const modal = document.getElementById("authModal");
    if (modal) modal.classList.remove("active");
  }

  switchAuthTab(tabName) {
    // Toggle buttons active state (scoped to auth modal)
    document
      .querySelectorAll("#authModal .tab-btn")
      .forEach(btn => btn.classList.remove("active"));
    const tabBtn = document.querySelector(
      `#authModal .tab-btn[data-tab="${tabName}"]`
    );
    if (tabBtn) tabBtn.classList.add("active");

    // Toggle content
    document
      .querySelectorAll("#authModal .tab-content")
      .forEach(content => content.classList.remove("active"));
    const content = document.getElementById(`${tabName}Settings`);
    if (content) content.classList.add("active");

    // Toggle footer buttons
    const signInBtn = document.getElementById("authSignInSubmit");
    const signUpBtn = document.getElementById("authSignUpSubmit");
    if (signInBtn && signUpBtn) {
      if (tabName === "signin") {
        signInBtn.style.display = "inline-block";
        signUpBtn.style.display = "none";
      } else {
        signInBtn.style.display = "none";
        signUpBtn.style.display = "inline-block";
      }
    }
  }

  handleAuthSignIn() {
    const email = document.getElementById("authEmail")?.value?.trim();
    const password = document.getElementById("authPassword")?.value;
    if (!email || !password) {
      this.showError("Please enter email and password");
      return;
    }
    // Simple demo auth
    this.saveAuth({ email });
    this.hideAuthModal();
    this.resumePostAuthAction();
    this.ui.showNotification("Signed in", "success");
    this.updateAuthNav();
  }

  handleAuthSignUp() {
    const email = document.getElementById("signupEmail")?.value?.trim();
    const password = document.getElementById("signupPassword")?.value;
    if (!email || !password) {
      this.showError("Please enter email and password");
      return;
    }
    // Simple demo signup -> sign in
    this.saveAuth({ email });
    this.hideAuthModal();
    this.resumePostAuthAction();
    this.ui.showNotification("Account created & signed in", "success");
    this.updateAuthNav();
  }

  resumePostAuthAction() {
    if (typeof this.postAuthAction === "function") {
      const action = this.postAuthAction;
      this.postAuthAction = null;
      action();
    }
  }

  logout() {
    this.clearAuth();
    this.updateAuthNav();
    this.ui.showNotification("Logged out", "info");
  }

  updateAuthNav() {
    const signInBtn = document.getElementById("signInBtn");
    const signUpBtn = document.getElementById("signUpBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    const isAuthed = this.isAuthenticated();
    if (signInBtn) signInBtn.style.display = isAuthed ? "none" : "inline-block";
    if (signUpBtn) signUpBtn.style.display = isAuthed ? "none" : "inline-block";
    if (logoutBtn) logoutBtn.style.display = isAuthed ? "inline-block" : "none";
  }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.streamStudio = new StreamStudio();
});
