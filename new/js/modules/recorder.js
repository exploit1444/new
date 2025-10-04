/**
 * Recorder Module - Handles video recording functionality
 */

export class Recorder {
  constructor() {
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.stream = null;
    this.isRecording = false;
    this.settings = {
      video: {
        resolution: "1920x1080",
        frameRate: 30,
        bitrate: 2500,
      },
      audio: {
        sampleRate: 44100,
        bitrate: 128,
      },
    };
  }

  async init() {
    try {
      // Initialize audio meters
      this.initAudioMeters();
      console.log("Recorder module initialized");
    } catch (error) {
      console.error("Failed to initialize recorder:", error);
      throw error;
    }
  }

  async selectSource(sourceType) {
    try {
      let stream;

      switch (sourceType) {
        case "camera":
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              frameRate: { ideal: 30 },
            },
            audio: true,
          });
          break;

        case "screen":
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              frameRate: { ideal: 30 },
            },
            audio: true,
          });
          break;

        case "window":
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              frameRate: { ideal: 30 },
            },
            audio: true,
          });
          break;

        case "browser":
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              frameRate: { ideal: 30 },
            },
            audio: true,
          });
          break;

        default:
          throw new Error("Unknown source type");
      }

      this.stream = stream;
      this.setupVideoPreview(stream);
      this.setupAudioMeters(stream);

      return stream;
    } catch (error) {
      console.error("Failed to select source:", error);
      throw error;
    }
  }

  setupVideoPreview(stream) {
    const preview = document.getElementById("videoPreview");
    const video = document.createElement("video");
    video.srcObject = stream;
    video.autoplay = true;
    video.muted = true;
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.objectFit = "cover";
    video.style.borderRadius = "var(--radius-lg)";

    // Clear existing content
    preview.innerHTML = "";
    preview.appendChild(video);
  }

  setupAudioMeters(stream) {
    if (!stream.getAudioTracks().length) return;

    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();

    analyser.fftSize = 256;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateMeter = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const percentage = (average / 255) * 100;

      const micMeter = document.getElementById("micMeter");
      if (micMeter) {
        micMeter.style.width = `${percentage}%`;
      }

      if (this.isRecording) {
        requestAnimationFrame(updateMeter);
      }
    };

    updateMeter();
  }

  initAudioMeters() {
    // Initialize system audio meter (placeholder)
    const systemMeter = document.getElementById("systemMeter");
    if (systemMeter) {
      systemMeter.style.width = "0%";
    }
  }

  async start(sourceStream) {
    try {
      if (this.isRecording) {
        throw new Error("Recording is already in progress");
      }

      this.recordedChunks = [];

      // Create MediaRecorder with optimal settings
      const options = {
        mimeType: "video/webm;codecs=vp9,opus",
        videoBitsPerSecond: this.settings.video.bitrate * 1000,
        audioBitsPerSecond: this.settings.audio.bitrate * 1000,
      };

      // Fallback to different codec if vp9 is not supported
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = "video/webm;codecs=vp8,opus";
      }

      this.mediaRecorder = new MediaRecorder(sourceStream, options);

      this.mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.saveRecording();
      };

      this.mediaRecorder.start(1000); // Collect data every second
      this.isRecording = true;

      console.log("Recording started");
    } catch (error) {
      console.error("Failed to start recording:", error);
      throw error;
    }
  }

  async stop() {
    try {
      if (!this.isRecording || !this.mediaRecorder) {
        throw new Error("No recording in progress");
      }

      this.mediaRecorder.stop();
      this.isRecording = false;

      console.log("Recording stopped");
    } catch (error) {
      console.error("Failed to stop recording:", error);
      throw error;
    }
  }

  saveRecording() {
    if (this.recordedChunks.length === 0) {
      console.warn("No recorded data to save");
      return;
    }

    const blob = new Blob(this.recordedChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);

    // Create download link
    const a = document.createElement("a");
    a.href = url;
    a.download = `recording-${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, "-")}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Clean up
    URL.revokeObjectURL(url);
    this.recordedChunks = [];

    console.log("Recording saved");
  }

  takeScreenshot() {
    if (!this.stream) {
      console.warn("No video stream available for screenshot");
      return;
    }

    const video = document.querySelector("#videoPreview video");
    if (!video) {
      console.warn("No video element found for screenshot");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `screenshot-${new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-")}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    console.log("Screenshot taken");
  }

  toggleMute() {
    if (!this.stream) return;

    const audioTracks = this.stream.getAudioTracks();
    audioTracks.forEach(track => {
      track.enabled = !track.enabled;
    });

    const muteBtn = document.getElementById("muteBtn");
    const icon = muteBtn.querySelector(".btn-icon");
    const text = muteBtn.querySelector(".btn-text");

    const isMuted = !audioTracks[0]?.enabled;
    icon.textContent = isMuted ? "🔊" : "🔇";
    text.textContent = isMuted ? "Unmute Audio" : "Mute Audio";

    console.log("Audio toggled:", isMuted ? "muted" : "unmuted");
  }

  updateSettings(videoSettings, audioSettings) {
    this.settings.video = { ...this.settings.video, ...videoSettings };
    this.settings.audio = { ...this.settings.audio, ...audioSettings };

    console.log("Recorder settings updated:", this.settings);
  }

  getRecordingStats() {
    if (!this.isRecording) {
      return {
        duration: 0,
        fileSize: 0,
        bitrate: 0,
      };
    }

    const duration = this.recordedChunks.length; // Approximate duration in seconds
    const fileSize = this.recordedChunks.reduce(
      (total, chunk) => total + chunk.size,
      0
    );
    const bitrate = fileSize > 0 ? (fileSize * 8) / duration : 0;

    return {
      duration,
      fileSize: fileSize / (1024 * 1024), // Convert to MB
      bitrate: bitrate / 1000, // Convert to kbps
    };
  }

  cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }

    this.recordedChunks = [];
    this.isRecording = false;
  }
}
