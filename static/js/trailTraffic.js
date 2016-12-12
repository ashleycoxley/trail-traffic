var Segment = function(data, map) {
  var thisSegment = this;
  this.id = ko.observable(data.id);
  this.name = ko.observable(data.name);

  this.startPt = ko.computed(function() {
    var lat = data.start_pt[0];
    var lng = data.start_pt[1];
    return new google.maps.LatLng(lat, lng);
  });

  this.infoWindow = new google.maps.InfoWindow({
    content: "<b>" + data.name + "</b><br>"
  });

  this.setTrafficData = function(trafficQueryObj) {
    return ko.computed(function() {
      var trafficURL = '/traffic/' + thisSegment.id() + '/' + trafficQueryObj.value();
      var trafficResp = $.get(trafficURL, function(data) {
        thisSegment.trafficCount(data.traffic_count);
        var trafficContent = "<b>" + thisSegment.name() + "</b><br>" +
                             trafficQueryObj.name() + ': ' +
                             data.traffic_count.toString() + " bicyclists";
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
    var rgb = hslToRgb(hue, 1, 0.45);
    var hex = '#' + RGBToHex(rgb[0], rgb[1], rgb[2]);
    return hex;
  });

  this.decodedSegment = ko.computed(function() {
    return google.maps.geometry.encoding.decodePath(data.polyline);
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
        strokeColor: 'gray'
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
    map.addListener("click", function() {
      thisSegment.segmentSelected(false);
    });
  });

  this.infoWindowCloseHandler = ko.computed(function() {
    google.maps.event.addListener(thisSegment.infoWindow, "closeclick", function() {
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
    redwoodCenter = {lat:37.810154, lng:-122.173620};
    var map = new google.maps.Map(document.getElementById('map'), {
      center: redwoodCenter,
      zoom: 15,
      mapTypeControl: false,
    });
  } catch (error) {
    alert("There was an error loading Google Maps. Try again later.");
  }
  
  google.maps.event.addDomListener(window, 'resize', function(){
    map.setCenter(redwoodCenter);
  });

  self.infoTooltip = "Trailways helps horseback riders and other " +
    "trailgoers avoid run-ins with bicycles.<br/><br/>The 'current' option shows trail " +
    "traffic in the last three hours, and the 'average weekday' option shows average " +
    "traffic for that particular weekday in the last three weeks.<br/><br/>Traffic data " +
    "is taken from the Strava API, and counts cyclists who are recording their ride " +
    "using Strava. For this reason, traffic values here may be lower than their true " +
    "value.";

  self.segmentList = ko.observableArray([]);
  self.searchInput = ko.observable();
  self.timePeriodList = ko.observableArray([]);
  

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

  self.selectedTimePeriod = ko.observable('current');

  self.selectedTimePeriodObj = ko.computed(function() {
    var tp = self.selectedTimePeriod();
    return ko.utils.arrayFilter(self.timePeriodList(), function(tpObj) {
      return tpObj.value() === tp;
    });
  });

  initialTimePeriodsResp.fail(function() {
    alert("Traffic data failed to load. Try again later.");
  });


  this.changeTimePeriod = function() {
    $('.time-period-li').css({'background-color': 'white'});
    var inputNode = $('input[value=' + self.selectedTimePeriod() + ']');
    var listItem = inputNode.parent();
    listItem.css({'background-color': 'rgba(211,77,204,0.2)'});
    self.segmentList().forEach(function(segment) {
      segment.setTrafficData(self.selectedTimePeriodObj()[0]);
    });
    setTimeout(function() {
       $('.mobile-slideout').removeClass('open');
    }, 100);
    return true;
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


$('.mobile-nav-button').click(function(e){
  e.preventDefault();
  $('.mobile-slideout').toggleClass('open');
});


function initializeMap() {
  ko.applyBindings(new ViewModel(map));
}
