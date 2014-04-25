
var map ='';
var sf_latlng = new google.maps.LatLng(37.78992,-122.3822776); // San Francisco
var sj_latlng = new google.maps.LatLng(37.339508, -121.872193);       // San Jose
var rc_latlng = new google.maps.LatLng(37.485217, -122.212308);       // Redwood City
var mv_latlng = new google.maps.LatLng(37.395499, -122.078598);       // Mountain View
var pa_latlng = new google.maps.LatLng(37.436707, -122.131716);       // Palo Alto

$(document).ready(function() {
  initialize();
  initial_station_list();
});
//---------------------------------
// slider
//---------------------------------
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
  if($("#controlimg").attr('src') == '_img/pause.png') {
    $('#controlimg').attr('src', '_img/play.png');
    clearTimeout(timer);
  } else {
    $('#controlimg').attr('src', '_img/pause.png');
    timer = setInterval(increment, 1000);
  }
});

//---------------------------------
// map
//---------------------------------
function initialize(){
  // Map Style
  var styleArray =[{"featureType":"landscape","stylers":[{"saturation":-100},{"lightness":65},{"visibility":"on"}]},{"featureType":"poi","stylers":[{"saturation":-100},{"lightness":51},{"visibility":"simplified"}]},{"featureType":"road.highway","stylers":[{"saturation":-100},{"visibility":"simplified"}]},{"featureType":"road.arterial","stylers":[{"saturation":-100},{"lightness":30},{"visibility":"on"}]},{"featureType":"road.local","stylers":[{"saturation":-100},{"lightness":40},{"visibility":"on"}]},{"featureType":"transit","stylers":[{"saturation":-100},{"visibility":"simplified"}]},{"featureType":"administrative.province","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"labels","stylers":[{"visibility":"on"},{"lightness":-25},{"saturation":-100}]},{"featureType":"water","elementType":"geometry","stylers":[{"hue":"#ffff00"},{"lightness":-25},{"saturation":-97}]},{"elementType": "labels.icon", "stylers":[{"visibility":"off"}]}];

  var styledMap = new google.maps.StyledMapType(styleArray,{name: "Styled Map"});

  var mapOptions = {
    zoom: 14,
    center: sf_latlng,
    mapTypeControlOptions: {
      mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'map_style']
    }
  };
  map = new google.maps.Map(document.getElementById('map'),
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
//MouseTarget
// // set this as locally scoped var so event does not get confused
// var me = this;

// // Add a listener - we'll accept clicks anywhere on this div, but you may want
// // to validate the click i.e. verify it occurred in some portion of your overlay.
// google.maps.event.addDomListener('.stations', 'click', function() {
//     google.maps.event.trigger(me);
// });

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
}

//---------------------------------
// city tab
//---------------------------------
// initial
function initial_station_list(){
    $.getJSON( "./_data/station_data.json", function( data ) {
    var items = ["<option value='none'>CHOOSE A STATION</option>"];
    $.each( data, function( key, val ) {
      if (val.region == 'San Francisco'){
        items.push( "<option id='" +'station'+ val.station_id + "'>" + val.station_name + "</option>" );
      }
    });
    $('#station_list').html(items);
  });
}

// tab
$('#region li').click(function(){
  $el = $(this);
  $el.parent().find('li').removeClass('active');
  $el.addClass('active');
  var flag = $el.text();

  if($el.text() == 'San Francisco'){
    map.setCenter(sf_latlng);
  }else if($el.text() == 'San Jose'){
    map.setCenter(sj_latlng);

  }else if($el.text() == 'Redwood City'){
    map.setCenter(rc_latlng);    
  }else if($el.text() == 'Mountain View'){
    map.setCenter(mv_latlng);    
  }else if($el.text() == 'Palo Alto'){
    map.setCenter(pa_latlng);    
  }

  $.getJSON( "./_data/station_data.json", function( data ) {
    var items = ["<option value='none'>CHOOSE A STATION</option>"];
    $.each( data, function( key, val ) {
      if (val.region == flag){
        items.push( "<option id='" +'station'+ val.station_id + "'>" + val.station_name + "</option>" );
      }
    });
 
    $('#station_list').html(items);
  });


});
