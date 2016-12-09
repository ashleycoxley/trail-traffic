import flask
import json
import os
from segment_data import traffic_data

REDWOOD_SEGMENT_INFO_FILE = 'redwood_segment_info.json'
TIME_PERIOD_DATA_FILE = 'time_periods.json'

app = flask.Flask(__name__, static_url_path='')


@app.route('/')
def map():
    return flask.render_template('map.html')


@app.route('/segments/<park>')
def segments(park):
    if park == 'redwood':
        with open(REDWOOD_SEGMENT_INFO_FILE) as infile:
            redwood_segment_info = json.load(infile)
            return flask.jsonify(redwood_segment_info)


@app.route('/time_periods')
def time_periods():
    with open(TIME_PERIOD_DATA_FILE) as infile:
        time_periods = json.load(infile)
        return flask.jsonify(time_periods)


@app.route('/traffic/<int:segment_id>/<time_parameter>')
def get_traffic(segment_id, time_parameter):
    traffic_count = traffic_data.get_traffic_count(segment_id, time_parameter)
    traffic_response = flask.jsonify({
        'segment_id': segment_id,
        'traffic_count': traffic_count})
    return traffic_response


if __name__ == '__main__':
    app.secret_key = 'super_secret_key'
    app.config['DEBUG'] = True
    app.run(host='localhost', port=int(os.environ.get('PORT', 5000)))
