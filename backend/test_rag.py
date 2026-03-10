import requests

# 1. Upload a test meeting to seed the Vector DB
upload_resp = requests.post(
    "http://127.0.0.1:8000/api/meetings/upload",
    data={"title": "Q3 Marketing Sync", "text": "In today's meeting, John emphasized that the marketing budget for Q4 is strictly capped at $50,000. Sarah confirmed that the new email campaign will launch on October 15th."}
)
print(f"Upload Result: {upload_resp.json()}")

# 2. Query the Chat API
chat_resp = requests.post(
    "http://127.0.0.1:8000/api/chat",
    json={"query": "What is the marketing budget cap for Q4?"}
)
print(f"Chat Result: {chat_resp.json()}")
