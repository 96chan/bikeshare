
var map ='';
var gmarkers = [];    
var trafficlines = [];    // bike traffic line
var station_dataset = []; // station information
var arclocs =[]; // trafficline 
var sf_latlng = new google.maps.LatLng(37.78992,-122.3822776); // San Francisco
var sj_latlng = new google.maps.LatLng(37.339508, -121.872193);       // San Jose
var rc_latlng = new google.maps.LatLng(37.485217, -122.212308);       // Redwood City
var mv_latlng = new google.maps.LatLng(37.395499, -122.078598);       // Mountain View
var pa_latlng = new google.maps.LatLng(37.436707, -122.131716);       // Palo Alto
var infowindow = new google.maps.InfoWindow({maxWidth: 300 });
var out_in_switch = 0; // 0: outflow, 1: inflow


// define dimensions of graph
var m = [35, 35, 35, 35]; // margins
var w = 350 - m[1] - m[3]; // width
var h = 200 - m[0] - m[2]; // height
var tw = w - 75; //timeline width is shorter to allow for checkbox
var x, y, y1, y2;
var alldata;
var alldata_loaded = 0; // global indicator of when we're done loading all data
var clicked_but_not_loaded = 0; // they selected a station but we're not loaded yet

var tsvg = d3.select("#timeline").append("svg:svg")
      .attr("width", tw + m[1] + m[3])
      .attr("height", 50)
      .append("svg:g")
      .attr("transform", "translate(" + m[3] + ",0)");

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
  toggles.init();
});
//---------------------------------
// slider
//---------------------------------
// $( "#slider" ).slider({
//   min: 0,
//   max: 10,
//   step: 1,
//   value: 0,
//   slide: function( event, ui ) {
//     $('#sliderVal').text(ui.value);
//   }
// });

// $('#sliderVal').text(0);

// var timer = setInterval(increment, 1000);

// function increment() {
//   var value = $('#slider').slider('value');
//   var newval = value+1;
//     $('#slider').slider("value", newval);
//   $('#sliderVal').text(newval);
//   if(newval == 10) {
//     clearTimeout(timer);
//   }
// }

// $('#control').click(function() {
//   if($("#controlimg").attr('src') == '_img/pause.png') {
//     $('#controlimg').attr('src', '_img/play.png');
//     clearTimeout(timer);
//   } else {
//     $('#controlimg').attr('src', '_img/pause.png');
//     timer = setInterval(increment, 1000);
//   }
// });

