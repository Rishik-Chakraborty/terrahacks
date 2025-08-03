# minimal_server.py
from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return jsonify({"message": "Server is working!", "status": "ok"})

@app.route('/test')
def test():
    return jsonify({"test": "This route works"})

@app.route('/api/user_data')
def get_user_data():
    session_id = request.args.get('sessionId')
    return jsonify({
        "message": "user_data endpoint working",
        "sessionId": session_id,
        "test_data": {
            "patient_name": "Test Patient",
            "medication": "Test Med",
            "doctor": "Test Doctor"
        }
    })

@app.route('/debug/routes')
def debug_routes():
    routes = []
    for rule in app.url_map.iter_rules():
        routes.append({
            'rule': str(rule),
            'methods': list(rule.methods),
            'endpoint': rule.endpoint
        })
    return jsonify({"routes": routes})

if __name__ == '__main__':
    print("Starting minimal Flask server...")
    print("Test these URLs:")
    print("- http://localhost:5000/")
    print("- http://localhost:5000/test") 
    print("- http://localhost:5000/debug/routes")
    print("- http://localhost:5000/api/user_data?sessionId=test123")
    app.run(debug=True, host='0.0.0.0', port=5000)