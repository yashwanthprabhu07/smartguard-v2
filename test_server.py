import requests

# The hackathon server's URL
url = "http://localhost:3000/machines"

# Ask the server for the list of machines
response = requests.get(url)

# Print the answer
print("Status code:", response.status_code)
print("Response:")
print(response.json())