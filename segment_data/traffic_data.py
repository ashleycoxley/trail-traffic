import os
import requests
import datetime


STRAVA_ACCESS_TOKEN = os.environ['STRAVA_ACCESS_TOKEN']
TRAFFIC_URL = "https://www.strava.com/api/v3/segments/%s/all_efforts"


def get_time_period_bounds():
    """Return time period bounds for Strava API segment efforts query."""
    # TODO: add different time periods as arguments
    # TODO #2: explicitly set ISO time zone (using computer's TZ now)
    starttime_iso = (datetime.datetime.now() - datetime.timedelta(days=7)).isoformat()
    endtime_iso = datetime.datetime.now().isoformat()
    return starttime_iso, endtime_iso


def get_effort_count(segment_id):
    auth_header = {'Authorization': "Bearer " + STRAVA_ACCESS_TOKEN}
    segment_traffic_url = TRAFFIC_URL % segment_id
    starttime_iso, endtime_iso = get_time_period_bounds()
    segment_traffic_params = {
        'start_date_local': starttime_iso,
        'end_date_local': endtime_iso,
        'per_page': 200
    }

    traffic_response = requests.get(segment_traffic_url,
                                    params=segment_traffic_params,
                                    headers=auth_header)
    effort_count = len(traffic_response.json())
    return effort_count
