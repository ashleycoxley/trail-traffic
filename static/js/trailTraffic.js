function initializeMap() {
  // Google map initialization, to be called in $(document).ready()
  map = new google.maps.Map(document.getElementById('map'), {
      center: {lat:37.813536, lng:-122.178588},
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
    var segmentLines = [];
    this.segmentList = ko.observableArray([]);

    $.get('/segments/redwood', function(data) {
      var redwoodSegments = data.segments;
      redwoodSegments.forEach(function(segment, idx) {
        var segmentID = segment.id;
        var segmentName = segment.name;
        // Populate KO array
        self.segmentList.push(new Segment(segment));

        // Pre-load traffic data into infoWindow
        infoWindow = new google.maps.InfoWindow();
        infoWindow.setOptions({
          content: setTrafficData(segment.id, infoWindow, segmentName)
        });

        // Draw segment line
        polyLine = segment.map.polyline;
        var decodedSegment = google.maps.geometry.encoding.decodePath(polyLine);

        segmentLines[idx] = new google.maps.Polyline({
          path: decodedSegment,
          geodesic: true,
          strokeColor: '#FF0000',
          strokeOpacity: 1,
          strokeWeight: 3
        });
        segmentLines[idx].setMap(map);

        // Add click handler to segment that displays infoWindow with traffic
        setSegmentClickHandler(segmentLines[idx], infoWindow, segmentID);

      });
    });
    
    this.selectSegment = function(idx) {
      segmentLines.forEach(function(segment) {
        segment.setOptions({
          strokeColor: "#FF0000"
        });
      });
      segmentLines[idx].setOptions({
        strokeColor: "#000000"
      });
    };

    function setSegmentClickHandler(segmentLine, infoWindow, segmentID) {
      var currentSegment = segmentLine;
      var currentInfoWindow = infoWindow;
      currentSegment.addListener('click', function(event) {
        var currentEvent = event;
        infoWindow.setPosition(currentEvent.latLng);
        infoWindow.open(map);
      });
    }

    function setTrafficData(segmentID, infoWindow, segmentName) {
      var trafficURL = '/traffic/' + segmentID;
      $.get(trafficURL, function(data) {
        var traffic_content = "<b>" + segmentName + "</b>" +
                              data.traffic_count.toString() +
                              " bicyclists in the past 7 days";
        infoWindow.setOptions({
          content: traffic_content
        });
      });
    }

  };

  ko.applyBindings(new ViewModel());

});
