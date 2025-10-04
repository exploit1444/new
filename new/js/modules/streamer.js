/**
 * Streamer Module - Handles live streaming functionality
 */

export class Streamer {
  constructor() {
    this.rtmpConnection = null;
    this.isStreaming = false;
    this.viewerCount = 0;
    this.settings = {
      streamKey: "",
      serverUrl: "",
      bitrate: 2500,
      resolution: "1920x1080",
      frameRate: 30,
    };
    this.platforms = {
      youtube: {
        name: "YouTube Live",
        serverUrl: "rtmp://a.rtmp.youtube.com/live2",
        requiresKey: true,
      },
      twitch: {
        name: "Twitch",
        serverUrl: "rtmp://live.twitch.tv/live",
        requiresKey: true,
      },
      facebook: {
        name: "Facebook Live",
        serverUrl: "rtmp://rtmp-api.facebook.com:80/rtmp",
        requiresKey: true,
      },
      custom: {
        name: "Custom RTMP",
        serverUrl: "",
        requiresKey: true,
      },
    };
  }

  async init() {
    try {
      // Initialize streaming settings from localStorage
      this.loadSettings();

      // Set up viewer count simulation (in a real app, this would come from the platform API)
      this.startViewerCountSimulation();

      console.log("Streamer module initialized");
    } catch (error) {
      console.error("Failed to initialize streamer:", error);
      throw error;
    }
  }

  loadSettings() {
    const savedSettings = localStorage.getItem(
      "streamstudio-streaming-settings"
    );
    if (savedSettings) {
      this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
    }
  }

  saveSettings() {
    localStorage.setItem(
      "streamstudio-streaming-settings",
      JSON.stringify(this.settings)
    );
  }

  async start(platform, sourceStream) {
    try {
      if (this.isStreaming) {
        throw new Error("Streaming is already in progress");
      }

      const platformConfig = this.platforms[platform];
      if (!platformConfig) {
        throw new Error("Invalid platform selected");
      }

      // Validate stream key
      if (platformConfig.requiresKey && !this.settings.streamKey) {
        throw new Error("Stream key is required for this platform");
      }

      // In a real implementation, you would use WebRTC or WebSocket to stream
      // For this demo, we'll simulate the streaming process
      await this.simulateStreamStart(platform, sourceStream);

      this.isStreaming = true;
      this.updateViewerCount();

      console.log(`Streaming started to ${platformConfig.name}`);
    } catch (error) {
      console.error("Failed to start streaming:", error);
      throw error;
    }
  }

  async simulateStreamStart(platform, sourceStream) {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // In a real implementation, you would:
    // 1. Create WebRTC connection to streaming server
    // 2. Send video/audio data from sourceStream
    // 3. Handle connection errors and reconnection

    console.log("Simulated stream connection established");
  }

  async stop() {
    try {
      if (!this.isStreaming) {
        throw new Error("No streaming in progress");
      }

      // In a real implementation, you would close the streaming connection
      await this.simulateStreamStop();

      this.isStreaming = false;
      this.viewerCount = 0;
      this.updateViewerCount();

      console.log("Streaming stopped");
    } catch (error) {
      console.error("Failed to stop streaming:", error);
      throw error;
    }
  }

  async simulateStreamStop() {
    // Simulate disconnection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Simulated stream connection closed");
  }

  startViewerCountSimulation() {
    // Simulate viewer count changes during streaming
    setInterval(() => {
      if (this.isStreaming) {
        // Simulate viewer count fluctuations
        const change = Math.floor(Math.random() * 10) - 5; // -5 to +5
        this.viewerCount = Math.max(0, this.viewerCount + change);
        this.updateViewerCount();
      }
    }, 5000); // Update every 5 seconds
  }

  updateViewerCount() {
    const viewerElement = document.getElementById("viewerCount");
    if (viewerElement) {
      viewerElement.textContent = this.viewerCount.toString();
    }
  }

  updateSettings(streamingSettings) {
    this.settings = { ...this.settings, ...streamingSettings };
    this.saveSettings();

    console.log("Streaming settings updated:", this.settings);
  }

  getStreamingStats() {
    return {
      isStreaming: this.isStreaming,
      viewerCount: this.viewerCount,
      bitrate: this.settings.bitrate,
      resolution: this.settings.resolution,
      frameRate: this.settings.frameRate,
    };
  }

  validateStreamKey(platform, streamKey) {
    const platformConfig = this.platforms[platform];
    if (!platformConfig.requiresKey) {
      return true;
    }

    if (!streamKey || streamKey.trim().length === 0) {
      return false;
    }

    // Basic validation - in a real app, you'd validate against platform APIs
    return streamKey.length >= 10;
  }

  getPlatformInfo(platform) {
    return this.platforms[platform] || null;
  }

  async testConnection(platform, streamKey, serverUrl) {
    try {
      // In a real implementation, you would test the RTMP connection
      // For this demo, we'll simulate a connection test
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate random success/failure for demo purposes
      const success = Math.random() > 0.3; // 70% success rate

      if (success) {
        console.log("Connection test successful");
        return { success: true, message: "Connection test successful" };
      } else {
        console.log("Connection test failed");
        return {
          success: false,
          message:
            "Connection test failed. Please check your stream key and server URL.",
        };
      }
    } catch (error) {
      console.error("Connection test error:", error);
      return {
        success: false,
        message: "Connection test error: " + error.message,
      };
    }
  }

  getStreamingQuality() {
    // In a real implementation, this would monitor actual stream quality
    return {
      droppedFrames: Math.floor(Math.random() * 10),
      bitrate: this.settings.bitrate,
      latency: Math.floor(Math.random() * 2000) + 1000, // 1-3 seconds
      quality: "Good", // Good, Fair, Poor
    };
  }

  cleanup() {
    if (this.isStreaming) {
      this.stop();
    }

    this.viewerCount = 0;
    this.updateViewerCount();
  }
}
