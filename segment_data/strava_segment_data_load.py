import requests
import json

ACCESS_TOKEN = 'STRAVA_KEY'
REDWOOD_SEGMENTS = [6333339, 799775, 6236074, 653093, 6236074, 3636730]

auth_header = {'Authorization': "Bearer " + ACCESS_TOKEN}
segment_info_url = "https://www.strava.com/api/v3/segments/%s"

redwood_segment_info = []

for segment_id in REDWOOD_SEGMENTS:
    segment_url = segment_info_url % segment_id
    segment_info_response = requests.get(segment_url, headers=auth_header)
    redwood_segment_info.append(segment_info_response.json())

redwood_segment_json_output = {'segments': redwood_segment_info}

with open('redwood_segment_info.json', 'w') as f:
    json.dump(redwood_segment_json_output, f)