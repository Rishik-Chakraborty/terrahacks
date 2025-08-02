import requests
import json

def test_api():
    # Test health endpoint
    print("Testing health endpoint...")
    response = requests.get('http://localhost:5000/api/health')
    print(f"Health check: {response.json()}")
    
    # Test echo endpoint
    print("\nTesting echo endpoint...")
    data = {
        "text": "Hello, this is a test of the ElevenLabs API."
    }
    response = requests.post(
        'http://localhost:5000/api/echo',
        headers={'Content-Type': 'application/json'},
        data=json.dumps(data)
    )

    if response.status_code == 200:
        response_data = response.json()
        if response_data.get("success"):
            print("API call successful.")
            audio_base64 = response_data.get("audio")
            if audio_base64:
                import base64
                file_to_save = "test_output.mp3"
                with open(file_to_save, "wb") as f:
                    f.write(base64.b64decode(audio_base64))
                print(f"Audio saved to {file_to_save}")
            else:
                print("Error: No audio data in response.")
        else:
            print(f"API call failed: {response_data.get('error')}")
    else:
        print(f"HTTP Error: {response.status_code}")
        print(f"Response: {response.text}")

if __name__ == "__main__":
    test_api() 