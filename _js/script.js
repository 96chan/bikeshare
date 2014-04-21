$(document).ready(function() {

// slider
$( "#slider" ).slider({
min: 0,
max: 10,
step: 1,
value: 0,
slide: function( event, ui ) {
  $('#sliderVal').text(ui.value);
}
});

$('#sliderVal').text(0);

var timer = setInterval(increment, 1000);

function increment() {
  var value = $('#slider').slider('value');
  var newval = value+1;
    $('#slider').slider("value", newval);
  $('#sliderVal').text(newval);
  if(newval == 10) {
    clearTimeout(timer);
  }
}

$('#control').click(function() {
  if($(this).attr('class') == 'pause') {
    $(this).attr('class', 'play');
    clearTimeout(timer);
  } else {
    $(this).attr('class', 'pause');
    timer = setInterval(increment, 1000);
  }
});

// Map Style
var styleArray =[{"featureType":"landscape","stylers":[{"saturation":-100},{"lightness":65},{"visibility":"on"}]},{"featureType":"poi","stylers":[{"saturation":-100},{"lightness":51},{"visibility":"simplified"}]},{"featureType":"road.highway","stylers":[{"saturation":-100},{"visibility":"simplified"}]},{"featureType":"road.arterial","stylers":[{"saturation":-100},{"lightness":30},{"visibility":"on"}]},{"featureType":"road.local","stylers":[{"saturation":-100},{"lightness":40},{"visibility":"on"}]},{"featureType":"transit","stylers":[{"saturation":-100},{"visibility":"simplified"}]},{"featureType":"administrative.province","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"labels","stylers":[{"visibility":"on"},{"lightness":-25},{"saturation":-100}]},{"featureType":"water","elementType":"geometry","stylers":[{"hue":"#ffff00"},{"lightness":-25},{"saturation":-97}]},{"elementType": "labels.icon", "stylers":[{"visibility":"off"}]}];

var styledMap = new google.maps.StyledMapType(styleArray,{name: "Styled Map"});

var mapOptions = {
  zoom: 14,
  center: new google.maps.LatLng(37.78992,-122.3822776),
  mapTypeControlOptions: {
    mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'map_style']
  }
};
var map = new google.maps.Map(document.getElementById('map'),
    mapOptions);
map.mapTypes.set('map_style', styledMap);
map.setMapTypeId('map_style');

// Load the station data. When the data comes back, create an overlay.
var dataset = []
d3.csv("_data/station_data.csv", function(data) { 
  dataset = data.map(function(d) { return [ d["station_id"], d["station_name"], +d["lat"], +d["long"] ]; }); 

  var overlay = new google.maps.OverlayView();
  // Add the container when the overlay is added to the map.
  overlay.onAdd = function() {
    var layer = d3.select(this.getPanes().overlayLayer).append("div")
        .attr("class", "stations");

    // Draw each marker as a separate SVG element.
    // We could use a single SVG, but what size would it have?
    overlay.draw = function() {
      var projection = this.getProjection(),
          padding = 10;

      var marker = layer.selectAll("svg")
          .data(d3.entries(dataset))
          .each(transform) // update existing markers
        .enter().append("svg:svg")
          .each(transform)
          .attr("class", "marker");

      // Add a circle.
      marker.append("svg:circle")
          .attr("r", 4.5)
          .attr("cx", padding)
          .attr("cy", padding);

      // // Add a label.
      // marker.append("svg:text")
      //     .attr("x", padding + 7)
      //     .attr("y", padding)
      //     .attr("dy", ".31em")
      //     .text(function(d) { return d.value[0]; });

      function transform(d) {
        d = new google.maps.LatLng(d.value[2], d.value[3]);
        d = projection.fromLatLngToDivPixel(d);
        return d3.select(this)
            .style("left", (d.x - padding) + "px")
            .style("top", (d.y - padding) + "px");
      }
    };
  };
  // Bind our overlay to the map…
  overlay.setMap(map);

  // Traffic line
  d3.json("_data/all_trips.json", function(error, data){
      for (var i=0;i<dataset.length+1;i++){
        for (var j=i+1;j<dataset.length;j++){
          // dataset[i][0] = station_id
          // dataset[i][2] = lat
          // dataset[i][2] = long
           var traffic = [
                new google.maps.LatLng(dataset[i][2],dataset[i][3]),
                new google.maps.LatLng(dataset[j][2],dataset[j][3])
           ];
           var trafficline = new google.maps.Polyline({
                path: traffic,
                geodesic: true,
                strokeColor: '#FF0A0A',
                strokeOpacity: 0.6,
                //data[i][j] = # of traffic from i station to j station
                strokeWeight: data[i][j]/200
           });
           trafficline.setMap(map);   
        } 
      }
  });
});

});