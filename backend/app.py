import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import base64
from pathlib import Path

# Load environment variables from .env file
dotenv_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=dotenv_path)

app = Flask(__name__)
CORS(app)

# ElevenLabs configuration
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"  # Rachel voice (you can change this)
ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1"

@app.route('/')
def home():
    return jsonify({
        "message": "Voice Echo API",
        "endpoints": {
            "health": "/api/health",
            "echo": "/api/echo"
        }
    })

@app.route('/api/health')
def health():
    return jsonify({"status": "healthy", "message": "Voice Echo API is running"})

@app.route('/api/echo', methods=['POST'])
def echo():
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