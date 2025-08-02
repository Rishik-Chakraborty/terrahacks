import requests
import json

def test_api():
    # Test health endpoint
    print("Testing health endpoint...")
    response = requests.get('http://localhost:5000/api/health')
    print(f"Health check: {response.json()}")
    
    # Test generate endpoint
    print("\nTesting generate endpoint...")
    data = {
        "prompt": "Explain how AI works in a few words"
    }
    response = requests.post(
        'http://localhost:5000/api/generate',
        headers={'Content-Type': 'application/json'},
        data=json.dumps(data)
    )
    print(f"Generate response: {response.json()}")

if __name__ == "__main__":
    test_api() 