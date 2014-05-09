
var map ='';
var gmarkers = [];    
var markerOverlay;
var station_dataset = []; // station information
var arclocs =[]; // trafficline 
var pre_sid; // previous station id 
var line_width; // trafficline
var sf_latlng = new google.maps.LatLng(37.78992,-122.3822776); // San Francisco
var sj_latlng = new google.maps.LatLng(37.339508, -121.872193);       // San Jose
var rc_latlng = new google.maps.LatLng(37.485217, -122.212308);       // Redwood City
var mv_latlng = new google.maps.LatLng(37.395499, -122.078598);       // Mountain View
var pa_latlng = new google.maps.LatLng(37.436707, -122.131716);       // Palo Alto
var infowindow = new google.maps.InfoWindow({maxWidth: 300 });
var selectedTime,selectedTimeIndex;
var selected_sid;

var maxOutflowTimed = 0;

// define dimensions of graph
var m = [35, 35, 35, 35]; // margins
var w = 350 - m[1] - m[3]; // width
var h = 200 - m[0] - m[2]; // height
var tw = w - 75; //timeline width is shorter to allow for checkbox
var x, y, y1, y2;
var alldata, station_aggregate;
var alldata_loaded = 0, station_aggregate_loaded = 0; // global indicator of when we're done loading all data
var clicked_but_not_loaded = 0; // they selected a station but we're not loaded yet

var svg; // map svg
var tsvg = d3.select("#timeline").append("svg:svg")
      .attr("width", tw + m[1] + m[3])
      .attr("height", 50)
      .append("svg:g")
      .attr("transform", "translate(" + m[3] + ",0)")
      .attr('id', 'tsvg');

var graph1 = d3.select("#graph1").append("svg:svg")
      .attr("width", w + m[1] + m[3])
      .attr("height", h + m[0] + m[2])
      .append("svg:g")
      .attr("transform", "translate(" + m[3] + "," + m[0] + ")")
      .attr('id', 'graph1');
var graph2 = d3.select("#graph2").append("svg:svg")
      .attr("width", w + m[1] + m[3])
      .attr("height", h + m[0] + m[2])
      .append("svg:g")
      .attr("transform", "translate(" + m[3] + "," + m[0] + ")")
      .attr('id', 'graph2');


var tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([-10, 0])
  .html(function(d) {
        var color ='';
        if(d[4]==5){
          color = "#BD1A00";
        }
        else if(d[4]==4){
          color = "#DE4B53";
        }
        else if(d[4]==3){
          color = "#C0C0C0";
        }
        else if(d[4]==2){
          color = "#72B582";
        }
        else if(d[4]==1){
          color = "#438875";
        }
        else{
          color = "black";
        }
    return "<p style='color:"+color+";font-size:20px'>" + d[1] + "</p><div style='text-align:center'><span style='display:inline-block;color:white;font-size:10px;text-align:left'>Frustration <br>Rank</span><span style='display:inline-block;color:white;font-size:40px;margin-right:20px'>"+d[4]+"</span><span style='display:inline-block;color:white;font-size;10px;text-align:left'>Avg.<br>Outflow</span><span style='display:inline-block;color:white;font-size:40px'>"+Number((d[5]).toFixed(1))+"</span></div>";
});

var tip_line = d3.tip()
  .attr('class', 'd3-tip-line')
  .offset([0, 0])
  .html(function(d) {
    return "<div style='text-align:left;display:inline-block;margin-right:10px'><p style='color:#f1c40f;font-size:20px;margin-bottom:5px'>Total Bike Riders</p><p style='color:white;font-size:10px'>from " + d[3] + "</p><p style='color:white;font-size:10px'> to " + d[4] + "</p></div><div style='display:inline-block;font-size:40px'>"+ d[2]+"</div>";
});

