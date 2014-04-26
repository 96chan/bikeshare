
var map ='';
var gmarkers = [];    
var sf_latlng = new google.maps.LatLng(37.78992,-122.3822776); // San Francisco
var sj_latlng = new google.maps.LatLng(37.339508, -121.872193);       // San Jose
var rc_latlng = new google.maps.LatLng(37.485217, -122.212308);       // Redwood City
var mv_latlng = new google.maps.LatLng(37.395499, -122.078598);       // Mountain View
var pa_latlng = new google.maps.LatLng(37.436707, -122.131716);       // Palo Alto
var infowindow = new google.maps.InfoWindow({
        maxWidth: 300,      //Doesn't work
});

// define dimensions of graph
var m = [35, 35, 35, 35]; // margins
var w = 320 - m[1] - m[3]; // width
var h = 200 - m[0] - m[2]; // height
var x, y, y1, y2;
var alldata;
var alldata_loaded = 0; // global indicator of when we're done loading all data

var graph1 = d3.select("#graph1").append("svg:svg")
      .attr("width", w + m[1] + m[3])
      .attr("height", h + m[0] + m[2])
      .append("svg:g")
      .attr("transform", "translate(" + m[3] + "," + m[0] + ")");
var graph2 = d3.select("#graph2").append("svg:svg")
      .attr("width", w + m[1] + m[3])
      .attr("height", h + m[0] + m[2])
      .append("svg:g")
      .attr("transform", "translate(" + m[3] + "," + m[0] + ")");


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
// Marker
function setMarkerMessage(marker) { 
  google.maps.event.addListener(marker, 'click', function() {
    var target = this;
    var json = $.parseJSON(JSON.stringify(eval("(" + target.getTitle() + ")")));

    // Marker content
    var content = "<div class='info-content'>"+json.station_name+"</div>";
    infowindow.setContent(content);
    infowindow.open(map, target);
    $('#station_list').val(json.station_name);
    google.maps.event.addListener(infowindow, 'closeclick', function () {
        infowindow.close();
    });

    // show graph for station
    // make sure it's done loading
    if(alldata_loaded) {
      drawGraph(graph1, json.station_id);
      drawSingleGraph(graph2, json.station_id);
    } else {
      alert("not loaded yet. try again laer");
    }
  });
}

var marker_image = new google.maps.MarkerImage("_img/icon.png",
        null, 
        // The origin for this image is 0,0.
        new google.maps.Point(0,0),
        // The anchor for this image is the base of the flagpole at 0,32.
        new google.maps.Point(15,0)
);

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
  var dataset = [];
  d3.json("_data/station_data.Json", function(data) { 
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

        function transform(d) {
          var m_title = '{"station_id":"'+d.value[0]+'","station_name":"'+d.value[1]+'"}';
          d = new google.maps.LatLng(d.value[2], d.value[3]);
          var gmarker = new google.maps.Marker({
              position: d,
              map: map,
              icon: marker_image,
              title: m_title
          });         
          gmarkers.push(gmarker);
          setMarkerMessage(gmarker);

          d = projection.fromLatLngToDivPixel(d);

          return d3.select(this)
              .style("left", (d.x - padding) + "px")
              .style("top", (d.y - padding) + "px");
        }
      };
    };
    // Bind our overlay to the map…
    overlay.setMap(map);

    // load all of our timed station metrics 
    $.getJSON('_data/array_scores.json',function(d) {
      alldata = d;
      alldata_loaded = 1;
    });


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
// graphs
//---------------------------------

