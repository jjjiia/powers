var centroids = null
var keysDictionary = null
var censusData = null
var isCursorOverPoint;
var map = null
var canvas = null
var isDragging;
var isCursorOverPoint;
var geojson;
//var radius = 100;
var keys = ["SE_T001_001","SE_T150_001",
"SE_T150_002","SE_T150_003","SE_T150_004","SE_T150_005","SE_T150_006","SE_T150_007",
"SE_T150_008","SE_T056_001","SE_T056_002","SE_T056_017","SE_T108_001","SE_T108_002",
"SE_T128_001","SE_T128_002","SE_T128_005","SE_T128_006","SE_T128_008",
"SE_T129_001","SE_T129_003","SE_T129_009","SE_T129_010"]

var colors = ["#87b733","#615c22","#4fc03e","#9a8b35","#399036","#afb035","#386325","#a6ab68","#71b46b","#6c892e"];

  	queue()
      .defer(d3.csv,"centroids.csv")
      .defer(d3.json,"data_census/scope_newKeys.json")
      .defer(d3.csv,"scope_data.csv")
      .await(dataDidLoad);

function dataDidLoad(error,centroidsFile,keysFile,dataFile) { 

    centroids = makeDictionary(centroidsFile)
    keysDictionary = keysFile
    censusData = makeDictionary(dataFile)
    mapboxgl.accessToken = 'pk.eyJ1IjoiampqaWlhMTIzIiwiYSI6ImNpbDQ0Z2s1OTN1N3R1eWtzNTVrd29lMDIifQ.gSWjNbBSpIFzDXU2X5YCiQ';
   var center = [-73.96563786279582,40.779221740166435]
    
    var coordinates = document.getElementById('coordinates');
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/jjjiia123/cjg9lpac314p42so3g7jb5fkx',
        center: center,
        zoom: 11,
        minZoom:9,
        maxZoom:11.5
    });

    geojson = {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": center
            }
        }]
    };

    map.on('load', function() {

      //  var pixelsPerMile = calculateRadius(map)
    
       // map.addControl(new mapboxgl.ScaleControl({maxWidth: pixelsPerMile,unit: 'metric'})); 
        map.addControl(new mapboxgl.ScaleControl({maxWidth: 100,unit: 'imperial'})); 
        
        map.setFilter("blockgroups-highlight",["==","AFFGEOID",""]);
        canvas = map.getCanvasContainer();
        
        
        var pixelsPerMile = getRadiusFromScale()
        var radius = pixelsPerMile
        // Add a single point to the map
        map.addSource('point', {
            "type": "geojson",
            "data": geojson
        });

        map.addLayer({
            "id": "point",
            "type": "circle",
            "source": "point",
            "paint": {
                "circle-radius":radius,
                "circle-color": "rgba(0,0,0,.1)"
            }
        });
        
        map.addLayer({
            "id": "point2",
            "type": "circle",
            "source": "point",
            "paint": {
                "circle-radius":radius*2,
                "circle-color": "rgba(0,0,0,.1)"
            }
        });
        map.addLayer({
            "id": "point3",
            "type": "circle",
            "source": "point",
            "paint": {
                "circle-radius":radius*5,
                "circle-color": "rgba(0,0,0,.1)"
            }
        });
        map.on("move",function(){
            var barWidth = d3.select(".mapboxgl-ctrl-scale").style("width")
            var miles = d3.select(".mapboxgl-ctrl-scale").html()
            var pixelsPerMile = getRadiusFromScale()
            
            map.setPaintProperty('point', 'circle-radius', pixelsPerMile);
            map.setPaintProperty('point2', 'circle-radius', pixelsPerMile*2);
            map.setPaintProperty('point3', 'circle-radius', pixelsPerMile*5);
        })
        // When the cursor enters a feature in the point layer, prepare for dragging.
        map.on('mouseenter', 'point3', function() {
            map.setPaintProperty('point', 'circle-color',  "rgba(0,0,0,.4)");
            map.setPaintProperty('point2', 'circle-color',  "rgba(0,0,0,.4)");
            map.setPaintProperty('point3', 'circle-color',  "rgba(0,0,0,.4)");
            canvas.style.cursor = 'move';
            isCursorOverPoint = true;
            map.dragPan.disable();
        });

        map.on('mouseleave', 'point3', function() {
            map.setPaintProperty('point', 'circle-color',  "rgba(0,0,0,.1)");
            map.setPaintProperty('point2', 'circle-color',  "rgba(0,0,0,.1)");
            map.setPaintProperty('point3', 'circle-color',  "rgba(0,0,0,.1)");
            canvas.style.cursor = '';
            isCursorOverPoint = false;
            map.dragPan.enable();
        });

        map.on('mousedown', mouseDown);
        calculateRadius(map)
        var xy = map.project([-73.96563786279582,40.779221740166435])
        
        var point = {point:{x:xy.x,y:xy.y},lngLat:{lat:40.779221740166435,lng:-73.96563786279582}}
        getFeatures(point,radius*5)    
    });
}