//---------------------------------
// map
//---------------------------------
// When Marker cliked
function setMarkerMessage(marker) { 
  google.maps.event.addListener(marker, 'click', function() {
    var target = this;
    var json = $.parseJSON(JSON.stringify(eval("(" + target.getTitle() + ")")));
    var sid = json.station_id;
    // Marker content
    var content = "<div class='info-content'>"+json.station_name+"</div>";
    infowindow.setContent(content);
    infowindow.open(map, target);
    $('#station_list').val(json.station_name);
    
    // Reset polylines in google map
    for(var i=0;i<trafficlines.length;i++){
      trafficlines[i].setMap(null);
    }

    // Draw polylines
    $.getJSON('_data/station_aggregate.json',function(data){
      var flow_stations, flow_color;
      for(var i=0;i<data.length;i++){
        if(sid == data[i].station_id){
          if(out_in_switch == 0){
            flow_stations = data[i].outflow_stations;
            flow_color = '#FF0A0A';
          }else{
            flow_stations = data[i].inflow_stations;
            flow_color = '#2ecc71';
          }
          var sid_long, sid_lat, total_cnt;

          for(var k=0;k<station_dataset.length;k++){
            if(sid == station_dataset[k][0]){
                 sid_lat = station_dataset[k][2];
                 sid_long = station_dataset[k][3];
            }
          }
          for(var k=0;k<station_dataset.length;k++){
            total_cnt = 0;
            for(var j=0;j<flow_stations.length;j++){           
              total_cnt += flow_stations[j].count;
              if(flow_stations[j].station_id == station_dataset[k][0]){
                 var traffic = [
                      new google.maps.LatLng(sid_lat,sid_long),
                      new google.maps.LatLng(station_dataset[k][2],station_dataset[k][3])
                 ];
                 var trafficline = new google.maps.Polyline({
                      path: traffic,
                      geodesic: true,
                      strokeColor: flow_color,
                      strokeOpacity: 0.6,
                      strokeWeight: 30*flow_stations[j].count/total_cnt
                 });                                
                 trafficlines.push(trafficline);
                 trafficline.setMap(map);                    
              }
            }
          }
        }
      }
    });
    // show graph for station
    // make sure it's done loading
    if(alldata_loaded) {
      drawGraph(graph1, json.station_id);
      $('.outgoingsubtitle').removeClass('hidden');
      $('.explain').fadeOut(250, function() {
        $(this).remove();
      });
      $('#info').removeClass('hidden');
      // info ??? tooltip
      $('#info').hover(function(){
        // Hover over code
        var title = $(this).attr('title');
        $(this).data('tipText', title).removeAttr('title');
        $('<p class="tooltip"></p>')
        .text(title)
        .appendTo('body')
        .fadeIn('slow');
      }, function() {
        // Hover out code
        $(this).attr('title', $(this).data('tipText'));
        $('.tooltip').remove();
      }).mousemove(function(e) {
        var mousex = e.pageX + 20; //Get X coordinates
        var mousey = e.pageY + 10; //Get Y coordinates
        $('.tooltip')
        .css({ top: mousey, left: mousex })
      });


      drawSingleGraph(graph2, json.station_id);
    } else {
      // show loading image
      $('#loadingimage').removeClass('hidden');
      clicked_but_not_loaded = 1;
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
  d3.json("_data/station_data_switchedranks.json", function(data) { 
    station_dataset = data.map(function(d) { return [ d["station_id"], d["station_name"], +d["lat"], +d["long"], d["rank"] ]; }); 

    var overlay = new google.maps.OverlayView();
    overlay.onAdd = function() {

      var layer = d3.select(this.getPanes().overlayLayer).append("div")
          .attr("class", "stations");
      var svg = layer.append("svg");

      // Draw each marker as a separate SVG element.
      // We could use a single SVG, but what size would it have?
      overlay.draw = function() {
          // delete previous drawing
          svg.selectAll('.arc').remove();
          $('.marker').remove();

          var markerOverlay = this;
          var overlayProjection = markerOverlay.getProjection();
          var googleMapProjection = function (coordinates) {
              var googleCoordinates = new google.maps.LatLng(coordinates[1], coordinates[0]);
              var pixelCoordinates = overlayProjection.fromLatLngToDivPixel(googleCoordinates);
              return [pixelCoordinates.x + 4000, pixelCoordinates.y + 4000];
          }
          path = d3.geo.path().projection(googleMapProjection);
    
          arclocs =[];

          // Traffic line
          d3.json("_data/all_trips.json", function(error, data){
              for (var i=0;i<station_dataset.length;i++){
                for (var j=i+1;j<station_dataset.length;j++){
                  // dataset[i][0] = station_id
                  // dataset[i][2] = lat
                  // dataset[i][2] = long
                  if(i<station_dataset.length-1){
                    var start = [station_dataset[i][3],station_dataset[i][2]];
                    var end = [station_dataset[j][3],station_dataset[j][2]];
                    var startcoords = googleMapProjection(start);
                    var endcoords = googleMapProjection(end);
                    var startx = startcoords[0];
                    var starty = startcoords[1];
                    var homex = endcoords[0];
                    var homey = endcoords[1];
                    arclocs.push([station_dataset[i][3],station_dataset[i][2],station_dataset[j][3],station_dataset[j][2],data[i][j]]); 
                  }
                } 
              }
              svg.selectAll('.arc')
              .data(arclocs)
              .enter()
              .append('path')
              .attr('d', function(d) {
                var startcoords = googleMapProjection([d[0], d[1]]);
                var endcoords = googleMapProjection([d[2], d[3]]);
                var startx = startcoords[0],
                  starty = startcoords[1],
                  homex = endcoords[0],
                  homey = endcoords[1];
                return "M" + startx + "," + starty + " Q" + (startx + homex)/2 + " " + 0.99*(starty + homey)/2 +" " + homex+" "   + homey;
              })
              .attr("stroke-width", function(d){
                 return d[4]/200
              })
              .attr('stroke', '#FF0A0A')
              .attr("fill", "none")
              .attr("opacity", 0.5)
              .attr("stroke-linecap", "round")
              .attr('class', 'arc');
            });


          var projection = this.getProjection(),
                  padding = 10;

          var marker = layer.selectAll("marker")
                  .data(d3.entries(station_dataset))
                  .each(transform) // update existing markers
                  .enter().append("svg:svg")
                  .each(transform)
                  .attr("class", "marker");
          
          // Add a circle.
          marker.append("svg:circle")
              .attr("r", 4.5)
              .attr("cx", padding)
              .attr("cy", padding)
              .attr("fill",function(d){
                if(d.value[4]==5){
                  return "#BD1A00";
                }
                else if(d.value[4]==4){
                  return "#DE4B53";
                }
                else if(d.value[4]==3){
                  return "#DDDAC1";
                }
                else if(d.value[4]==2){
                  return "#72B582";
                }
                else if(d.value[4]==1){
                  return "#438875";
                }
                else{
                  return "black";
                }
              })
              .attr("class", "rank1");

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
            setMarkerMessage(gmarkers);

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
    $.getJSON('_data/array_scores_minify.json',function(d) {
      alldata = d;
      alldata_loaded = 1;
      if(clicked_but_not_loaded == 1) {
        // this means we've finally loaded all the data... but someone's already clicked on the station!
        // show subtitle
        $('.outgoingsubtitle').removeClass('hidden');

        // remove loading image, explain
        $('.explain').remove();
        $('#info').removeClass('hidden');
        $('#loadingimage').remove();

        // get selected station id
        var selected_stationid = $('#station_list :selected').attr('id').substring(7);

        drawGraph(graph1, selected_stationid);
        drawSingleGraph(graph2, selected_stationid);
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
  for(var i = 0 ; i < alldata[0].s.length ; ++i) {
    if(alldata[0].s[i].SID == stationid) {
      stationindex = i;
    }
  }

  // get max outflow and empty, for scale
  var maxoutflow = 0;
  var maxempty = 0;
  for(var i = 0 ; i < alldata.length; ++i) {
    if(alldata[i].s[stationindex].TO > maxoutflow)
      maxoutflow = alldata[i].s[stationindex].TO;
    if(alldata[i].s[stationindex].TED > maxempty)
      maxempty = alldata[i].s[stationindex].TED;
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
      return y1(d.s[stationindex].TO); 
    })

  var emptyline = d3.svg.line()
    .x(function(d,i) { 
      return x(i); 
    })
    .y(function(d) {
      // percent empty. total empty duration / 900 seconds * 100
      return y2(d.s[stationindex].TED / 9); 
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
  for(var i = 0 ; i < alldata[0].s.length ; ++i) {
    if(alldata[0].s[i].SID == stationid) {
      // found it
      stationindex = i;
    }
  }

  // get max score
  var maxscore = 0;
  for(var i = 0 ; i < alldata.length; ++i) {
    if(alldata[i].s[stationindex].S > maxscore)
      maxscore = alldata[i].s[stationindex].S;
  }
  var maxdomain = Math.round((maxscore/0.6977672)*100);

  x = d3.scale.linear().domain([0, alldata.length]).range([0, w]);
  y = d3.scale.linear().domain([0, maxdomain]).range([h, 0]);

  // create a line function that can convert data[] into x and y points
  var line = d3.svg.line()
    .x(function(d,i) { 
      return x(i);
    })
    .y(function(d) { 
      // scale is a % of the max 0.6977672 (caltrain at townsend and 4th)
      return y((d.s[stationindex].S / .6977672)*100); 
    })

  var xAxis = d3.svg.axis().scale(x).ticks(0).tickSize(0,0);
  var yAxisLeft = d3.svg.axis().scale(y).ticks(0).tickSize(0,0).tickValues(y.domain()).orient("left");

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

    graph.append('svg:text')
      .attr('x', -0)
      .attr('y', -24)
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
    var maxdomain = Math.round((maxscore/0.6977672)*100);

    y = d3.scale.linear().domain([0, maxdomain]).range([h, 0]);

    yAxisLeft = d3.svg.axis().scale(y).ticks(0).tickSize(0,0).tickValues(y.domain()).orient("left");

    graph.select(".y3").transition().call(yAxisLeft);

  }
}



//---------------------------------
// timeline
//---------------------------------
function activateTimeline() {
  tsvg.selectAll('line').attr('class', 'timelineactive');
  tsvg.select('circle').attr('class', 'timecirclefill');
  tsvg.selectAll('text').attr('class', 'timelinetextactive');
  $('#allday input').prop('checked', false);
}
function deactivateTimeline() {
  tsvg.selectAll('line').attr('class', 'timeline');
  tsvg.select('circle').attr('class', 'timecircle');
  tsvg.selectAll('text').attr('class', 'timelinetext');
  $('#allday input').prop('checked', true);
}
tsvg.append('line')
  .attr('x1', 0)
  .attr('x2', tw)
  .attr('y1', 10)
  .attr('y2', 10)
  .attr('class', 'timeline');
tsvg.append('line')
  .attr('x1', 0)
  .attr('x2', 0)
  .attr('y1', 0)
  .attr('y2', 20)
  .attr('class', 'timeline');
tsvg.append('line')
  .attr('x1', tw)
  .attr('x2', tw)
  .attr('y1', 0)
  .attr('y2', 20)
  .attr('class', 'timeline');

tsvg.append("text")
  .attr("class", "axislabel timelinetext")
  .attr("text-anchor", "middle")
  .attr("x", 0)
  .attr("y", 32)
  .text("12am");
tsvg.append("text")
  .attr("class", "axislabel timelinetext")
  .attr("text-anchor", "middle")
  .attr("x", (tw/3))
  .attr("y", 32)
  .text("8am");
tsvg.append("text")
  .attr("class", "axislabel timelinetext")
  .attr("text-anchor", "middle")
  .attr("x", (tw/24)*17)
  .attr("y", 32)
  .text("5pm");
tsvg.append("text")
  .attr("class", "axislabel timelinetext")
  .attr("text-anchor", "middle")
  .attr("x", tw)
  .attr("y", 32)
  .text("12am");

// add cross hairs and floating value on axis
var focus = graph1.append("g")
  .attr("class","focus")
  .style("display", "none");
focus.append("line")
  .attr({
    "x1": 0,
    "y1": 20,
    "x2": 0,
    "y2": h,
    'stroke-width': '1px',
    'stroke': 'red'
  });
var timetext = focus.append('text')
  .attr('class', 'axislabel timetext')
  .attr('text-anchor', 'middle')
  .attr('x', 0)
  .attr('y', 10)
  .attr('class', 'timetext')
  .text('0');

// same for graph2
// add cross hairs and floating value on axis
var focus2 = graph2.append("g")
  .attr("class","focus")
  .style("display", "none");
focus2.append("line")
  .attr({
    "x1": 0,
    "y1": 20,
    "x2": 0,
    "y2": h,
    'stroke-width': '1px',
    'stroke': 'red'
  });
var timetext2 = focus2.append('text')
  .attr('class', 'axislabel timetext')
  .attr('text-anchor', 'middle')
  .attr('x', 0)
  .attr('y', 10)
  .attr('class', 'timetext')
  .text('0');

// attach mouse handlers for each svg obj
tsvg.append("rect")
  .attr({"opacity": 0, "width": tw , "height": 50})
  .on({
    "mouseover": function() {
      focus.style("display", null);
      focus2.style("display", null);
    },
    "mouseout":  function() {
      focus.style("display", "none");
      focus2.style("display", "none");
    },
    "click": function() {
      var x = d3.mouse(this)[0];
      var position;
      if(x < 0)
        position=0;
      else if(x>tw)
        position=tw;
      else
        position=x;

      tsvg.select('circle').attr('cx',position);

      activateTimeline();
    },
    "mousemove": mousemove
  });

graph1.append("rect")
  .attr({"opacity": 0, "width": w , "height": h})
  .on({
    "mouseover": function() {
      focus.style("display", null);
      focus2.style("display", null);
    },
    "mouseout":  function() {
      focus.style("display", "none");
      focus2.style("display", "none");
    }, 
    "mousemove": mousemove
  });
graph2.append("rect")
  .attr({"opacity": 0, "width": w , "height": h})
  .on({
    "mouseover": function() {
      focus.style("display", null);
      focus2.style("display", null);
    },
    "mouseout":  function() {
      focus.style("display", "none");
      focus2.style("display", "none");
    }, 
    "mousemove": mousemove
  });

function mousemove() {
  // move it only by 15minute increments. 96 time incremenets (24 hours / 15 min)
  var percent = (d3.mouse(this)[0]) / w;
  var sizeOfInterval = w / 96.0; // size of each 15 minutes
  var x = Math.round(percent*96) * sizeOfInterval; // the closest 15 minute interval in pixels
  focus.attr("transform", "translate(" + x + ",0)");
  focus2.attr("transform", "translate(" + x + ",0)");

  var dt = new Date(2014,0,0);
  dt = new Date(dt.getTime() + 15*Math.round(percent*96)*60000);
  var timestr = (dt.getMinutes() == 0) ? (dt.getHours() + ':0' + dt.getMinutes()) : (dt.getHours() + ':' + dt.getMinutes());
  timetext.text(timestr);
  timetext2.text(timestr);
}


var drag = d3.behavior.drag()
    .on("drag", dragmove);
tsvg.append('circle')
  .attr('r', 6)
  .attr('cx', 30)
  .attr('cy', 10)
  .attr('class', 'timecircle')
  .style("cursor", "pointer")
  .on({
    "mouseover": function() {
      focus.style("display", null);
      focus2.style("display", null);
    },
    "mouseout": function() {
      focus.style("display", "none");
      focus2.style("display", "none");
    },
    "click": function() {
      activateTimeline();
    },
    "mousemove": mousemove
  })
  .call(drag);

function dragmove(d) {
  var x = d3.event.x;
  d3.select(this)
    .attr('cx', function() {
      if(x<0)
        return 0;
      else if(x>tw)
        return tw;
      else
        return x;
  });
  
  activateTimeline();
}

$('#allday input:checkbox').click(function() {
  if($(this).is(':checked')) {
    // all day is checked, disable the timeline
    deactivateTimeline();
  } else {
    // unchecked. enable timelime
    activateTimeline();
  }
});


//---------------------------------
// city tab
//---------------------------------
// initial
function initial_station_list(){
  $.getJSON( "./_data/station_data.json", function( data ) {
    var items = ["<option value='none'>CHOOSE A STATION</option>"];
    data.sort(function(a,b) {return a.station_name.toLowerCase() > b.station_name.toLowerCase() ? 1 : -1;});
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
    data.sort(function(a,b) {return a.station_name.toLowerCase() > b.station_name.toLowerCase() ? 1 : -1;});
    $.each( data, function( key, val ) {
      if (val.region == flag){
        items.push( "<option id='" +'station'+ val.station_id + "'>" + val.station_name + "</option>" );
      }
    });
 
    $('#station_list').html(items);
  });
});

// list changing invokes marker in google map
$('#station_list').change(function(){
  for(var i=0;i<gmarkers.length;i++){
      var json = $.parseJSON(JSON.stringify(eval("(" + gmarkers[i].getTitle() + ")")));
      if(this.value == json.station_name){
        new google.maps.event.trigger( gmarkers[i], 'click');
      }
  }
});

var toggles = {
    init : function() {
    $("#legend h2 a").on("click", function() {
      $(this).toggleClass("closed");
      $("#legend-detail").slideToggle(300);
      return false;
    });
    }
}

