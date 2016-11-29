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
    var own = this;
    this.id = ko.observable(data.id);
    this.name = ko.observable(data.name);

    this.infoWindow = new google.maps.InfoWindow({
      content: "<b>" + data.name + "</b><br>"
    });

    this.setTrafficData = ko.computed(function() {
      var trafficURL = '/traffic/' + own.id();
      $.get(trafficURL, function(data) {
        var traffic_content = "<b>" + own.name() + "</b><br>" +
                              data.traffic_count.toString() +
                              " bicyclists in the past 7 days";
        own.infoWindow.setOptions({
          content: traffic_content
        });
      });
    });

    this.decodedSegment = ko.computed(function() {
      return google.maps.geometry.encoding.decodePath(data.map.polyline);
    });

    this.mapLine = ko.computed(function() {
      return new google.maps.Polyline({
        path: own.decodedSegment(),
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1,
        strokeWeight: 3
      });
    });

    this.displayedOnMap = ko.observable(true);

    this.displayLine = ko.computed(function() {
      if (own.displayedOnMap() === true) {
        own.mapLine().setMap(map);
      } else {
        own.mapLine().setMap(null);
      }
    });

    this.setSegmentClickHandler = ko.computed(function() {
      own.mapLine().addListener('click', function(event) {
        var currentEvent = event;
        own.infoWindow.setPosition(currentEvent.latLng);
        own.infoWindow.open(map);
      });
    });
  };
  

  var ViewModel = function() {
    var self = this;
    var map = initializeMap();
    var segmentLines = [];
    this.segmentList = ko.observableArray([]);
    this.searchInput = ko.observable();

    $.get('/segments/redwood', function(data) {
      var redwoodSegments = data.segments;
      redwoodSegments.forEach(function(segment, idx) {
        self.segmentList.push(new Segment(segment));
      });
    });

    this.selectSegment = function(displayListItem) {
      self.segmentList().forEach(function(segment) {
        segment.mapLine().setOptions({
          strokeColor: "#FF0000"
        });
      });
      displayListItem.mapLine().setOptions({
        strokeColor: "#000000"
      });
    };

    this.filterSegments = ko.computed(function() {
      if (!self.searchInput()) {
        self.segmentList().forEach(function(segment) {
          segment.displayedOnMap(true);
        });
        return self.segmentList();
      }
      var searchInputLower = self.searchInput().toLowerCase();
      return ko.utils.arrayFilter(self.segmentList(), function(segment) {
        var match = segment.name().toLowerCase().indexOf(searchInputLower) >= 0;
        segment.displayedOnMap(match);
        return match;
      });
    });
  };

  ko.applyBindings(new ViewModel());

});
