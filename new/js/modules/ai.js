/**
 * AI Module - Handles AI voice commands and integration
 */

export class AI {
  constructor() {
    this.isEnabled = false;
    this.isListening = false;
    this.recognition = null;
    this.settings = {
      apiKey: "",
      language: "en-US",
      sensitivity: 0.7,
      commands: {
        "start recording": "startRecording",
        "stop recording": "stopRecording",
        "go live": "startStreaming",
        "end stream": "stopStreaming",
        "take screenshot": "takeScreenshot",
        "mute audio": "toggleMute",
        "unmute audio": "toggleMute",
        "switch scene": "switchScene",
        "clear chat": "clearChat",
      },
    };
    this.commandHistory = [];
    this.maxHistorySize = 50;
  }

  async init() {
    try {
      this.loadSettings();
      this.setupSpeechRecognition();
      console.log("AI module initialized");
    } catch (error) {
      console.error("Failed to initialize AI:", error);
      throw error;
    }
  }

  setupSpeechRecognition() {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      console.warn("Speech recognition not supported for AI commands");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    this.recognition.continuous = true;
    this.recognition.interimResults = false;
    this.recognition.lang = this.settings.language;
    this.recognition.maxAlternatives = 3;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.updateStatus("AI: Listening");
      console.log("AI voice recognition started");
    };

    this.recognition.onresult = event => {
      this.handleRecognitionResult(event);
    };

    this.recognition.onerror = event => {
      console.error("AI recognition error:", event.error);
      this.handleRecognitionError(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.updateStatus("AI: Disabled");

      // Restart if still enabled
      if (this.isEnabled) {
        setTimeout(() => {
          if (this.isEnabled) {
            this.recognition.start();
          }
        }, 100);
      }
    };
  }

  handleRecognitionResult(event) {
    const results = Array.from(event.results);
    const lastResult = results[results.length - 1];

    if (lastResult.isFinal) {
      const transcript = lastResult[0].transcript.toLowerCase().trim();
      const confidence = lastResult[0].confidence;

      console.log("AI heard:", transcript, "Confidence:", confidence);

      if (confidence >= this.settings.sensitivity) {
        this.processCommand(transcript);
      }
    }
  }

  handleRecognitionError(error) {
    let errorMessage = "AI recognition error: ";

    switch (error) {
      case "no-speech":
        // Don't show error for no speech, just restart
        return;
      case "audio-capture":
        errorMessage += "Microphone access denied";
        break;
      case "not-allowed":
        errorMessage += "Microphone permission required";
        break;
      case "network":
        errorMessage += "Network error";
        break;
      default:
        errorMessage += error;
    }

    console.error(errorMessage);
    this.updateStatus("AI: Error - " + error);
  }

  processCommand(transcript) {
    // Find matching command
    const matchedCommand = this.findMatchingCommand(transcript);

    if (matchedCommand) {
      this.executeCommand(matchedCommand, transcript);
    } else {
      // Try to process as natural language command
      this.processNaturalLanguageCommand(transcript);
    }
  }

  findMatchingCommand(transcript) {
    // Direct command matching
    for (const [command, action] of Object.entries(this.settings.commands)) {
      if (transcript.includes(command)) {
        return { action, command, type: "direct" };
      }
    }

    // Fuzzy matching for common variations
    const fuzzyCommands = {
      "start record": "startRecording",
      "begin record": "startRecording",
      "stop record": "stopRecording",
      "end record": "stopRecording",
      "start stream": "startStreaming",
      "begin stream": "startStreaming",
      "stop stream": "stopStreaming",
      "end stream": "stopStreaming",
      screenshot: "takeScreenshot",
      capture: "takeScreenshot",
      mute: "toggleMute",
      unmute: "toggleMute",
      scene: "switchScene",
      clear: "clearChat",
    };

    for (const [command, action] of Object.entries(fuzzyCommands)) {
      if (transcript.includes(command)) {
        return { action, command, type: "fuzzy" };
      }
    }

    return null;
  }

  processNaturalLanguageCommand(transcript) {
    // Use AI API to process natural language commands
    if (!this.settings.apiKey) {
      console.warn("AI API key not configured for natural language processing");
      return;
    }

    this.sendToAI(transcript)
      .then(response => {
        if (response.action) {
          this.executeCommand(response, transcript);
        }
      })
      .catch(error => {
        console.error("AI processing error:", error);
      });
  }