// also requires global vars data, x, y1, y2
function drawGraph(graph, stationid) {
  var stationindex;

  // get array index for station
  for(var i = 0 ; i < alldata[0].stations.length ; ++i) {
    if(alldata[0].stations[i].station_id == stationid) {
      stationindex = i;
    }
  }

  // get max outflow and empty, for scale
  var maxoutflow = 0;
  var maxempty = 0;
  for(var i = 0 ; i < alldata.length; ++i) {
    if(alldata[i].stations[stationindex].tot_outflow > maxoutflow)
      maxoutflow = alldata[i].stations[stationindex].tot_outflow;
    if(alldata[i].stations[stationindex].tot_empty_duration > maxempty)
      maxempty = alldata[i].stations[stationindex].tot_empty_duration;
  }

  x = d3.scale.linear().domain([0, alldata.length]).range([0, w]);
  y1 = d3.scale.linear().domain([0, maxoutflow]).range([h, 0]);
  y2 = d3.scale.linear().domain([0, 50]).range([h, 0]);

  // create a line function that can convert data[] into x and y points
  var line = d3.svg.line()
    .x(function(d,i) { 
      return x(i); 
    })
    .y(function(d) { 
      return y1(d.stations[stationindex].tot_outflow); 
    })

  var emptyline = d3.svg.line()
    .x(function(d,i) { 
      return x(i); 
    })
    .y(function(d) {
      // percent empty. total empty duration / 900 seconds * 100
      return y2(d.stations[stationindex].tot_empty_duration / 9); 
    })

  // axes
  var xAxis = d3.svg.axis().scale(x).ticks(0).tickSize(0,0);
  graph.append("svg:g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + h + ")")
        .call(xAxis);


  var yAxisLeft = d3.svg.axis().scale(y1).ticks(3).tickSize(0,0).orient("left");
  var yAxisRight = d3.svg.axis().scale(y2).ticks(2).tickSize(0,0).orient("right");

  if(graph.select("path.outflow").empty()) {
    graph.append("svg:g")
          .attr("class", "y y1 axis")
          .attr("transform", "translate(0,0)")
          .call(yAxisLeft);
    graph.append("svg:g")
          .attr("class", "y y2 axis")
          .attr("transform", "translate(" + w + ",0)")
          .call(yAxisRight);

    var linepath = graph.append("svg:path").attr("d", line(alldata)).attr("class", "outflow");
    var emptypath = graph.append("svg:path").attr("d", emptyline(alldata)).attr("class", "empty");

    // labels
    graph.append('rect')
      .attr('x', w-78)
      .attr('y', 5)
      .attr('width', 68)
      .attr('height', 35)
      .attr('class', 'labelbox');

    // graph.append('svg:line')
    //   .attr('x1', w-70)
    //   .attr('y1', 15)
    //   .attr('x2', w-55)
    //   .attr('y2', 15)
    //   .attr('class', 'outflow');
    // graph.append('svg:line')
    //   .attr('x1', w-70)
    //   .attr('y1', 30)
    //   .attr('x2', w-55)
    //   .attr('y2', 30)
    //   .attr('class', 'empty');

    graph.append('svg:text')
      .attr('x', 0)
      .attr('y', -24)
      .attr('alignment-baseline', 'start')
      .attr('text-anchor', 'end')
      .text('outgoing traffic (# bikes)')
      .attr('class', 'outflowtext')
      .attr('transform', 'rotate(-90)');
    graph.append('svg:text')
      .attr('x', 0)
      .attr('y', w+23)
      .attr('alignment-baseline', 'middle')
      .attr('text-anchor', 'end')
      .text('% chance empty')
      .attr('class', 'emptytext')
      .attr('transform', 'rotate(-90)');

    // graph.append("text")
    //   .attr("class", "axislabel outflowtext")
    //   .attr("text-anchor", "end")
    //   .attr("x", 3)
    //   .attr("y", 10)
    //   .attr("dy", ".75em")
    //   .attr("transform", "rotate(-90)")
    //   .text("avg # outgoing bikes");

    // graph.append("text")
    //   .attr("class", "axislabel emptytext")
    //   .attr("text-anchor", "end")
    //   // .attr("x"
    //   .attr("y", 10)
    //   .attr("dy", ".75em")
    //   .attr("transform", "rotate(-90)")
    //   .text("chance station is empty");

    graph.append("text")
      .attr("class", "axislabel timetext")
      .attr("text-anchor", "start")
      .attr("x", 0)
      .attr("y", h+13)
      .text("12am");
    graph.append("text")
      .attr("class", "axislabel timetext")
      .attr("text-anchor", "middle")
      .attr("x", (w/3))
      .attr("y", h+13)
      .text("8am");
    graph.append("text")
      .attr("class", "axislabel timetext")
      .attr("text-anchor", "middle")
      .attr("x", (w/24)*17)
      .attr("y", h+13)
      .text("5pm");
    graph.append("text")
      .attr("class", "axislabel timetext")
      .attr("text-anchor", "end")
      .attr("x", w)
      .attr("y", h+13)
      .text("12am");


  } else {
    var linepath = graph.select("path.outflow").transition().attr("d", line(alldata));
    var emptypath = graph.select("path.empty").transition().attr("d", emptyline(alldata));

    graph.select(".y1").transition().call(yAxisLeft);
    graph.select(".y2").transition().call(yAxisRight);
  }
}

