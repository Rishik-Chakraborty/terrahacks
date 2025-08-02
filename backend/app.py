import os
from dotenv import load_dotenv
import google.generativeai as genai
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import base64

# Load environment variables from .env file
load_dotenv()

# Configure the API key
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Create a model instance - using a more stable model
model = genai.GenerativeModel('gemini-1.5-flash')

app = Flask(__name__)
CORS(app)

# ElevenLabs configuration
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"  # Rachel voice (you can change this)
ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1"

@app.route('/')
def home():
    return jsonify({
        "message": "Voice AI Chat API",
        "endpoints": {
            "health": "/api/health",
            "generate": "/api/generate",
            "text-to-speech": "/api/tts"
        }
    })

@app.route('/api/health')
def health():
    return jsonify({"status": "healthy", "message": "Voice AI Chat API is running"})

@app.route('/api/generate', methods=['POST'])
def generate():
    try:
        data = request.get_json()
        prompt = data.get('prompt', '')
        
        if not prompt:
            return jsonify({"success": False, "error": "No prompt provided"}), 400
        
        response = model.generate_content(prompt)
        return jsonify({"success": True, "response": response.text})
    
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/tts', methods=['POST'])
def text_to_speech():
    try:
        data = request.get_json()
        text = data.get('text', '')
        voice_id = data.get('voice_id', ELEVENLABS_VOICE_ID)
        
        if not text:
            return jsonify({"success": False, "error": "No text provided"}), 400
        
        # Call ElevenLabs API
        url = f"{ELEVENLABS_BASE_URL}/text-to-speech/{voice_id}"
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY
        }
        
        payload = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5
            }
        }
        
        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code == 200:
            # Convert audio to base64 for frontend
            audio_base64 = base64.b64encode(response.content).decode('utf-8')
            return jsonify({
                "success": True, 
                "audio": audio_base64,
                "format": "audio/mpeg"
            })
        else:
            return jsonify({
                "success": False, 
                "error": f"ElevenLabs API error: {response.status_code} - {response.text}"
            }), 500
            
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)