$(document).ready(function() {
  initialize();
  initial_station_list();
  toggles.init();
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
  var dataset = [];
  d3.json("_data/station_data.json", function(data) { 
    station_dataset = data.map(function(d) { return [ d["station_id"], d["station_name"], +d["lat"], +d["long"], d["rank"], d["avg_outflow"] ]; }); 
    var overlay = new google.maps.OverlayView();
    overlay.onAdd = function() {
      var layer = d3.select(this.getPanes().overlayMouseTarget).append("div")
          .attr("class", "stations");
      svg = layer.append("svg");

      // Draw each marker as a separate SVG element.
      // We could use a single SVG, but what size would it have?
      overlay.draw = function() {
        // delete previous drawing
        svg.selectAll('.arc').remove();
        $('.marker').remove();
        svg.selectAll('.circ').remove();

        markerOverlay = this;
        var overlayProjection = markerOverlay.getProjection();
        var googleMapProjection = function (coordinates) {
            var googleCoordinates = new google.maps.LatLng(coordinates[1], coordinates[0]);
            var pixelCoordinates = overlayProjection.fromLatLngToDivPixel(googleCoordinates);
            return [pixelCoordinates.x + 4000, pixelCoordinates.y + 4000];
        }
        path = d3.geo.path().projection(googleMapProjection);
  
        arclocs =[];

        // do we already have something selected?
        if(selected_sid) {
          limitMap(selected_sid);
        } else {
          // Traffic line
          d3.json("_data/all_trips.json", function(error, data){
              var max = d3.max(data, function(array) {
                          return d3.max(array);
                        });
              var min = d3.min(data, function(array) {
                          return d3.min(array);
                        });
              
              line_width = d3.scale.linear().range([0,15]).domain([min, max]);

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
                 return line_width(d[4])
              })
              .attr('stroke', '#FF0A0A')
              .attr("fill", "none")
              .attr("opacity", 0.5)
              .attr("stroke-linecap", "round")
              .attr('class', 'arc');

            // draw station circles on top of arcs
            drawStationCircles();
          });
        }

      };
    };
    // Bind our overlay to the map…
    overlay.setMap(map);

    // load all of our timed station metrics 
    $.getJSON('_data/data_bytime_min.json',function(d) {
      alldata = d;

      for(var i = 0 ; i < alldata[0].s.length ; ++i) {
        for(var j = 0 ; j < alldata[i].s.length ; ++j) {
          if(alldata[i].s[j].AO > maxOutflowTimed)
            maxOutflowTimed = alldata[i].s[j].AO;
        }
      }

      alldata_loaded = 1;
      if(clicked_but_not_loaded == 1 && station_aggregate_loaded == 1) {
        // this means we've finally loaded all the data... but someone's already clicked on the station!
        // also, the other json has loaded already, so let's draw the map and graphs

        // show subtitle
        $('.outgoingsubtitle').removeClass('hidden');

        // remove loading image, explain
        $('.explain').remove();
        $('#info').removeClass('hidden');
        $('#loadingimage').remove();
        $('#timeline').removeClass('hidden');
        $('#allday').removeClass('hidden');

        drawGraph(graph1, selected_sid);
        drawSingleGraph(graph2, selected_sid);
        limitMap(selected_sid);
      }
    });


    $.getJSON('_data/station_aggregate.json',function(d) {
      station_aggregate = d;
      station_aggregate_loaded = 1;
      if(clicked_but_not_loaded == 1 && alldata_loaded == 1) {
        // this means we've finally loaded all the data... but someone's already clicked on the station!
        // also, the other json has loaded already, so let's draw the map and graphs

        // show subtitle
        $('.outgoingsubtitle').removeClass('hidden');

        // remove loading image, explain
        $('.explain').remove();
        $('#info').removeClass('hidden');
        $('#loadingimage').remove();
        $('#timeline').removeClass('hidden');
        $('#allday').removeClass('hidden');

        drawGraph(graph1, selected_sid);
        drawSingleGraph(graph2, selected_sid);
        limitMap(selected_sid);
      }
    });

  drawTimeline(); // draw timeline once at start

  });
}

