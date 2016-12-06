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

  this.setTrafficData = function(trafficQuery) {
    return ko.computed(function() {
      var trafficURL = '/traffic/' + thisSegment.id() + '/' + trafficQuery.value();
      var trafficResp = $.get(trafficURL, function(data) {
        thisSegment.trafficCount(data.traffic_count);
        var trafficContent = "<b>" + thisSegment.name() + "</b><br>" +
                             trafficQuery.name() + ': <b>' +
                             data.traffic_count.toString() + "</b> bicyclists";
        thisSegment.infoWindow.setOptions({
          content: trafficContent
        });
      });
    });
  };

  this.trafficCount = ko.observable(0); // No traffic by default

  this.trafficColor = ko.computed(function() {
    // High value hard-coded at the moment
    var high_value = 8;
    var valuePCT = (parseInt(thisSegment.trafficCount(), 10) / high_value);
    if (valuePCT > 1) {
      valuePCT = 1;
    }
    // Conversion function takes a scaled hue [0,1]
    var hue = ((1-valuePCT) * 120) / 360;
    // Saturation and lightness set to produce red-green scale
    var rgb = hslToRgb(hue, 1, 0.7);
    var hex = '#' + RGBToHex(rgb[0], rgb[1], rgb[2]);
    return hex;
  });

  this.decodedSegment = ko.computed(function() {
    return google.maps.geometry.encoding.decodePath(data.map.polyline);
  });

  this.mapLine = ko.computed(function() {
    return new google.maps.Polyline({
      path: thisSegment.decodedSegment(),
      geodesic: true,
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
        strokeColor: thisSegment.trafficColor()
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


var TimePeriod = function(data) {
  var thisTimePeriod = this;
  this.name = ko.observable(data.name);
  this.value = ko.observable(data.value);
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
  self.segmentList = ko.observableArray([]);
  self.searchInput = ko.observable();
  self.timePeriodList = ko.observableArray([]);
  self.selectedTimePeriod = ko.observable();

  initialSegmentsResp = $.get('/segments/redwood', function(data) {
    var redwoodSegments = data.segments;
    redwoodSegments.forEach(function(segment) {
      self.segmentList.push(new Segment(segment, map));
    });
  });

  initialSegmentsResp.fail(function() {
    alert("Trail segments data failed to load. Try again later.");
  });

  initialTimePeriodsResp = $.get('/time_periods', function(data) {
    var timePeriods = data.time_periods;
    timePeriods.forEach(function(time_period) {
      self.timePeriodList.push(new TimePeriod(time_period));
    });
  });

  initialTimePeriodsResp.fail(function() {
    alert("Traffic data failed to load. Try again later.");
  });

  this.changeTimePeriod = function() {
    self.segmentList().forEach(function(segment) {
      segment.setTrafficData(self.selectedTimePeriod());
    });
  };

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


// Segment line color change functions borrowed from StackOverflow and
// modified for my purposes:
// http://stackoverflow.com/questions/17525215/calculate-color-values-from-green-to-red
// http://stackoverflow.com/questions/7128675/from-green-to-red-color-depend-on-percentage
// https://gist.github.com/lrvick/2080648

function hslToRgb(h, s, l) {
  var r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    function hue2rgb(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    }

    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;

    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [ r * 255, g * 255, b * 255 ];
}

function RGBToHex(r,g,b){
    var bin = r << 16 | g << 8 | b;
    return (function(h){
        return new Array(7-h.length).join("0")+h;
    })(bin.toString(16).toUpperCase());
}


function initializeMap() {
  ko.applyBindings(new ViewModel(map));
}
