/**
 * Transcript Module - Handles automatic transcript generation
 */

export class Transcript {
  constructor() {
    this.isActive = false;
    this.transcript = [];
    this.recognition = null;
    this.currentSegment = "";
    this.segmentStartTime = null;
    this.settings = {
      language: "en-US",
      continuous: true,
      interimResults: true,
      maxAlternatives: 1,
    };
  }

  async init() {
    try {
      // Check for speech recognition support
      if (
        !("webkitSpeechRecognition" in window) &&
        !("SpeechRecognition" in window)
      ) {
        console.warn("Speech recognition not supported in this browser");
        return;
      }

      this.setupSpeechRecognition();
      this.loadSettings();
      console.log("Transcript module initialized");
    } catch (error) {
      console.error("Failed to initialize transcript:", error);
      throw error;
    }
  }

  setupSpeechRecognition() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    this.recognition.continuous = this.settings.continuous;
    this.recognition.interimResults = this.settings.interimResults;
    this.recognition.lang = this.settings.language;
    this.recognition.maxAlternatives = this.settings.maxAlternatives;

    this.recognition.onstart = () => {
      console.log("Speech recognition started");
      this.updateStatus("Listening...");
    };

    this.recognition.onresult = event => {
      this.handleRecognitionResult(event);
    };

    this.recognition.onerror = event => {
      console.error("Speech recognition error:", event.error);
      this.handleRecognitionError(event.error);
    };