// check data, draw maps and graphs if possible
function drawGraphsAndMap(sid) {
  // we need alldata_loaded (for graphs) and station_aggregate_loaded (for map)
  if(alldata_loaded && station_aggregate_loaded) {
    drawGraph(graph1, sid);
    $('#timeline').removeClass('hidden');
    $('#allday').removeClass('hidden');
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

    drawSingleGraph(graph2, sid);
    limitMap(sid);
  } else {
    // show loading image
    $('#loadingimage').removeClass('hidden');
    clicked_but_not_loaded = 1;
  }
}

function limitMap(sid) {
  var overlayProjection = markerOverlay.getProjection();
  var googleMapProjection = function (coordinates) {
      var googleCoordinates = new google.maps.LatLng(coordinates[1], coordinates[0]);
      var pixelCoordinates = overlayProjection.fromLatLngToDivPixel(googleCoordinates);
      return [pixelCoordinates.x + 4000, pixelCoordinates.y + 4000];
  }

  var flow_latlng=[];
  svg.selectAll('.arc').remove();

  var sid_long, sid_lat, total_cnt, sid_name, did_name;
  //grabbing lat longs
  for(var k=0;k<station_dataset.length;k++){
    if(sid == station_dataset[k][0]){
         sid_name = station_dataset[k][1];
         sid_lat = station_dataset[k][2];
         sid_long = station_dataset[k][3];
    }
    else{continue;}
  }

  var flow_stations, flow_color;
  for(var i=0;i<station_aggregate.length;i++){
    if(sid == station_aggregate[i].station_id){
      flow_stations = station_aggregate[i].outflow_stations;
      flow_color = '#FF0A0A';
    }
  }

  for (var k=0;k<station_dataset.length;k++){
    for(var j=0;j<flow_stations.length;j++){
      if(flow_stations[j].station_id==station_dataset[k][0]){

        did_name =station_dataset[k][1];
        flow_latlng.push([station_dataset[k][2],station_dataset[k][3],flow_stations[j].count,sid_name,did_name]);
      }
    }
  }
  svg.call(tip_line);
  // make transition only if selecting different station
  if(sid != pre_sid){
      svg.selectAll('.arc')
        .data(flow_latlng)
        .enter()
        .append('path')
        .attr('d', function(d) {
          var startcoords = googleMapProjection([sid_long, sid_lat]);
          var endcoords = googleMapProjection([d[1], d[0]]);
          var startx = startcoords[0],
            starty = startcoords[1],
            homex = endcoords[0],
            homey = endcoords[1];
            return "M" + startx + "," + starty + " Q" + (startx + homex)/2 + " " + 0.99*(starty + homey)/2 +" " + homex+" "   + homey;
        })
        .call(line_transition)
        .attr("stroke-width", function(d){
           return line_width(d[2]);
        })
        .attr('stroke', '#FF0A0A')
        .attr("fill", "none")
        .attr("opacity", 0.5)
        .attr("stroke-linecap", "round")
        .attr('class', 'arc')
        .on('mouseover', tip_line.show)
        .on('mouseout', tip_line.hide);
  }else{
        svg.selectAll('.arc')
        .data(flow_latlng)
        .enter()
        .append('path')
        .attr('d', function(d) {
          var startcoords = googleMapProjection([sid_long, sid_lat]);
          var endcoords = googleMapProjection([d[1], d[0]]);
          var startx = startcoords[0],
            starty = startcoords[1],
            homex = endcoords[0],
            homey = endcoords[1];
            return "M" + startx + "," + starty + " Q" + (startx + homex)/2 + " " + 0.99*(starty + homey)/2 +" " + homex+" "   + homey;
        })
        .attr("stroke-width", function(d){
           return line_width(d[2]);
        })
        .attr('stroke', '#FF0A0A')
        .attr("fill", "none")
        .attr("opacity", 0.5)
        .attr("stroke-linecap", "round")
        .attr('class', 'arc');
  }
  pre_sid =sid;

  // make sure the dropdown is set to the right thing
  $('#station_list #station'+sid).prop('selected',true);

  // draw station circles on top of arcs
  drawStationCircles();
}

