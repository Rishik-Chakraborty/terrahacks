'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function VoiceChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    console.log('🔧 useEffect triggered - initializing speech recognition');
    
    // Initialize speech recognition only once
    if (!isInitializedRef.current && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      console.log('🎤 Speech recognition supported, initializing...');
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; // Changed to false for better control
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      console.log('📝 Setting up speech recognition event handlers');

      recognitionRef.current.onresult = (event: any) => {
        console.log('🎯 Speech recognition result event triggered');
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
            console.log('✅ Final transcript part:', event.results[i][0].transcript);
          } else {
            interimTranscript += event.results[i][0].transcript;
            console.log('🔄 Interim transcript part:', event.results[i][0].transcript);
          }
        }
        
        if (finalTranscript) {
          finalTranscriptRef.current = finalTranscript;
          setTranscript(finalTranscript);
          console.log('🎉 Final transcript captured:', finalTranscript);
          
          // Auto-stop recording after getting final transcript
          console.log('⏰ Setting auto-stop timer for 1.5 seconds');
          setTimeout(() => {
            if (isRecording) {
              console.log('🛑 Auto-stopping recording after final transcript');
              stopRecording();
            } else {
              console.log('❌ Not recording anymore, skipping auto-stop');
            }
          }, 1500); // Wait 1.5 seconds after final transcript
        } else if (interimTranscript) {
          setTranscript(interimTranscript);
          console.log('📝 Interim transcript updated:', interimTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('🚨 Speech recognition error:', event.error);
        setIsListening(false);
        // Don't treat 'aborted' as a critical error
        if (event.error !== 'aborted') {
          console.log('⚠️ Non-critical speech recognition error:', event.error);
        } else {
          console.log('ℹ️ Speech recognition aborted (normal behavior)');
        }
      };

      recognitionRef.current.onend = () => {
        console.log('🏁 Speech recognition ended');
        setIsListening(false);
        
        // If we have a final transcript and we're still recording, send it
        if (isRecording && finalTranscriptRef.current.trim()) {
          console.log('📤 Sending final transcript on recognition end:', finalTranscriptRef.current);
          sendTranscriptToBackend(finalTranscriptRef.current);
        } else {
          console.log('❌ No final transcript or not recording, skipping send');
        }
      };

      recognitionRef.current.onstart = () => {
        console.log('🚀 Speech recognition started');
        setIsListening(true);
        finalTranscriptRef.current = '';
      };

      isInitializedRef.current = true;
      console.log('✅ Speech recognition initialized successfully');
    } else if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      console.error('❌ Speech recognition not supported in this browser');
    } else {
      console.log('ℹ️ Speech recognition already initialized');
    }
  }, []);

  const startRecording = async () => {
    console.log('🎤 Starting recording process...');
    try {
      console.log('🎙️ Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Microphone access granted');
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        console.log('📦 Audio data available:', event.data.size, 'bytes');
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        console.log('🛑 Media recorder stopped');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        console.log('🎵 Audio blob created:', audioBlob.size, 'bytes');
        // We'll use the transcript instead of audio for now
      };

      console.log('▶️ Starting media recorder...');
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setTranscript('');
      finalTranscriptRef.current = '';
      console.log('✅ Recording state set to true');
      
      // Start speech recognition with error handling
      if (recognitionRef.current && !isListening) {
        console.log('🎯 Starting speech recognition...');
        try {
          recognitionRef.current.start();
          console.log('✅ Speech recognition start successful');
        } catch (error) {
          console.log('❌ Speech recognition start error:', error);
          // Continue with recording even if speech recognition fails
        }
      } else {
        console.log('⚠️ Speech recognition not available or already listening');
      }

      // Auto-stop after 15 seconds of silence
      console.log('⏰ Setting timeout for 15 seconds');
      timeoutRef.current = setTimeout(() => {
        if (isRecording) {
          console.log('⏰ Auto-stopping due to timeout');
          stopRecording();
        } else {
          console.log('ℹ️ Already stopped, skipping timeout stop');
        }
      }, 15000);
    } catch (error) {
      console.error('🚨 Error accessing microphone:', error);
      alert('Please allow microphone access to use voice chat.');
    }
  };

  const stopRecording = () => {
    console.log('🛑 Stop recording called');
    if (timeoutRef.current) {
      console.log('⏰ Clearing timeout');
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (mediaRecorderRef.current && isRecording) {
      console.log('🛑 Stopping media recorder...');
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => {
        console.log('🔇 Stopping track:', track.kind);
        track.stop();
      });
      setIsRecording(false);
      console.log('✅ Recording state set to false');
      
      // Stop speech recognition with error handling
      if (recognitionRef.current && isListening) {
        console.log('🛑 Stopping speech recognition...');
        try {
          recognitionRef.current.stop();
          console.log('✅ Speech recognition stop successful');
        } catch (error) {
          console.log('❌ Speech recognition stop error:', error);
        }
      } else {
        console.log('ℹ️ Speech recognition not running or not listening');
      }
    } else {
      console.log('ℹ️ Media recorder not available or not recording');
    }
  };

  const sendTranscriptToBackend = async (userMessage: string) => {
    console.log('📤 sendTranscriptToBackend called with:', userMessage);
    
    if (!userMessage.trim() || userMessage.length < 2) {
      console.log('❌ Empty or too short transcript, not sending');
      return;
    }

    console.log('⏳ Setting loading state to true');
    setIsLoading(true);
    
    try {
      // Add user message to chat
      const userMsg: Message = {
        id: Date.now().toString(),
        text: userMessage,
        isUser: true,
        timestamp: new Date()
      };
      console.log('💬 Adding user message to chat:', userMessage);
      setMessages(prev => [...prev, userMsg]);

      console.log('🌐 Sending to backend:', userMessage);

      // Send to backend with a more conversational prompt
      const response = await fetch('http://localhost:5000/api/echo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: userMessage
        })
      });

      console.log('📡 Backend response status:', response.status);
      const data = await response.json();
      console.log('📄 Backend response data:', data);
      
      if (data.success) {
        // Play the audio response
        console.log('🔊 Playing audio response...');
        playAudio(data.audio);

        // Add a message to the chat to indicate AI is responding
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: "AI is responding...",
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);

      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('🚨 Error sending message:', error);
      const errorMsg: Message = {
        id: Date.now().toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date()
      };
      console.log('❌ Adding error message to chat');
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      console.log('✅ Setting loading state to false');
      setIsLoading(false);
      setTranscript('');
      finalTranscriptRef.current = '';
    }
  };

  const playAudio = (audioBase64: string) => {
    try {
      const audioBlob = new Blob([Buffer.from(audioBase64, 'base64')], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onplay = () => {
        setIsSpeaking(true);
      };

      audio.onended = () => {
        setIsSpeaking(false);
      };

      audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const sendTextMessage = async (text: string) => {
    console.log('📝 sendTextMessage called with:', text);
    
    if (!text.trim()) return;
    
    console.log('⏳ Setting loading state to true');
    setIsLoading(true);
    
    try {
      const userMsg: Message = {
        id: Date.now().toString(),
        text: text,
        isUser: true,
        timestamp: new Date()
      };
      console.log('💬 Adding user message to chat:', text);
      setMessages(prev => [...prev, userMsg]);

      console.log('🌐 Sending text to backend:', text);
      const response = await fetch('http://localhost:5000/api/echo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: text
        })
      });

      console.log('📡 Backend response status:', response.status);
      const data = await response.json();
      console.log('📄 Backend response data:', data);
      
      if (data.success) {
        // Play the audio response
        console.log('🔊 Playing audio response...');
        playAudio(data.audio);

        // Add a message to the chat to indicate AI is responding
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: "AI is responding...",
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('🚨 Error sending message:', error);
      const errorMsg: Message = {
        id: Date.now().toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date()
      };
      console.log('❌ Adding error message to chat');
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      console.log('✅ Setting loading state to false');
      setIsLoading(false);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    console.log('📝 Text form submitted');
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.elements.namedItem('message') as HTMLInputElement;
    const text = input.value.trim();
    if (text) {
      console.log('📝 Sending text message:', text);
      sendTextMessage(text);
      input.value = '';
    } else {
      console.log('❌ Empty text message, not sending');
    }
  };

  console.log('🎨 Rendering VoiceChat component');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <div className="flex-1 max-w-4xl mx-auto w-full p-4">
        <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">Voice AI Chat</h1>
            <p className="text-gray-600 mt-1">Chat with our AI using voice or text</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <div className="text-6xl mb-4">🎤</div>
                <p>Start a conversation by speaking or typing!</p>
                <p className="text-sm mt-2 text-gray-400">Just click the microphone and speak - it will respond automatically!</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.isUser
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Voice Recording Status */}
          {isRecording && (
            <div className="px-6 py-3 bg-red-50 border-t border-red-200">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-700 font-medium">Listening...</span>
                {transcript && (
                  <span className="text-red-600 text-sm">"{transcript}"</span>
                )}
              </div>
            </div>
          )}

          {/* Speaking Status */}
          {isSpeaking && (
            <div className="px-6 py-3 bg-green-50 border-t border-green-200">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-700 font-medium">AI is speaking...</span>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex space-x-4">
              {/* Voice Button */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
                disabled={isLoading || isSpeaking}
              >
                {isRecording ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              {/* Text Input */}
              <form onSubmit={handleTextSubmit} className="flex-1 flex">
                <input
                  type="text"
                  name="message"
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading || isRecording || isSpeaking}
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={isLoading || isRecording || isSpeaking}
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
