import requests
import json
import time

url = "http://localhost:8000/api/meetings/upload"
data = {
    "title": "Example Marketing Meeting",
    "text": "John: We need to finalize the marketing strategy by Friday.\nSarah: I will prepare the marketing report tomorrow.\nAlex: I will schedule a meeting with the design team next Monday."
}

# Wait a moment for server to start
time.sleep(2)

try:
    print("Sending request to FastAPI...")
    response = requests.post(url, data=data)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        res_json = response.json()
        print(f"Success! Response: {res_json}")
        
        meeting_id = res_json['meeting_id']
        details_url = f"http://localhost:8000/api/meetings/{meeting_id}"
        details_res = requests.get(details_url)
        print("\n--- Details ---")
        print(json.dumps(details_res.json(), indent=2))
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Exception occurred: {e}")
