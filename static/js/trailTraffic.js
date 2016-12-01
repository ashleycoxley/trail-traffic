var Segment = function(data, map) {
  var thisSegment = this;
  this.id = ko.observable(data.id);
  this.name = ko.observable(data.name);

  this.startPt = ko.computed(function() {
    var lat = data.start_latlng[0];
    var lng = data.start_latlng[1];
    return new google.maps.LatLng(lat, lng);
  });

  this.infoWindow = new google.maps.InfoWindow({
    content: "<b>" + data.name + "</b><br>"
  });

  this.setTrafficData = ko.computed(function() {
    var trafficURL = '/traffic/' + thisSegment.id();
    var trafficResp = $.get(trafficURL, function(data) {
      var trafficContent = "<b>" + thisSegment.name() + "</b><br>" +
                            data.traffic_count.toString() +
                            " bicyclists in the past 7 days";
      thisSegment.infoWindow.setOptions({
        content: trafficContent
      });
    });
    trafficResp.fail(function() {
      alert("Strava traffic data failed to load. Try again later.");
    });
  });

  this.decodedSegment = ko.computed(function() {
    return google.maps.geometry.encoding.decodePath(data.map.polyline);
  });

    this.mapLine = ko.computed(function() {
    return new google.maps.Polyline({
      path: thisSegment.decodedSegment(),
      geodesic: true,
      strokeColor: '#FF0000',
      strokeOpacity: 1,
      strokeWeight: 3
    });
  });

  this.segmentDisplayed = ko.observable(true);

  this.displayLine = ko.computed(function() {
    if (thisSegment.segmentDisplayed() === true) {
      thisSegment.mapLine().setMap(map);
    } else {
      thisSegment.mapLine().setMap(null);
    }
  });

  this.segmentSelected = ko.observable(false);

  this.selectSegment = ko.computed(function() {
    if (thisSegment.segmentSelected() === true) {
      thisSegment.mapLine().setOptions({
        strokeColor: "#000000"
      });
      thisSegment.infoWindow.setPosition(thisSegment.startPt());
      thisSegment.infoWindow.open(map);
    } else {
      thisSegment.mapLine().setOptions({
        strokeColor: "#FF0000"
      });
      thisSegment.infoWindow.close(map);
    }
  });

  this.setSegmentClickHandler = ko.computed(function() {
    thisSegment.mapLine().addListener('click', function(event) {
      thisSegment.segmentSelected(true);
    });
  });

  this.setSegmentUnclickHandler = ko.computed(function() {
    google.maps.event.addListener(map, "click", function() {
      thisSegment.segmentSelected(false);
    });
  });
};
  

var ViewModel = function() {
  var self = this;
  try {
    var map = new google.maps.Map(document.getElementById('map'), {
    center: {lat:37.813536, lng:-122.178588},
    zoom: 15,
    mapTypeId: google.maps.MapTypeId.ROADMAP
    });
  } catch (error) {
    alert("There was an error loading Google Maps. Try again later.");
  }
  
  var segmentLines = [];
  this.segmentList = ko.observableArray([]);
  this.searchInput = ko.observable();

  initialSegmentsResp = $.get('/segments/redwood', function(data) {
    var redwoodSegments = data.segments;
    redwoodSegments.forEach(function(segment, idx) {
      self.segmentList.push(new Segment(segment, map));
    });
  });

  initialSegmentsResp.fail(function() {
      alert("Trail segments data failed to load. Try again later.");
    });

  this.changeSelected = function(displayListItem) {
    self.segmentList().forEach(function(segment) {
      segment.segmentSelected(false);
    });
    displayListItem.segmentSelected(true);
  };

  this.filterSegments = ko.computed(function() {
    if (!self.searchInput()) {
      self.segmentList().forEach(function(segment) {
        segment.segmentDisplayed(true);
      });
      return self.segmentList();
    }
    var searchInputLower = self.searchInput().toLowerCase();
    return ko.utils.arrayFilter(self.segmentList(), function(segment) {
      var match = segment.name().toLowerCase().indexOf(searchInputLower) >= 0;
      segment.segmentDisplayed(match);
      return match;
    });
  });
};


function initializeMap() {
  ko.applyBindings(new ViewModel(map));
}
