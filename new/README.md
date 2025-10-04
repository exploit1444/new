# StreamStudio - Professional Recording & Streaming Platform

A modern web application that combines OBS-like recording/streaming capabilities with Discord-style chat and AI voice commands.

## 🚀 Features

### 📹 Recording & Streaming

- **Multi-source recording**: Camera, screen share, window capture, browser tab
- **Live streaming**: Support for YouTube Live, Twitch, Facebook Live, and custom RTMP
- **High-quality output**: Configurable resolution, frame rate, and bitrate
- **Real-time monitoring**: Audio meters, recording timer, and streaming indicators

### 💬 Live Chat

- **Discord-style interface**: Clean, modern chat design
- **Real-time messaging**: Instant message delivery and display
- **Moderation tools**: User blocking, moderator controls
- **Chat export**: Save chat history in multiple formats

### 🤖 AI Integration

- **Voice commands**: Control recording and streaming with natural speech
- **Smart recognition**: High-accuracy speech-to-text with confidence scoring
- **Natural language processing**: AI-powered command interpretation
- **Command history**: Track and analyze AI command usage

### 📝 Automatic Transcripts

- **Real-time transcription**: Live speech-to-text during recording
- **Multiple export formats**: TXT, JSON, SRT, VTT
- **Search functionality**: Find specific content in transcripts
- **Offline access**: Read transcripts when internet is unavailable

### 🎨 Modern UI/UX

- **Professional design**: Clean, Discord-inspired interface
- **Responsive layout**: Works on desktop and mobile devices
- **Dark theme**: Easy on the eyes for long recording sessions
- **Keyboard shortcuts**: Efficient workflow with hotkeys

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Recording**: MediaRecorder API, WebRTC
- **Speech Recognition**: Web Speech API
- **AI Integration**: OpenAI GPT API
- **Storage**: LocalStorage for settings and data
- **Styling**: CSS Custom Properties, Flexbox, Grid

## 📁 Project Structure

```
streamstudio/
├── index.html              # Main application HTML
├── css/
│   └── styles.css          # Complete CSS styling
├── js/
│   ├── app.js              # Main application controller
│   └── modules/
│       ├── recorder.js     # Video recording functionality
│       ├── streamer.js     # Live streaming functionality
│       ├── chat.js         # Chat system
│       ├── transcript.js   # Speech-to-text transcription
│       ├── ai.js           # AI voice commands
│       └── ui.js           # User interface management
└── README.md               # This file
```

## 🚀 Getting Started

### Prerequisites

- Modern web browser with WebRTC support
- Microphone and camera access
- Internet connection for AI features

### Installation

1. Clone or download the project files
2. Open `index.html` in a modern web browser
3. Allow microphone and camera permissions when prompted

### Configuration

1. Click the settings button (⚙️) in the header
2. Configure your preferred settings:
   - **Video**: Resolution, frame rate, bitrate
   - **Audio**: Sample rate, bitrate
   - **Streaming**: Platform credentials and server URLs
   - **AI**: API key for enhanced voice commands

## 🎮 Usage

### Recording

1. Click "Select Sources" to choose your video source
2. Click "Start Recording" to begin
3. Use "Stop Recording" to end and save the file

### Streaming

1. Select your streaming platform from the dropdown
2. Enter your stream key in settings
3. Click "Go Live" to start streaming
4. Use "End Stream" to stop

### AI Voice Commands

1. Enable "AI Commands" in the left sidebar
2. Say commands like:
   - "Start recording"
   - "Stop recording"
   - "Go live"
   - "Take screenshot"
   - "Mute audio"

### Chat

1. Type messages in the chat input at the bottom
2. View live chat messages from viewers
3. Use moderation tools to manage chat

### Transcripts

1. Transcripts are automatically generated during recording
2. View live transcript in the right sidebar
3. Export transcripts in multiple formats

## ⌨️ Keyboard Shortcuts

- **F1**: Show help
- **F2**: Toggle recording
- **F3**: Toggle streaming
- **F4**: Take screenshot
- **F5**: Refresh sources
- **F12**: Toggle developer tools
- **Esc**: Close all modals
- **Ctrl+S**: Save settings

## 🔧 Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Limited support (some features may not work)
- **Edge**: Full support

## 📱 Mobile Support

The application is responsive and works on mobile devices, though some features may be limited due to browser restrictions.

## 🔒 Privacy & Security

- All data is stored locally in your browser
- No data is sent to external servers (except AI API calls)
- Stream keys and credentials are stored locally only
- Microphone and camera access is only used for recording/streaming

## 🐛 Troubleshooting

### Common Issues

**Recording not working:**

- Check browser permissions for microphone/camera
- Ensure you have sufficient disk space
- Try refreshing the page

**AI commands not responding:**

- Check microphone permissions
- Verify AI API key is configured
- Ensure stable internet connection

**Streaming issues:**

- Verify stream key is correct
- Check server URL format
- Ensure stable internet connection

## 🤝 Contributing

This is a demonstration project. Feel free to fork and modify for your own use.

## 📄 License

This project is for educational and demonstration purposes.

## 🙏 Acknowledgments

- Inspired by OBS Studio for recording functionality
- Discord for chat interface design
- Modern web APIs for browser integration