  async sendToAI(transcript) {
    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.settings.apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: `You are an AI assistant for a streaming application. Convert user voice commands into actions. 
                            Available actions: startRecording, stopRecording, startStreaming, stopStreaming, takeScreenshot, toggleMute, switchScene, clearChat.
                            Respond with JSON: {"action": "actionName", "confidence": 0.0-1.0, "reason": "explanation"}`,
              },
              {
                role: "user",
                content: transcript,
              },
            ],
            max_tokens: 100,
            temperature: 0.1,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const content = JSON.parse(data.choices[0].message.content);

      return {
        action: content.action,
        confidence: content.confidence || 0.5,
        reason: content.reason,
        type: "ai",
      };
    } catch (error) {
      console.error("AI API error:", error);
      throw error;
    }
  }

  executeCommand(commandData, originalTranscript) {
    const { action, confidence, type } = commandData;

    // Log command execution
    this.logCommand({
      action,
      originalTranscript,
      confidence,
      type,
      timestamp: new Date(),
    });

    // Execute the command
    switch (action) {
      case "startRecording":
        this.triggerEvent("ai-start-recording");
        break;
      case "stopRecording":
        this.triggerEvent("ai-stop-recording");
        break;
      case "startStreaming":
        this.triggerEvent("ai-start-streaming");
        break;
      case "stopStreaming":
        this.triggerEvent("ai-stop-streaming");
        break;
      case "takeScreenshot":
        this.triggerEvent("ai-take-screenshot");
        break;
      case "toggleMute":
        this.triggerEvent("ai-toggle-mute");
        break;
      case "switchScene":
        this.triggerEvent("ai-switch-scene");
        break;
      case "clearChat":
        this.triggerEvent("ai-clear-chat");
        break;
      default:
        console.warn("Unknown AI command:", action);
    }

    // Show feedback
    this.showCommandFeedback(action, confidence);
  }

  triggerEvent(eventName) {
    const event = new CustomEvent(eventName, {
      detail: { source: "ai" },
    });
    document.dispatchEvent(event);
  }

  showCommandFeedback(action, confidence) {
    const feedbackMessages = {
      startRecording: "Starting recording...",
      stopRecording: "Stopping recording...",
      startStreaming: "Going live...",
      stopStreaming: "Ending stream...",
      takeScreenshot: "Taking screenshot...",
      toggleMute: "Toggling audio...",
      switchScene: "Switching scene...",
      clearChat: "Clearing chat...",
    };

    const message = feedbackMessages[action] || "Command executed";
    this.updateStatus(`AI: ${message} (${Math.round(confidence * 100)}%)`);

    // Show temporary notification
    this.showNotification(message, confidence > 0.8 ? "success" : "warning");
  }

  showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `ai-notification ${type}`;
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

    // Animate in
    setTimeout(() => {
      notification.style.opacity = "1";
      notification.style.transform = "translateX(0)";
    }, 10);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transform = "translateX(100%)";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  logCommand(commandData) {
    this.commandHistory.push(commandData);

    // Limit history size
    if (this.commandHistory.length > this.maxHistorySize) {
      this.commandHistory.shift();
    }

    // Save to localStorage
    this.saveCommandHistory();
  }

  saveCommandHistory() {
    try {
      localStorage.setItem(
        "streamstudio-ai-commands",
        JSON.stringify(this.commandHistory)
      );
    } catch (error) {
      console.warn("Failed to save AI command history:", error);
    }
  }

  loadCommandHistory() {
    try {
      const saved = localStorage.getItem("streamstudio-ai-commands");
      if (saved) {
        this.commandHistory = JSON.parse(saved);
      }
    } catch (error) {
      console.warn("Failed to load AI command history:", error);
    }
  }

  setEnabled(enabled) {
    this.isEnabled = enabled;

    if (enabled && this.recognition) {
      this.recognition.start();
      this.updateStatus("AI: Listening");
    } else if (!enabled && this.recognition) {
      this.recognition.stop();
      this.updateStatus("AI: Disabled");
    }
  }

  updateStatus(status) {
    const statusElement = document.getElementById("aiStatus");
    if (statusElement) {
      statusElement.textContent = status;
    }
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };

    if (this.recognition) {
      this.recognition.lang = this.settings.language;
    }

    this.saveSettings();
  }

  saveSettings() {
    localStorage.setItem(
      "streamstudio-ai-settings",
      JSON.stringify(this.settings)
    );
  }

  loadSettings() {
    const saved = localStorage.getItem("streamstudio-ai-settings");
    if (saved) {
      this.settings = { ...this.settings, ...JSON.parse(saved) };
    }
  }

  getCommandStats() {
    const now = new Date();
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

    const recentCommands = this.commandHistory.filter(
      cmd => cmd.timestamp > lastHour
    );
    const commandCounts = {};

    this.commandHistory.forEach(cmd => {
      commandCounts[cmd.action] = (commandCounts[cmd.action] || 0) + 1;
    });

    return {
      totalCommands: this.commandHistory.length,
      commandsLastHour: recentCommands.length,
      mostUsedCommand: Object.keys(commandCounts).reduce(
        (a, b) => (commandCounts[a] > commandCounts[b] ? a : b),
        "none"
      ),
      averageConfidence:
        this.commandHistory.length > 0
          ? this.commandHistory.reduce((sum, cmd) => sum + cmd.confidence, 0) /
            this.commandHistory.length
          : 0,
    };
  }

  exportCommandHistory() {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalCommands: this.commandHistory.length,
      commands: this.commandHistory,
      stats: this.getCommandStats(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-commands-${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }

  cleanup() {
    this.setEnabled(false);
    this.saveCommandHistory();
    this.saveSettings();
  }
}
