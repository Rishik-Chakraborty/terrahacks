import os
from dotenv import load_dotenv
import google.generativeai as genai
from flask import Flask, request, jsonify
from flask_cors import CORS

# Load environment variables from .env file
load_dotenv()

# Configure the API key
genai.configure(api_key="AIzaSyB9vu3unqqhMrKEk_EnDSvizk6XT8C4lMQ")

# Create a model instance - using a more stable model
model = genai.GenerativeModel('gemini-1.5-flash')

app = Flask(__name__)
CORS(app)

@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'message': 'Gemini API Server is running',
        'endpoints': {
            'health': '/api/health',
            'generate': '/api/generate'
        }
    })

@app.route('/api/generate', methods=['POST'])
def generate_content():
    try:
        data = request.get_json()
        prompt = data.get('prompt', '')
        
        if not prompt:
            return jsonify({'error': 'No prompt provided'}), 400
        
        # Generate content
        response = model.generate_content(prompt)
        
        return jsonify({
            'response': response.text,
            'success': True
        })
    
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Gemini API is working'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)