// draw single graph for score
function drawSingleGraph(graph, stationid) {
  var stationindex;

  // get array index for station
  for(var i = 0 ; i < alldata[0].stations.length ; ++i) {
    if(alldata[0].stations[i].station_id == stationid) {
      // found it
      stationindex = i;
    }
  }

  // get max score
  var maxscore = 0;
  for(var i = 0 ; i < alldata.length; ++i) {
    if(alldata[i].stations[stationindex].score > maxscore)
      maxscore = alldata[i].stations[stationindex].score;
  }

  x = d3.scale.linear().domain([0, alldata.length]).range([0, w]);
  y = d3.scale.linear().domain([0, 0.5]).range([h, 0]);

  // create a line function that can convert data[] into x and y points
  var line = d3.svg.line()
    .x(function(d,i) { 
      return x(i);
    })
    .y(function(d) { 
      return y(d.stations[stationindex].score); 
    })

  var xAxis = d3.svg.axis().scale(x).ticks(0).tickSize(0,0);
  var yAxisLeft = d3.svg.axis().scale(y).ticks(0).tickSize(0,0).orient("left");

  if(graph.select("path.score").empty()) {
    graph.append("svg:g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + h + ")")
          .call(xAxis);

    graph.append("svg:g")
          .attr("class", "y y3 axis")
          .attr("transform", "translate(0,0)")
          .call(yAxisLeft);

    var linepath = graph.append("svg:path").attr("d", line(alldata)).attr("class", "score");

    // labels
    graph.append('rect')
      .attr('x', w-78)
      .attr('y', 5)
      .attr('width', 68)
      .attr('height', 35)
      .attr('class', 'labelbox');

    // graph.append('svg:line')
    //   .attr('x1', w-70)
    //   .attr('y1', 15)
    //   .attr('x2', w-55)
    //   .attr('y2', 15)
    //   .attr('class', 'score');


    graph.append('svg:text')
      .attr('x', -0)
      .attr('y', -10)
      .attr('alignment-baseline', 'start')
      .attr('text-anchor', 'end')
      .text('frustration score')
      .attr('class', 'scoretext')
      .attr('transform', 'rotate(-90)');

    graph.append("text")
      .attr("class", "axislabel timetext")
      .attr("text-anchor", "start")
      .attr("x", 0)
      .attr("y", h+13)
      .text("12am");
    graph.append("text")
      .attr("class", "axislabel timetext")
      .attr("text-anchor", "middle")
      .attr("x", (w/3))
      .attr("y", h+13)
      .text("8am");
    graph.append("text")
      .attr("class", "axislabel timetext")
      .attr("text-anchor", "middle")
      .attr("x", (w/24)*17)
      .attr("y", h+13)
      .text("5pm");
    graph.append("text")
      .attr("class", "axislabel timetext")
      .attr("text-anchor", "end")
      .attr("x", w)
      .attr("y", h+13)
      .text("12am");


  } else {
    var linepath = graph.select("path.score").transition().attr("d", line(alldata));
    graph.select(".y3").transition().call(yAxisLeft);
  }
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
