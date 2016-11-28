import flask
import json

REDWOOD_SEGMENT_INFO_FILE = 'redwood_segment_info.json'

app = flask.Flask(__name__, static_url_path='')


@app.route('/')
def map():
    return flask.render_template('map.html')


@app.route('/segments/<park>')
def segments(park):
    if park == 'redwood':
        with open(REDWOOD_SEGMENT_INFO_FILE) as infile:
            redwood_segment_info = json.load(infile)
            return flask.jsonify(segments=redwood_segment_info)


if __name__ == '__main__':
    app.secret_key = 'super_secret_key'
    app.config['DEBUG'] = True
    app.run(host='localhost', port=5000)