function getRadiusFromScale(){
            var barWidth = parseFloat(d3.select(".mapboxgl-ctrl-scale").style("width").replace("px",""))
            var miles = parseFloat(d3.select(".mapboxgl-ctrl-scale").html().replace("mi",""))
            var perMile = barWidth/miles
    
   // console.log([barWidth,miles,perMile])
    return perMile
}
function calculateRadius(map){
    var width = $("#map").innerWidth()
    var height = $("#map").innerHeight()
    var latLng1 = map.unproject([0,height])
    var latLng2 = map.unproject([width,height])
    var distance = getDistances(latLng1.lat,latLng1.lng,latLng2.lat,latLng2.lng)
    
    var pixelsPerMile = width/distance
    
    return pixelsPerMile
}
function makeDictionary(data){
    var formatted = {}
    for(var i in data){
        var gid = data[i]["Geo_GEOID"]
        formatted[gid] = data[i]
    }
    return formatted
}

function mouseDown() {
    if (!isCursorOverPoint) return;

    isDragging = true;

    // Set a cursor indicator
    canvas.style.cursor = 'grab';

    // Mouse events
    map.on('mousemove', onMove);
    map.once('mouseup', onUp);
}

function onMove(e) {
    if (!isDragging) return;
    var coords = e.lngLat;

    // Set a UI indicator for dragging.
    canvas.style.cursor = 'grabbing';

    // Update the Point feature in `geojson` coordinates
    // and call setData to the source layer `point` on it.
    geojson.features[0].geometry.coordinates = [coords.lng, coords.lat];
    map.getSource('point').setData(geojson);
}
function getDistances(lat1,lng1,lat2,lng2){
    var unit = "N"
	var radlat1 = Math.PI * lat1/180
	var radlat2 = Math.PI * lat2/180
	var theta = lng1-lng2
	var radtheta = Math.PI * theta/180
	var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
	dist = Math.acos(dist)
	dist = dist * 180/Math.PI
	dist = dist * 60 * 1.1515
	if (unit=="K") { dist = dist * 1.609344 }
	if (unit=="N") { dist = dist * 0.8684 }
	return dist
}


