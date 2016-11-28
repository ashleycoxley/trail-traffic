function initializeMap() {
  // Google map initialization, to be called in $(document).ready()
  map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: 37.810690, lng: -122.170217},
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    });

  return map;
}


$(document).ready(function() {

  var Segment = function(data) {
    this.startPt = ko.observable(data.start_latlng);
    this.endPt = ko.observable(data.end_latlng);
    this.polyLine = ko.observable(data.map.polyline);
    this.name = ko.observable(data.name);
  };

  var ViewModel = function() {
    var self = this;
    var map = initializeMap();

    $.get('/segments/redwood', function(data) {
      var redwoodSegments = data.segments;
      redwoodSegments.forEach(function(segment) {
        var segmentID = segment.id;
        // Pre-load traffic data into infoWindow
        infoWindow = new google.maps.InfoWindow();
        infoWindow.setOptions({
          content: setTrafficData(segment.id, infoWindow)
        });

        // Draw segment line
        polyLine = segment.map.polyline;
        var decodedSegment = google.maps.geometry.encoding.decodePath(polyLine);

        segmentLine = new google.maps.Polyline({
          path: decodedSegment,
          geodesic: true,
          strokeColor: '#FF0000',
          strokeOpacity: 1,
          strokeWeight: 3
        });
        segmentLine.setMap(map);

        // Add click handler to segment that displays infoWindow with traffic
        setSegmentClickHandler(segmentLine, infoWindow, segmentID);

      });
    });

    function setSegmentClickHandler(segmentLine, infoWindow, segmentID) {
      var currentSegment = segmentLine;
      var currentInfoWindow = infoWindow;
      currentSegment.addListener('click', function(event) {
        var currentEvent = event;
        infoWindow.setPosition(currentEvent.latLng);
        infoWindow.open(map);
      });
    }

    function setTrafficData(segmentID, infoWindow) {
      var trafficURL = '/traffic/' + segmentID;
      $.get(trafficURL, function(data) {
        var traffic_content = data.traffic_count.toString() +
                              " bicyclists in the past 7 days";
        infoWindow.setOptions({
          content: traffic_content
        });
      });
    }

  };

  ko.applyBindings(new ViewModel());

});
