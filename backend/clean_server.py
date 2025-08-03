# clean_server.py - Clean version without any imports that might be missing
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from flask_cors import CORS
import os
import json
from datetime import datetime

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Allow all origins for testing
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['SUMMARIES_FOLDER'] = 'summaries'

# Create directories
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['SUMMARIES_FOLDER'], exist_ok=True)

# Test route
@app.route('/')
def home():
    return jsonify({"message": "Flask server is running!", "status": "ok"})

@app.route('/test')
def test_route():
    return jsonify({"test": "Route registration working"})

# User data route - simplified for testing
@app.route('/api/user_data', methods=['GET'])
def get_user_data():
    session_id = request.args.get('sessionId')
    print(f"DEBUG: get_user_data called with sessionId: {session_id}")
    
    if not session_id:
        return jsonify({'error': 'No sessionId provided'}), 400

    user_data_path = 'user_data.json'
    
    # Create test data if file doesn't exist
    if not os.path.exists(user_data_path):
        print("DEBUG: Creating test user_data.json")
        test_data = {
            session_id: {
                "patient_name": "John Doe",
                "medication": "Aspirin 100mg", 
                "doctor": "Dr. Smith"
            }
        }
        try:
            with open(user_data_path, 'w') as f:
                json.dump(test_data, f, indent=2)
            print(f"DEBUG: Created test data for session: {session_id}")
        except Exception as e:
            print(f"DEBUG: Error creating test data: {e}")
            return jsonify({'error': f'Could not create test data: {str(e)}'}), 500

    try:
        with open(user_data_path, 'r') as f:
            user_data = json.load(f)
        
        print(f"DEBUG: Loaded user_data: {user_data}")
        print(f"DEBUG: Available sessions: {list(user_data.keys())}")

        data = user_data.get(session_id)
        if not data:
            print(f"DEBUG: No data found for session: {session_id}")
            return jsonify({'error': f'No data found for session: {session_id}'}), 404

        print(f"DEBUG: Returning data: {data}")
        return jsonify(data)

    except Exception as e:
        print(f"DEBUG: Error reading user data: {str(e)}")
        return jsonify({'error': f'Failed to retrieve user data: {str(e)}'}), 500

# Debug route
@app.route('/debug/routes')
def debug_routes():
    routes = []
    for rule in app.url_map.iter_rules():
        routes.append({
            'rule': str(rule),
            'methods': list(rule.methods),
            'endpoint': rule.endpoint
        })
    return jsonify({"routes": routes, "total": len(routes)})

if __name__ == "__main__":
    print("="*50)
    print("STARTING FLASK SERVER")
    print("="*50)
    print("Test these URLs:")
    print("• http://localhost:5000/")
    print("• http://localhost:5000/test")
    print("• http://localhost:5000/debug/routes")
    print("• http://localhost:5000/api/user_data?sessionId=test123")
    print("="*50)
    
    app.run(debug=True, host='127.0.0.1', port=5000)