function getFeatures(point,radius){
      //console.log(point)
  var x = point.point.x
  var y = point.point.y
  var lat = point.lngLat.lat
  var lng = point.lngLat.lng
  //var canvas = map.get(canvas)
  var bbox = [[x - radius, y - radius], [x + radius, y + radius]];
  var features = map.queryRenderedFeatures(bbox,{layers:["blockgroups"]});        
  var gids = {"_1":[], "_2":[],"_5":[]}
  if(features.length>0){
      for(var f in features){
          var gid = features[f].properties.AFFGEOID
          var centroidEntry = centroids[gid.replace("1500000US","15000US")]
          var centroid = [centroidEntry.lng,centroidEntry.lat]
          
         // console.log(centroid)
          var distance = getDistances(lat,lng,centroidEntry.lat,centroidEntry.lng)
        //  console.log(distance)
          if(distance<5){
              gids["_5"].push(gid)
          }
          if(distance<2){
              gids["_2"].push(gid)
          }
          if(distance<1){
              gids["_1"].push(gid)
          }
      }
  }
  
  var dataInRange5 = getDataInRadius(gids["_5"])
  var dataInRange2 = getDataInRadius(gids["_2"])
  var dataInRange1 = getDataInRadius(gids["_1"])
  var dataInRanges = {"_5": dataInRange5,"_2": dataInRange2,"_1": dataInRange1}
  displayData(dataInRanges)
  
  var filter = ["in","AFFGEOID"].concat(gids["_5"])
  map.setFilter("blockgroups-highlight",filter);
}
function displayData(data){
           // console.log(data)
    d3.selectAll("#data svg").remove()
    var text = ""
    for(var i in  keysDictionary){
        
        var group = keysDictionary[i]
        //console.log([i, group])
        
        text+="<strong>"+i+"</strong><br/>"
        for(var j in group){
            
            var code = "SE_"+j
            var codeText = group[j]
            var totalCode = "SE_"+j.split("_")[0]+"_001"
            var value1 = data["_1"][code]
            var totalValue1 =  data["_1"][totalCode]
            var percent1 = Math.round(value1/totalValue1*10000)/100
            
            var value2 = data["_2"][code]
            var totalValue2 =  data["_2"][totalCode]
            var percent2 = Math.round(value2/totalValue2*10000)/100
            
            var value5 = data["_5"][code]
            var totalValue5 =  data["_5"][totalCode]
            var percent5 = Math.round(value5/totalValue5*10000)/100
            
            var values = [value1, value2, value5]
            var totals = [totalValue1, totalValue2, totalValue5]
            var percents = [parseFloat(percent1), parseFloat(percent2), parseFloat(percent5)]
            
            if(code=="SE_T001_001"){
                var textEntry = ""+codeText+"<br/>"+"<span style=\"color:#000\">"+value1+"</span>"
                            +"<span style=\"color:#888\">"+value2+"</span>"
                            +"<span style=\"color:#aaa\">"+value5+"</span>"+"<br/>"
                    text+=textEntry
            }else if(j.split("_")[1]!= "001" && j!="overview"){
                                            
                var textEntry = codeText+"<br/>"+"<span style=\"color:#000\">"+percent1+"</span>"
                            +"<span style=\"color:#888\">"+percent2+"</span>"
                            +"<span style=\"color:#aaa\">"+percent5+"</span>"+"<br/>"
                text+=textEntry
                drawChart(values,percents,code,codeText)
            }
        }
        
        
    }
    //var table = d3.select("#data").html(text)
}
function drawChart(values,percents,code,title){
    var height = 110
    var margin = 70
    var barWidth = 40
    var gap = 5
  //  console.log(percents.sort()[2])
    var max = Math.max(percents[0],percents[1],percents[2])
   // var max = percents.sort()[2]
    var y = d3.scaleLinear().domain([0,max]).range([0,height-margin])
    //console.log(Math.max(percents))
    var svg = d3.select("#data").append("svg").attr("width",300).attr("height",height)
    svg.append("text").text(title).attr("x",0).attr("y",15).style("font-weight","bold").style("font-size","11px")
    svg.append("text").text("1").attr("x",(barWidth-gap)/2).attr("y",height-18).style("font-weight","bold").style("fill","#72a553")
        .style("text-anchor","middle")
    svg.append("text").text("2").attr("x",barWidth+(barWidth-gap)/2).attr("y",height-18).style("font-weight","bold").style("fill","#72a553")
        .style("text-anchor","middle")
    svg.append("text").text("5").attr("x",barWidth*2+(barWidth-gap)/2).attr("y",height-18).style("font-weight","bold").style("fill","#72a553")
        .style("text-anchor","middle")
    svg.append("text").text("miles").attr("x",barWidth*3+(barWidth-gap)/2).attr("y",height-18).style("font-weight","bold").style("fill","#72a553")
        .style("text-anchor","middle")
    svg.selectAll("rect")
        .data(percents)
        .enter()
        .append("rect")
        .attr("class",function(d,i){return code+"_"+i})
        .style("fill","#000")
        .attr("opacity",.3)
        .attr("x",function(d,i){return i* barWidth})
        .attr("y",function(d,i){return height-margin/2-y(d)})
        .attr('width', barWidth-gap)
        .attr("height",function(d,i){ 
            return y(d)
        })
    svg.selectAll(".percentText")
        .data(percents)
        .enter()   
        .append("text")
        .text(function(d){
            if(d<10){
                return d+"%"
            }else{
                return Math.round(d)+"%"} 
            }
           )
        .attr("x",function(d,i){return i* barWidth+(barWidth-gap)/2})
        .style("text-anchor","middle")
           .style("font-size","11px")
        .attr("y",function(d,i){return height-margin/2-y(d)-2})
}
function getDataInRadius(gids){
    var formatted = {}
    for(var k in keys){
        var key = keys[k]
        if(key!="Geo_GEOID"&& key!="Geo_NAME"){
            formatted[key]=0
        }
    }
    for(var i in gids){
        var gid = gids[i].replace("1500000US","15000US")
        for(var j in keys){
            var key = keys[j]
            if(key!="Geo_GEOID"&&key!="Geo_NAME"){
                var value = parseFloat(censusData[gid][key])
               // console.log(censusData[gid][key])
                if(isNaN(value)!=true){
                    formatted[key]+=value
                }
            }
        }
    }
    return formatted
}
function onUp(e) {
    if (!isDragging) return;
    var coords = e.lngLat;

    // Print the coordinates of where the point had
    // finished being dragged to on the map.
    coordinates.style.display = 'block';
    coordinates.innerHTML = 'Longitude: ' + coords.lng + '<br />Latitude: ' + coords.lat;
    canvas.style.cursor = '';
    isDragging = false;

    // Unbind mouse events
    map.off('mousemove', onMove);
    var pixelsPerMile = getRadiusFromScale()
    getFeatures(e,pixelsPerMile*5)
    
}