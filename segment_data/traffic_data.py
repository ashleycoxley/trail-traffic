import os
import requests
import datetime
import pytz
import json


STRAVA_ACCESS_TOKEN = os.environ['STRAVA_ACCESS_TOKEN']
TRAFFIC_URL = "https://www.strava.com/api/v3/segments/%s/all_efforts"
CALIFORNIA_TIMEZONE = "US/Pacific"
REDWOOD_SEGMENT_INPUT_FILE = 'redwood_segment_input.json'


def build_segment_id_dict(segment_input_file):
    with open(segment_input_file, 'r') as infile:
        segments = json.load(infile).get('redwood_segments')
    segment_id_dict = {}
    for segment in segments:
        trail_id = segment['id']
        strava_ids = segment['strava_ids']
        segment_id_dict[trail_id] = strava_ids
    return segment_id_dict


SEGMENT_ID_DICT = build_segment_id_dict(REDWOOD_SEGMENT_INPUT_FILE)


def get_traffic_count(trail_id, time_parameter):
    if time_parameter == 'current':
        starttime_iso, endtime_iso = get_current_time_period_bounds(CALIFORNIA_TIMEZONE)
        traffic_count = get_traffic_total(trail_id, starttime_iso, endtime_iso)
        return traffic_count
    elif time_parameter.isdigit:
        time_parameter = int(time_parameter)
        recent_dates = get_recent_dates_for_weekday(time_parameter, CALIFORNIA_TIMEZONE)
        traffic_counts = []
        for date in recent_dates:
            starttime_iso, endtime_iso = get_weekday_time_period_bounds(date)
            traffic_count = get_traffic_total(trail_id, starttime_iso, endtime_iso)
            traffic_counts.append(traffic_count)
        avg_traffic_count = sum(traffic_counts) / len(traffic_counts)
        return avg_traffic_count
    else:
        raise ValueError("""Time period for Strava traffic data not understood.
                         Valid parameters are 'current' or an integer between 0
                         and 6, representing the days of the week (Mon - Sun).""")


def get_current_datetime(timezone_str):
    tz = pytz.timezone(timezone_str)
    return datetime.datetime.now(tz)


def get_recent_dates_for_weekday(weekday_requested, timezone_str):
    current_datetime = get_current_datetime(timezone_str)
    current_weekday = current_datetime.weekday()
    if current_weekday == weekday_requested:  # Ignore today
        offset = 7
    else:
        offset = (current_weekday - weekday_requested) % 7
    offset_timedelta = datetime.timedelta(days=offset)
    previous_weekday_date = (current_datetime - offset_timedelta).date()

    seven_day_timedelta = datetime.timedelta(days=7)
    recent_dates_for_weekday = [previous_weekday_date]
    for i in range(2):
        previous_weekday_date = previous_weekday_date - seven_day_timedelta
        recent_dates_for_weekday.append(previous_weekday_date)
    return recent_dates_for_weekday


def get_weekday_time_period_bounds(datetime_obj):
    start_time = datetime.datetime.combine(datetime_obj, datetime.time())
    next_day = datetime_obj + datetime.timedelta(days=1)
    end_time = datetime.datetime.combine(next_day, datetime.time())
    starttime_iso = start_time.isoformat()
    endtime_iso = end_time.isoformat()
    return starttime_iso, endtime_iso


def get_current_traffic(timezone_str):
    starttime_iso, endtime_iso = get_current_time_period_bounds(timezone_str)


def get_current_time_period_bounds(timezone_str):
    """Return time period bounds for Strava API segment efforts query."""
    current_datetime = get_current_datetime(timezone_str)
    starttime_iso = (current_datetime - datetime.timedelta(hours=4)).isoformat()
    endtime_iso = current_datetime.isoformat()
    return starttime_iso, endtime_iso


def get_traffic_total(trail_id, starttime_iso, endtime_iso):
    strava_segment_id_list = SEGMENT_ID_DICT[trail_id]
    traffic_counts = []
    for segment_id in strava_segment_id_list:
        traffic_count = strava_traffic_request(segment_id, starttime_iso, endtime_iso)
        traffic_counts.append(traffic_count)
    traffic_total = sum(traffic_counts)
    return traffic_total


def strava_traffic_request(segment_id, starttime_iso, endtime_iso):
    auth_header = {'Authorization': "Bearer " + STRAVA_ACCESS_TOKEN}
    segment_traffic_url = TRAFFIC_URL % segment_id
    segment_traffic_params = {
        'start_date_local': starttime_iso,
        'end_date_local': endtime_iso,
        'per_page': 200
    }
    # TODO: handle cases with >200 efforts (paging)
    traffic_response = requests.get(segment_traffic_url,
                                    params=segment_traffic_params,
                                    headers=auth_header)
    traffic_count = len(traffic_response.json())
    return traffic_count
