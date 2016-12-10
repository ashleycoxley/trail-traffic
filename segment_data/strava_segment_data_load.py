import requests
import json
import os

STRAVA_ACCESS_TOKEN = os.environ['STRAVA_ACCESS_TOKEN']
REDWOOD_SEGMENT_INPUT_FILE = 'redwood_segment_input.json'

def generate_segment_info(segment_input_file):
    auth_header = {'Authorization': "Bearer " + STRAVA_ACCESS_TOKEN}
    segment_info_url = "https://www.strava.com/api/v3/segments/%s"

    redwood_segment_info = []
    with open('/Users/ashley/Projects/trail-traffic/segment_data/redwood_segment_input.json', 'r') as infile:
        redwood_segments = json.load(infile)

    for segment in redwood_segments['redwood_segments']:
        segment_id = segment['strava_ids'][0]
        segment_url = segment_info_url % segment_id
        segment_info_response = requests.get(segment_url, headers=auth_header)
        segment['polyline'] = segment_info_response.json()['map']['polyline']
        segment['start_pt'] = segment_info_response.json()['start_latlng']
        redwood_segment_info.append(segment)

    redwood_segment_json_output = {'segments': redwood_segment_info}

    with open('redwood_segment_info.json', 'w') as f:
        json.dump(redwood_segment_json_output, f)
