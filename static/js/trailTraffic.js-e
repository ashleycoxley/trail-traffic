function initializeMap() {
	// Google map initialization, to be called in $(document).ready()
	map = new google.maps.Map(document.getElementById('map'), {
			center: {lat: 37.810690, lng: -122.170217},
			zoom: 15
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
    var map = initializeMap;

    this.segmentList = ko.observableArray([]);
    $.get('/segments/redwood', function(data) {
			var redwoodSegments = data.segments;
			redwoodSegments.forEach(function(segment) {
        self.segmentList.push(new Segment(segment));
			});
		});
    
	};

	ko.applyBindings(new ViewModel());

});