function drawStationCircles() {
  var overlayProjection = markerOverlay.getProjection();
  var googleMapProjection = function (coordinates) {
      var googleCoordinates = new google.maps.LatLng(coordinates[1], coordinates[0]);
      var pixelCoordinates = overlayProjection.fromLatLngToDivPixel(googleCoordinates);
      return [pixelCoordinates.x + 4000, pixelCoordinates.y + 4000];
  }
  svg.selectAll('.circ').remove();
  svg.call(tip);
  var scale=d3.scale.linear()
    .domain([0.007575757575757576,68.40151515151516])
    .range([4,20]);

  svg.selectAll('.circ')
    .data(station_dataset)
    .enter()
    .append('svg:circle')
      .attr('cx',function(d){
        var circlecoord=googleMapProjection([d[3],d[2]]); //long, lat
        return circlecoord[0];
      })
      .attr('cy',function(d){
        var circlecoord=googleMapProjection([d[3],d[2]]); //long, lat
        return circlecoord[1];
      })
      .attr('r', function(d){
        return scale(d[5]);
      })
      .attr('data-radius',function(d){
        return scale(d[5]);
      })
      .attr("title",function(d){
        return d[0];
      })
      .attr("fill",function(d){
        if(d[4]==5){
          return "#BD1A00";
        }
        else if(d[4]==4){
          return "#DE4B53";
        }
        else if(d[4]==3){
          return "#C0C0C0";
        }
        else if(d[4]==2){
          return "#72B582";
        }
        else if(d[4]==1){
          return "#438875";
        }
        else{
          return "black";
        }
      })
      .on({
        "click": function(){
          selected_sid = d3.select(this).attr("title");
          drawGraphsAndMap(selected_sid);
        }
      })
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide)
      .attr('class', 'circ')
    .datum(function(){return this.dataset;})
    .sort(function(a,b){return d3.descending(a.radius,b.radius);});
}

//---------------------------------
// Transition
//---------------------------------

function line_transition(path) {
    path.transition()
        .duration(1500)
        .attrTween("stroke-dasharray", tweenDash);
}

function tweenDash() {
  var l = this.getTotalLength(),
      i = d3.interpolateString("0," + l, l + "," + l);
  return function(t) { return i(t); };
}

//---------------------------------
// graphs
//---------------------------------

