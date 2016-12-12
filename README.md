# Trailways

![Trailways example](/static/img/example_img.png)

### About
Trailways is a one-page map application designed to help horseback riders in Redwood Regional Park (Oakland, CA) avoid bicycle traffic on the trails. Bikes sometimes scare horses, so less traffic is preferable.

Common riding trail segments are highlighted on the map and shown in a searchable list format. The default view shows current traffic (within the last 3 hours), and other options let you check recent average traffic for a particular weekday. Data is pulled from the Strava API.

[Trailways is live here.](http://www.trailwaystraffic.com)

### Running the app locally

To run the app locally, you must have Python 2.7 and pip installed. Additionally, you must have a Strava account with an API key. [Set up here.](https://www.strava.com/settings/api)

+ Clone this repository
+ Set local environment variable ```STRAVA_ACCESS_TOKEN``` to your access token.
+ ```pip install -r requirements.txt```
+ From the root folder, run ```python app.py```
+ View Trailways at ```http::/localhost:5000```
