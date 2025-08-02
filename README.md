# Voice AI Chat with Gemini

A real-time voice chat application that allows you to have conversations with Google's Gemini AI using both voice and text input.

## Features

- 🎤 **Voice Input**: Speak to the AI using your microphone
- 💬 **Text Input**: Type messages as an alternative
- 🔊 **Voice Output**: AI responses are spoken back to you
- 🎨 **Modern UI**: Clean, responsive interface
- ⚡ **Real-time**: Instant responses from Gemini AI

## How to Use

### 1. Start the Backend Server

```bash
cd backend
python3 app.py
```

The Flask server will start on `http://localhost:5000`

### 2. Start the Frontend

```bash
cd frontend/terra
npm run dev
```

The Next.js app will start on `http://localhost:3000`

### 3. Chat with the AI

1. **Open your browser** and go to `http://localhost:3000`
2. **Allow microphone access** when prompted
3. **Click the microphone button** to start voice recording
4. **Speak your message** - you'll see the transcript appear
5. **Click the stop button** to send your message
6. **Listen to the AI's response** - it will be spoken back to you
7. **Or type messages** in the text input field

## Voice Commands

- **Click the microphone icon** to start recording
- **Speak clearly** for better transcription
- **Click the stop button** to send your message
- **The AI will respond with both text and voice**

## Technical Details

### Backend (Flask + Gemini API)
- **API Key**: Configured with your Gemini API key
- **Model**: Uses `gemini-1.5-flash` for fast responses
- **Endpoints**:
  - `GET /api/health` - Health check
  - `POST /api/generate` - Generate AI responses

### Frontend (Next.js + Web Speech API)
- **Speech Recognition**: Uses browser's built-in speech recognition
- **Speech Synthesis**: AI responses are spoken back
- **Real-time UI**: Updates as you speak and receive responses

## Requirements

- **Backend**: Python 3.7+, Flask, google-generativeai
- **Frontend**: Node.js, Next.js, React
- **Browser**: Chrome/Safari with microphone access
- **Internet**: Required for Gemini API calls

## Troubleshooting

1. **Microphone not working**: Make sure to allow microphone access in your browser
2. **Speech recognition issues**: Try refreshing the page or using a different browser
3. **API errors**: Check that the backend server is running on port 5000
4. **CORS errors**: The backend has CORS enabled for localhost:3000

## API Endpoints

- `GET /` - API information
- `GET /api/health` - Health check
- `POST /api/generate` - Send prompt to Gemini AI

Example API call:
```bash
curl -X POST http://localhost:5000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello, how are you?"}'
```

Enjoy chatting with your AI assistant! 🚀