// also requires global vars data, x, y1, y2
function drawGraph(graph, stationid) {
  var stationindex;

  // get array index for station
  for(var i = 0 ; i < alldata[0].s.length ; ++i) {
    if(alldata[0].s[i].sid == stationid) {
      stationindex = i;
    }
  }

  // get max outflow and empty, for scale
  var maxoutflow = 0;
  var maxempty = 0;
  for(var i = 0 ; i < alldata.length; ++i) {
    if(alldata[i].s[stationindex].AO > maxoutflow)
      maxoutflow = alldata[i].s[stationindex].AO;
    if(alldata[i].s[stationindex].AE > maxempty)
      maxempty = alldata[i].s[stationindex].AE;
  }
  maxoutflow *= 4; // hourly rate instead of 15minute

  x = d3.scale.linear().domain([0, alldata.length]).range([0, w]);
  y1 = d3.scale.linear().domain([0, maxoutflow]).range([h, 0]);
  y2 = d3.scale.linear().domain([0, 0.5]).range([h, 0]);

  var line = d3.svg.line()
    .x(function(d,i) {
      return x(i);
    })
    .y(function(d) {
      return y1(d.s[stationindex].AO*4); // hourly rate
    })

  var emptyline = d3.svg.line()
    .x(function(d,i) {
      return x(i);
    })
    .y(function(d) {
      // percent empty. avg empty duration / 900 seconds * 100
      return y2(d.s[stationindex].AE / 9);
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
      .text('hourly traffic (# bikes)')
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
    if(alldata[0].s[i].sid == stationid) {
      // found it
      stationindex = i;
    }
  }

  // get max score
  var maxscore = 0;
  for(var i = 0 ; i < alldata.length; ++i) {
    if(alldata[i].s[stationindex].score > maxscore)
      maxscore = alldata[i].s[stationindex].score;
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
      return y((d.s[stationindex].score / .6977672)*100); 
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
function drawTimeline() {
  var ratio = w / tw; // difference between timeline and normal graphs

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
  function showHover() {
    if(!graph1.select("path.empty").empty()) {
      focus.style("display", null);
      focus2.style("display", null);
    }
  }
  function hideHover() {
    focus.style("display", "none");
    focus2.style("display", "none");
  }
  tsvg.selectAll().remove();

  // the timeline
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

  // timeline time labels
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

  // hover/focus line and times for each graph
  var focus = graph1.append("g")
    .attr("class","focus")
    .style("display", "none");
  focus.append("line")
    .attr({
      "x1": 0,
      "y1": 15,
      "x2": 0,
      "y2": h,
      'class': 'focusLine'
    });
  var timetext = focus.append('text')
    .attr('class', 'axislabel timetext')
    .attr('text-anchor', 'middle')
    .attr('x', 0)
    .attr('y', 10)
    .attr('class', 'timetext')
    .text('0');

  var focus2 = graph2.append("g")
    .attr("class","focus")
    .style("display", "none");
  focus2.append("line")
    .attr({
      "x1": 0,
      "y1": 15,
      "x2": 0,
      "y2": h,
      'class': 'focusLine'
    });
  var timetext2 = focus2.append('text')
    .attr('class', 'axislabel timetext')
    .attr('text-anchor', 'middle')
    .attr('x', 0)
    .attr('y', 10)
    .attr('class', 'timetext')
    .text('0');

  // attach mouse handlers for each svg obj
  var drag = d3.behavior.drag()
      .on("drag", dragmove)
      .on('dragend', dragend);

  tsvg.append("rect")
    .attr({"opacity":0, "width":tw , "height":50, 'class':'focusbox', 'id':'tsvgfocus'})
    .on({
      "mouseover": function() {
        showHover();
      },
      "mouseout":  function() {
        hideHover();
      },
      'click': mouseclick,
      'mousemove': mousemove
    })
    .call(drag);

  graph1.append("rect")
    .attr({"opacity": 0, "width":w , "height":h, 'class':'focusbox', 'id':'graph1focus'})
    .on({
      "mouseover": function() {
        showHover();
      },
      "mouseout":  function() {
        hideHover();
      },
      'click': mouseclick,
      'mousemove': mousemove
    });
  graph2.append("rect")
    .attr({"opacity": 0, "width":w , "height":h, 'class':'focusbox', 'id':'graph2focus'})
    .on({
      "mouseover": function() {
        showHover();
      },
      "mouseout":  function() {
        hideHover();
      },
      'click': mouseclick,
      'mousemove': mousemove
    });

  function mouseclick() {
    var x = d3.mouse(this)[0];
    var position;

    if(this.id == 'graph2focus' || this.id == 'graph1focus')
      x /= ratio;

    var percent = x / tw;
    var dt = new Date(2014,0,0);
    dt = new Date(dt.getTime() + 15*Math.round(percent*96)*60000);
    selectedTime = (dt.getMinutes() == 0) ? (dt.getHours() + ':0' + dt.getMinutes()) : (dt.getHours() + ':' + dt.getMinutes());

    if(x < 0)
      position=0;
    else if(x>tw)
      position=tw;
    else
      position=x;

    selectedTimeIndex = parseInt(Math.round(percent*96));
    redrawTimedMap(selectedTimeIndex);

    // move time slider to appropriate place
    tsvg.select('circle').attr('cx',position);
    activateTimeline();
  }

  function mousemove() {
    // move it only by 15minute increments. 96 time incremenets (24 hours / 15 min)

    if(this.id == 'tsvgfocus' || this.id == 'timecircle') {
      // mouse is over the timeline instead of the main graphs, so we need to scale the position
      // of the line, since timeline is smaller than main graphs 
      // basically, the mouse position 'x' actually means a time of 'x'*'ratio'
      var percent = (d3.mouse(this)[0]) / tw;
      var sizeOfInterval = w / 96.0; // size of each 15 minutes
      var x = Math.round(percent*96) * sizeOfInterval; // the closest 15 minute interval in pixels
      focus.attr("transform", "translate(" + x + ",0)");
      focus2.attr("transform", "translate(" + x + ",0)");
    } else {
      var percent = (d3.mouse(this)[0]) / w;
      var sizeOfInterval = w / 96.0; // size of each 15 minutes
      var x = Math.round(percent*96) * sizeOfInterval; // the closest 15 minute interval in pixels
      focus.attr("transform", "translate(" + x + ",0)");
      focus2.attr("transform", "translate(" + x + ",0)");
    }

    var dt = new Date(2014,0,0);
    dt = new Date(dt.getTime() + 15*Math.round(percent*96)*60000);
    var timestr = (dt.getMinutes() == 0) ? (dt.getHours() + ':0' + dt.getMinutes()) : (dt.getHours() + ':' + dt.getMinutes());
    timetext.text(timestr);
    timetext2.text(timestr);
  }

  function redrawTimedMap(selectedTimeIndex) {
    var overlayProjection = markerOverlay.getProjection();
    var googleMapProjection = function (coordinates) {
        var googleCoordinates = new google.maps.LatLng(coordinates[1], coordinates[0]);
        var pixelCoordinates = overlayProjection.fromLatLngToDivPixel(googleCoordinates);
        return [pixelCoordinates.x + 4000, pixelCoordinates.y + 4000];
    }

    var flow_latlng=[];
    // svg.selectAll('.arc').remove();

    // make array/dictionary for stations and outflow and rank
    // this data is only for this time
    var timedStations = []
    for(var i=0;i<alldata[selectedTimeIndex].s.length;++i){
      timedStations[alldata[selectedTimeIndex].s[i].sid] = {ao: alldata[selectedTimeIndex].s[i].AO, r: alldata[selectedTimeIndex].s[i].r, sid: alldata[selectedTimeIndex].s[i].sid, score: alldata[selectedTimeIndex].s[i].score, tos: alldata[selectedTimeIndex].s[i].TOS, long:0, lat:0};
    }

    var flow_stations, flow_color;

    var sid_long, sid_lat, total_cnt, sid_name, did_name;
    //grabbing lat longs
    for(var k=0;k<station_dataset.length;k++){
      timedStations[station_dataset[k][0]].long=station_dataset[k][3];
      timedStations[station_dataset[k][0]].lat=station_dataset[k][2];
      if(selected_sid == station_dataset[k][0]){
         sid_name = station_dataset[k][1];
         sid_lat = station_dataset[k][2];
         sid_long = station_dataset[k][3];
      }
      else{continue;}
    }

    flow_stations = timedStations[selected_sid].tos;

    for(var k=0;k<station_dataset.length;k++){
      did_name =station_dataset[k][1];
      for(var j=0;j<flow_stations.length;++j) {
        if(flow_stations[j].sid == station_data[k][0])
          flow_latlng.push([station_dataset[k][2],station_dataset[k][3],4*(flow_stations[j].c),sid_name,did_name]);
      }
    }

    svg.selectAll('.arc').remove();
    svg.selectAll('.arc')
    .data(flow_latlng)
    .enter()
    .append('path')
    .attr('d', function(d) {
      var startcoords = googleMapProjection([sid_long, sid_lat]);
      var endcoords = googleMapProjection([d[1], d[0]]);
      var startx = startcoords[0],
        starty = startcoords[1],
        homex = endcoords[0],
        homey = endcoords[1];
        return "M" + startx + "," + starty + " Q" + (startx + homex)/2 + " " + 0.99*(starty + homey)/2 +" " + homex+" "   + homey;
    })
    .attr("stroke-width", function(d){
       return line_width(d[2]);
    })
    .attr('stroke', '#FF0A0A')
    .attr("fill", "none")
    .attr("opacity", 0.5)
    .attr("stroke-linecap", "round")
    .attr('class', 'arc');

    var timedStationsTemp=[];
    for(var i=0;i<timedStations.length;++i) {
      if(timedStations[i])
        timedStationsTemp.push(timedStations[i]);
    }


    // adjust circle sizes and colors
    svg.selectAll('.circ').remove();
    svg.call(tip);

    // get max for scale
    var scale=d3.scale.linear()
      .domain([0,maxOutflowTimed])
      .range([4,20]);

    svg.selectAll('.circ')
      .data(timedStationsTemp)
      .enter()
      .append('svg:circle')
        .attr('cx',function(d){
          var circlecoord=googleMapProjection([d.long,d.lat]); //long, lat
          return circlecoord[0];
        })
        .attr('cy',function(d){
          var circlecoord=googleMapProjection([d.long,d.lat]); //long, lat
          return circlecoord[1];
        })
        .attr('r', function(d){
          return scale(d.ao);
        })
        .attr('data-radius',function(d){
          return scale(d.ao);
        })
        .attr("title",function(d){
          return d.sid;
        })
        .attr("fill",function(d){
          if(d.r==5){
            return "#BD1A00";
          }
          else if(d.r==4){
            return "#DE4B53";
          }
          else if(d.r==3){
            return "#C0C0C0";
          }
          else if(d.r==2){
            return "#72B582";
          }
          else if(d.r==1){
            return "#438875";
          }
          else{
            return "black";
          }
        })
        .on({
          "click": function(){
            selected_sid = d3.select(this).attr("title");
            drawGraphsAndMap(selected_sid);
          }
        })
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide)
        .attr('class', 'circ')
      .datum(function(){return this.dataset;})
      .sort(function(a,b){return d3.descending(a.radius,b.radius);});
  }


  // drag/click behavior for timeline circle
  tsvg.append('circle')
    .attr('r', 6)
    .attr('cx', 30)
    .attr('cy', 10)
    .attr('class', 'timecircle')
    .attr('id', 'timecircle')
    .on({
      "mouseover": function() {
        showHover();
      },
      "mouseout": function() {
        hideHover();
      },
      "click": function() {
        activateTimeline();
      },
      "mousemove": mousemove
    })
    .call(drag);

  function dragmove(d) {
    var x = d3.event.x;
    if(x<0)
      x=0;
    else if(x>tw)
      x=tw;

    tsvg.select('circle')
      .attr('cx', x);

    activateTimeline();
  }
  function dragend() {
    var x = tsvg.select('circle').attr('cx');
    var percent = x / tw;
    var dt = new Date(2014,0,0);
    dt = new Date(dt.getTime() + 15*Math.round(percent*96)*60000);
    selectedTime = (dt.getMinutes() == 0) ? (dt.getHours() + ':0' + dt.getMinutes()) : (dt.getHours() + ':' + dt.getMinutes());

    selectedTimeIndex = parseInt(Math.round(percent*96));
    redrawTimedMap(selectedTimeIndex);
  }

  // the all day checkbox behavior
  $('#allday input:checkbox').click(function() {
    if($(this).is(':checked')) {
      // all day is checked, disable the timeline
      deactivateTimeline();
    } else {
      // unchecked. enable timelime
      activateTimeline();
    }
  });

}


//---------------------------------
// city tab
//---------------------------------
// initial
function initial_station_list(){
  $.getJSON( "./_data/station_data.json", function( data ) {
    var items = ["<option id='none' value='none'>Choose a station ...</option>"];
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
    var items = ["<option id='none' value='none'>Choose a station ...</option>"];
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
  selected_sid = $('#station_list :selected').attr('id').substring(7);
  drawGraphsAndMap(selected_sid);
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

