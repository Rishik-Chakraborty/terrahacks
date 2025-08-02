document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const chatLog = document.getElementById('chat-log');

    let recognition;
    let isCallActive = false;

    const API_BASE_URL = 'http://localhost:5000/api';

    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            addLogMessage('AI', 'Listening...');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            addLogMessage('You', transcript);
            getAIResponse(transcript);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            addLogMessage('System', `Error: ${event.error}`);
            if (isCallActive) {
                setTimeout(() => recognition.start(), 1000);
            }
        };

        recognition.onend = () => {
            if (isCallActive) {
                recognition.start();
            }
        };

    } else {
        alert('Speech recognition not supported in this browser.');
        startBtn.disabled = true;
    }

    startBtn.addEventListener('click', () => {
        isCallActive = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        addLogMessage('System', 'Call started.');
        recognition.start();
    });

    stopBtn.addEventListener('click', () => {
        isCallActive = false;
        startBtn.disabled = false;
        stopBtn.disabled = true;
        recognition.stop();
        addLogMessage('System', 'Call ended.');
    });

    function addLogMessage(sender, message) {
        const messageElement = document.createElement('p');
        messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
        chatLog.appendChild(messageElement);
        chatLog.scrollTop = chatLog.scrollHeight;
    }

    async function getAIResponse(userText) {
        try {
            // 1. Get generated text from Gemini
            addLogMessage('AI', 'Thinking...');
            const generateResponse = await fetch(`${API_BASE_URL}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: userText }),
            });

            if (!generateResponse.ok) {
                throw new Error(`Gemini API error: ${generateResponse.statusText}`);
            }

            const generateData = await generateResponse.json();
            const aiText = generateData.response;

            // Update "Thinking..." to the actual response
            const thinkingMessage = chatLog.lastChild;
            thinkingMessage.innerHTML = `<strong>AI:</strong> ${aiText}`;

            // 2. Get audio from ElevenLabs
            const ttsResponse = await fetch(`${API_BASE_URL}/tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: aiText }),
            });

            if (!ttsResponse.ok) {
                throw new Error(`TTS API error: ${ttsResponse.statusText}`);
            }

            const ttsData = await ttsResponse.json();
            const audioBase64 = ttsData.audio;

            // 3. Play the audio
            const audioBlob = base64ToBlob(audioBase64, 'audio/mpeg');
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.play();

        } catch (error) {
            console.error('Error getting AI response:', error);
            addLogMessage('System', `Error: ${error.message}`);
        }
    }

    function base64ToBlob(base64, contentType = '', sliceSize = 512) {
        const byteCharacters = atob(base64);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }

        return new Blob(byteArrays, { type: contentType });
    }
});