    this.recognition.onend = () => {
      console.log("Speech recognition ended");
      if (this.isActive) {
        // Restart recognition if still active
        setTimeout(() => {
          if (this.isActive) {
            this.recognition.start();
          }
        }, 100);
      }
    };
  }

  handleRecognitionResult(event) {
    let interimTranscript = "";
    let finalTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;

      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    // Update current segment with interim results
    if (interimTranscript) {
      this.currentSegment = interimTranscript;
      this.updateDisplay();
    }

    // Process final transcript
    if (finalTranscript) {
      this.addTranscriptSegment(finalTranscript);
    }
  }

  handleRecognitionError(error) {
    let errorMessage = "Speech recognition error: ";

    switch (error) {
      case "no-speech":
        errorMessage += "No speech detected";
        break;
      case "audio-capture":
        errorMessage += "Audio capture failed";
        break;
      case "not-allowed":
        errorMessage += "Microphone access denied";
        break;
      case "network":
        errorMessage += "Network error";
        break;
      default:
        errorMessage += error;
    }

    this.updateStatus(errorMessage);
    console.error(errorMessage);
  }

  start() {
    if (!this.recognition) {
      console.warn("Speech recognition not available");
      return;
    }

    if (this.isActive) {
      console.warn("Transcript generation already active");
      return;
    }

    try {
      this.isActive = true;
      this.transcript = [];
      this.currentSegment = "";
      this.segmentStartTime = Date.now();

      this.recognition.start();
      this.updateDisplay();
      this.updateStatus("Transcribing...");

      console.log("Transcript generation started");
    } catch (error) {
      console.error("Failed to start transcript generation:", error);
      this.isActive = false;
    }
  }

  stop() {
    if (!this.isActive) {
      return;
    }

    this.isActive = false;

    if (this.recognition) {
      this.recognition.stop();
    }

    // Save final segment if exists
    if (this.currentSegment.trim()) {
      this.addTranscriptSegment(this.currentSegment);
    }

    this.updateStatus("Stopped");
    this.saveTranscript();

    console.log("Transcript generation stopped");
  }

  addTranscriptSegment(text) {
    if (!text.trim()) return;

    const segment = {
      id: this.generateSegmentId(),
      text: text.trim(),
      timestamp: new Date(),
      startTime: this.segmentStartTime || Date.now(),
      endTime: Date.now(),
      confidence: 1.0, // In a real implementation, you'd get this from the recognition result
    };

    this.transcript.push(segment);
    this.currentSegment = "";
    this.segmentStartTime = Date.now();

    this.updateDisplay();
    this.saveTranscript();
  }

  updateDisplay() {
    const transcriptContent = document.getElementById("transcriptContent");
    if (!transcriptContent) return;

    let html = "";

    // Add completed segments
    this.transcript.forEach(segment => {
      const time = new Date(segment.timestamp).toLocaleTimeString();
      html += `
                <div class="transcript-segment" data-segment-id="${segment.id}">
                    <div class="segment-time">${time}</div>
                    <div class="segment-text">${this.escapeHtml(
                      segment.text
                    )}</div>
                </div>
            `;
    });

    // Add current segment if exists
    if (this.currentSegment.trim()) {
      const time = new Date().toLocaleTimeString();
      html += `
                <div class="transcript-segment current">
                    <div class="segment-time">${time}</div>
                    <div class="segment-text interim">${this.escapeHtml(
                      this.currentSegment
                    )}</div>
                </div>
            `;
    }

    // Show placeholder if no content
    if (!html) {
      html =
        '<p class="transcript-placeholder">Transcript will appear here during recording...</p>';
    }

    transcriptContent.innerHTML = html;

    // Auto-scroll to bottom
    transcriptContent.scrollTop = transcriptContent.scrollHeight;
  }

  updateStatus(status) {
    // Update status in UI if needed
    console.log("Transcript status:", status);
  }

  generateSegmentId() {
    return "seg_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  saveTranscript() {
    try {
      const transcriptData = {
        id: this.generateTranscriptId(),
        createdAt: new Date().toISOString(),
        segments: this.transcript,
        totalDuration: this.getTotalDuration(),
        wordCount: this.getWordCount(),
      };

      localStorage.setItem(
        "streamstudio-transcript",
        JSON.stringify(transcriptData)
      );
    } catch (error) {
      console.warn("Failed to save transcript:", error);
    }
  }

  loadTranscript() {
    try {
      const saved = localStorage.getItem("streamstudio-transcript");
      if (saved) {
        const transcriptData = JSON.parse(saved);
        this.transcript = transcriptData.segments || [];
        this.updateDisplay();
        return transcriptData;
      }
    } catch (error) {
      console.warn("Failed to load transcript:", error);
    }
    return null;
  }

  exportTranscript(format = "txt") {
    if (this.transcript.length === 0) {
      console.warn("No transcript to export");
      return;
    }

    let content = "";
    const filename = `transcript-${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, "-")}`;

    switch (format.toLowerCase()) {
      case "txt":
        content = this.exportAsText();
        this.downloadFile(content, `${filename}.txt`, "text/plain");
        break;
      case "json":
        content = JSON.stringify(
          {
            exportDate: new Date().toISOString(),
            segments: this.transcript,
            totalDuration: this.getTotalDuration(),
            wordCount: this.getWordCount(),
          },
          null,
          2
        );
        this.downloadFile(content, `${filename}.json`, "application/json");
        break;
      case "srt":
        content = this.exportAsSRT();
        this.downloadFile(content, `${filename}.srt`, "text/plain");
        break;
      case "vtt":
        content = this.exportAsVTT();
        this.downloadFile(content, `${filename}.vtt`, "text/vtt");
        break;
      default:
        console.warn("Unsupported export format:", format);
    }
  }

  exportAsText() {
    return this.transcript
      .map(segment => {
        const time = new Date(segment.timestamp).toLocaleTimeString();
        return `[${time}] ${segment.text}`;
      })
      .join("\n");
  }

  exportAsSRT() {
    let srt = "";
    this.transcript.forEach((segment, index) => {
      const startTime = this.formatSRTTime(segment.startTime);
      const endTime = this.formatSRTTime(segment.endTime);

      srt += `${index + 1}\n`;
      srt += `${startTime} --> ${endTime}\n`;
      srt += `${segment.text}\n\n`;
    });
    return srt;
  }

  exportAsVTT() {
    let vtt = "WEBVTT\n\n";
    this.transcript.forEach(segment => {
      const startTime = this.formatVTTTime(segment.startTime);
      const endTime = this.formatVTTTime(segment.endTime);

      vtt += `${startTime} --> ${endTime}\n`;
      vtt += `${segment.text}\n\n`;
    });
    return vtt;
  }

  formatSRTTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    const milliseconds = date.getMilliseconds().toString().padStart(3, "0");

    return `${hours}:${minutes}:${seconds},${milliseconds}`;
  }

  formatVTTTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    const milliseconds = date.getMilliseconds().toString().padStart(3, "0");

    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }

  generateTranscriptId() {
    return (
      "transcript_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
    );
  }

  getTotalDuration() {
    if (this.transcript.length === 0) return 0;

    const firstSegment = this.transcript[0];
    const lastSegment = this.transcript[this.transcript.length - 1];

    return lastSegment.endTime - firstSegment.startTime;
  }

  getWordCount() {
    return this.transcript.reduce((count, segment) => {
      return count + segment.text.split(/\s+/).length;
    }, 0);
  }

  searchTranscript(query) {
    if (!query.trim()) return [];

    const results = [];
    const searchTerm = query.toLowerCase();

    this.transcript.forEach((segment, index) => {
      if (segment.text.toLowerCase().includes(searchTerm)) {
        results.push({
          segment,
          index,
          context: this.getContext(index),
        });
      }
    });

    return results;
  }

  getContext(segmentIndex, contextSize = 1) {
    const start = Math.max(0, segmentIndex - contextSize);
    const end = Math.min(
      this.transcript.length,
      segmentIndex + contextSize + 1
    );

    return this.transcript.slice(start, end);
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };

    if (this.recognition) {
      this.recognition.lang = this.settings.language;
      this.recognition.continuous = this.settings.continuous;
      this.recognition.interimResults = this.settings.interimResults;
      this.recognition.maxAlternatives = this.settings.maxAlternatives;
    }

    this.saveSettings();
  }

  saveSettings() {
    localStorage.setItem(
      "streamstudio-transcript-settings",
      JSON.stringify(this.settings)
    );
  }

  loadSettings() {
    const saved = localStorage.getItem("streamstudio-transcript-settings");
    if (saved) {
      this.settings = { ...this.settings, ...JSON.parse(saved) };
    }
  }

  cleanup() {
    this.stop();
    this.saveTranscript();
  }
}
