//add fade in out for center
//add power to frame of rectangle
//add side statistics
//change text about
// add questionair form

var reversing = false
var flying = false
var keys =null
var topicIndex = 1
var timer = 0
var timeInterval = 200
var pub = {
    speed:.1,
    curve:1,
    startZoom:19,
    minZoom:4.01,
    maxZoom:20,
    power:0
}
$(function() {
  	queue()
      .defer(d3.json,"cities.json")
      .defer(d3.json,"data_census/census_keys.json")
     // .defer(d3.json,"dictionary_birth.json")
      .defer(d3.csv,"data_census/census_blockgroup.csv")
      .defer(d3.csv,"data_census/census_tract.csv")
      .defer(d3.csv,"data_census/census_county.csv")
      .await(dataDidLoad);
  })

function addMapFeatures(map){
      map.addControl(new mapboxgl.GeolocateControl({
        positionOptions: {enableHighAccuracy: true},
        trackUserLocation: true}), "top-right"); 
        addButtonFly(map)
    
        map.addControl(new mapboxgl.ScaleControl({maxWidth: 100,unit: 'imperial'})); 
        map.addControl(new mapboxgl.ScaleControl({maxWidth: 100,unit: 'metric'})); 
        d3.select(".mapboxgl-ctrl-bottom-right").remove()
       
}

function reverse(map,cities){
    reversing=true
  var allLayers = map.getStyle().layers
  var allSources = map.getStyle().sources
  
    for(var l in allLayers){
        var layer = allLayers[l]
        if(layer.id.split("_")[0]=="frame"){
            map.removeLayer(layer.id);            
        }
    }
    for(var s in allSources){
        if(s.split("_")[0]=="frame"){
            map.removeSource(s)
        }
    }
        var randomIndex = getRandomInt(0, cities.length)
        var currentCity = cities[randomIndex]
    
        var cityDisplayString = currentCity.city+", "+currentCity.state+"<br/>"+currentCity.longitude+", "+currentCity.latitude
        d3.select("#nextLocation").html(cityDisplayString).style("text-align","right")//.transition().delay(3000).style("opacity",0).remove()
         map.flyTo({
           center:[currentCity.longitude,currentCity.latitude],
               zoom: 20,
               speed: pub.speed // make the flying slow
           });
}

function makeCensusDictionary(censusData){
    var formatted = {}
    for(var i in censusData){
        var entry = censusData[i]
        var GeoId = entry["Geo_GEOID"]
        formatted[GeoId]=entry
    }
    return formatted
}
function calculateArea(lat1,lng1,lat2,lng2,lat3,lng3,lat4,lng4){
    //coordinates are clockwise
    //split to 2 triangles
    var t1s1 = haversine(lat1,lng1,lat2,lng2)
    var t1s2 = haversine(lat2,lng2,lat3,lng3)    
    var h = haversine(lat1,lng1,lat3,lng3)//hypot
    var t2s1 = haversine(lat1,lng1,lat4,lng4)
    var t2s2 = haversine(lat4,lng4,lat3,lng3)
    
    
    var p1 = (t1s1+t1s2+h)/2
    var a1 =  Math.sqrt(p1*((p1-t1s1)*(p1-t1s2)*(p1-h)));
    
    
    var p2 = (t2s1+t2s2+h)/2
    var a2 =  Math.sqrt(p2*((p2-t2s1)*(p2-t2s2)*(p2-h)));
    
    var totalArea = a1+a2
    
    return totalArea
}
function haversine(lat1,lng1,lat2,lng2){
    //var R = 6371; // Radius of the earth in km
    var R = 3949;// radius in miles
      var dLat = deg2rad(lat2-lat1);  // deg2rad below
      var dLng = deg2rad(lng2-lng1); 
      var a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLng/2) * Math.sin(dLng/2);
          
           
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      var d = R * c; // Distance in km
      return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

function dataDidLoad(error,cities,dataDictionary,blockGroup,tract,county) {  
    var randomIndex = getRandomInt(0, cities.length)
    var currentCity = cities[randomIndex]
    //[-73.978169,40.75136]//
    var currentCenter = [currentCity.longitude,currentCity.latitude]
    d3.select("#fly").html("Click to start from "+currentCity.city+", "+currentCity.state)
    
    keys = dataDictionary
    
    var tractDataById = makeCensusDictionary(tract)
    var blockGroupDataById = makeCensusDictionary(blockGroup)
    var countyDataById = makeCensusDictionary(county)
    
    var bounds = [
        [-126.098852, 33.815507], // Southwest coordinates
        [-58.071510, 46.573835]  // Northeast coordinates
    ];
    mapboxgl.accessToken = 'pk.eyJ1IjoiampqaWlhMTIzIiwiYSI6ImNpbDQ0Z2s1OTN1N3R1eWtzNTVrd29lMDIifQ.gSWjNbBSpIFzDXU2X5YCiQ';
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/jjjiia123/cjd9bcmhe14kj2so4ze5y812e',
        center: currentCenter,
        maxZoom: pub.maxZoom,
        minZoom: pub.minZoom,
        zoom: pub.startZoom
    });
    map.on("moveend",function(){
      d3.select("#fly2").html("go").style("opacity",1)
        
        if(map.getZoom()>19){
                reversing = false
            
                map.flyTo({
                      center:[-98.35,39],
                      zoom: pub.minZoom,
                      speed: pub.speed, // make the flying slow
                      curve: pub.curve // change the speed at which it zooms out
                  });
              }else if(map.getZoom()<4.1){
                reversing = true
                 
                      var layers = map.getStyle().layers
                      for(var l in layers){
                          console.log(layers[l]["id"])
                          if(layers[l]["id"].split("_")[0]=="frame"){
                              map.removeLayer(layers[l]["id"])
                              map.removeSource(layers[l]["id"].replace("frame_Label","frame_labelsource"))
                          }
                      }
                 
                var randomIndex = getRandomInt(0, cities.length)
                var currentCity = cities[randomIndex]
                var currentCenter = [currentCity.longitude,currentCity.latitude]                
                map.flyTo({
                      center:currentCenter,
                      zoom: pub.maxZoom,
                      speed: pub.speed, // make the flying slow
                      curve: pub.curve // change the speed at which it zooms out
                  });
            }         
    })
    map.on('load', function() {
       // addMapLayers(map)
        addMapFeatures(map)
        firstFrame(map,blockGroupDataById)
    })
    map.on("drag",function(){
                    timer+=timeInterval
        
            d3.selectAll("#topics_"+String(topicIndex%5+1)).transition().duration(1000).style("opacity",1)
            d3.selectAll("#topics_"+String(topicIndex%5+1)).transition().delay(2000).duration(1000).style("opacity",0)
            topicIndex+=1
        var geoids = getFeatures(map,dataDictionary,blockGroupDataById,tractDataById,countyDataById)
    })
    map.on("move",function(){
           timer+=1
      d3.select("#fly2").html("").style("opacity",0)
      
        if(flying==true){
            if(map.getZoom()<19){
                if(timer%timeInterval==0){
                    d3.selectAll(".marker").remove()
                   // d3.selectAll(".topics").transition().duration(1000).style("opacity",0)
                    d3.selectAll("#topics_"+String(topicIndex%5+1)).transition().duration(1000).style("opacity",1)
                    d3.selectAll("#topics_"+String(topicIndex%5+1)).transition().delay(2000).duration(1000).style("opacity",0)
                    topicIndex+=1
                    var geoids = getFeatures(map,dataDictionary,blockGroupDataById,tractDataById,countyDataById)
                }
            }     
        }else if (map.getZoom()>19){
            console.log("geo")
                    d3.selectAll(".marker").remove()
                    timer+=timeInterval
            
                   // d3.selectAll(".topics").transition().duration(1000).style("opacity",0)
                    d3.selectAll("#topics_"+String(topicIndex%5+1)).transition().duration(1000).style("opacity",1)
                    d3.selectAll("#topics_"+String(topicIndex%5+1)).transition().delay(2000).duration(1000).style("opacity",0)
                    topicIndex+=1
                    var geoids = getFeatures(map,dataDictionary,blockGroupDataById,tractDataById,countyDataById)
            
            
            reversing = false
        
            map.flyTo({
                  center:[-98.35,39],
                  zoom: pub.minZoom,
                  speed: pub.speed, // make the flying slow
                  curve: pub.curve // change the speed at which it zooms out
              });
        }
    })    
}
function firstFrame(map,blockGroupData){
    var features = map.queryRenderedFeatures({layers:['blockGroup']});
    var firstFeature = features[0]["properties"]["AFFGEOID"].replace("00000","000")
    var density = blockGroupData[firstFeature]["SE_T002_002"]
    
        var point = map._containerDimensions()
        var upoint =  map.unproject(point)
        var uzeros =  map.unproject([0,0])
        var lng1 = uzeros.lng
        var lat1 = uzeros.lat
        var lng2 = upoint.lng
        var lat2 = uzeros.lat
    
        var lng3 = upoint.lng
        var lat3 = upoint.lat
        var lng4 = uzeros.lng
        var lat4 = upoint.lat
        
        var area = calculateArea(lat1,lng1,lat2,lng2,lat3,lng3,lat4,lng4)
    
    var population = parseInt(Math.round(area*density))
    for(var i=0; i<population;i++){
        var x = Math.random()*point[0]
        var y = Math.random()*point[1]
        var coords = map.unproject([x,y])
        var el = document.createElement('div');
          el.className = 'marker marker_'+i%14;
        new mapboxgl.Marker(el)
            .setLngLat(coords)
            .addTo(map)
    }
}

function getCategoryData(column,dataDictionary, data){
    var keys = Object.keys(dataDictionary[column])
    var text = ""
    for(var k in keys){
        var count = getSum(data,"SE_"+keys[k])
        if(count >0){
           // var previousText = d3.select("#topics").html()
            text+=count.toLocaleString()+" "+dataDictionary[column][keys[k]].toLowerCase()+"<br/>"
        }
    }
    return text

}

function getBirthplaceData(column,dataDictionary, data){
    var keys = Object.keys(dataDictionary[column])
    var text = ""
    var output = []
    var alloutput = []
    for(var k in keys){
        var count = getSum(data,"SE_"+keys[k])
        
        if(count >0 && count <50){
            output.push([count,keys[k]])
            
           // var previousText = d3.select("#topics").html()
        }
        if(count>0){
            alloutput.push([count,keys[k]])
        }
    }
    
    
   var sorted= output.sort(function(a,b){
        return a[0] - b[0];
    });
    
    for(var o in output){
        text+= output[o][0].toLocaleString()+" from "+dataDictionary["birthplace"][output[o][1]]+"<br/>"
    }
    
    if (alloutput.length>0){
        formattedText = "born in more than "+alloutput.length+" countries"
    }else{
        formattedText = ""
    }
    
    d3.select("#topics3").html(formattedText)
}


function getData(geoids,data,dataDictionary,zoom,map){
    var filtered = data.filter(function(el){
      //console.log(el)
    if(geoids.indexOf(el["Geo_GEOID"])>-1){
      return true
    }
    })

    var formatted = {}
    var text = ""
    var columnsFromData = Object.keys(data[0])
    var dataDictionaryKeys = Object.keys(dataDictionary)
    // var dataDictionaryKeysBirth = Object.keys(dataDictionaryBirth)

    var randomIndex = Math.round(Math.random()*(columnsFromData.length))
    var w = window.innerWidth;
    var h = window.innerHeight;

    var numberOfGeos = geoids.length
    var totalPopulation = getSum(filtered,"SE_T001_001")
    var totalHouseholds = getSum(filtered,"SE_T017_001")


    var education = getSum(filtered,"SE_T152_008")
    var currentZoom = map.getZoom()
    var geoString = ""
    
    if(currentZoom>=5){
        geoString = numberOfGeos+" Block Groups"
    }else{
        geoString = numberOfGeos+" Tracts"
    }
    d3.select("#count")
        .html("APPROXIMATELY* <br/>"+geoString+"<br/>"
        +totalHouseholds.toLocaleString()
        +" Households"+"<br/>"+totalPopulation.toLocaleString()+" People")
    
    
    var previousPower = d3.select("#power").html()
    var factor = 1
    for(var k =1;k<String(totalPopulation).length;k++){
      factor = factor*10
    }
  
    if(String(totalPopulation).length!=previousPower){
        d3.select("#powerBase").html(Math.round(totalPopulation/factor*100)/100+" &#xd7; 10<br/><span style=\"size:24px\">Americans</span>")
        d3.select("#power").html(String(totalPopulation).length-1)
    }
    
    if(String(totalPopulation).length-1>previousPower && reversing==false){
       
        var point = map._containerDimensions()
        var upoint =  map.unproject(point)
        var uzeros =  map.unproject([0,0])
        var x1 = uzeros.lng
        var y1 = uzeros.lat
        var x2 = upoint.lng
        var y2 = upoint.lat
        var p1 = [x1,y1]
        var p2 = [x2,y1]
        var p3 = [x2,y2]
        var p4 = [x1,y2]

        var layerId = "_power_"+String(String(totalPopulation).length-1)

        map.addLayer({
          'id': "frame"+layerId,
          'type': 'fill',
            'source': {
                "type":"geojson",
                "data":{
                'type': 'Feature',
                'geometry': {
                    'type': 'Polygon',
                    'coordinates': [[p1,p2,p3,p4,p1]]
                }
            }
        },
            'paint': {
                'fill-outline-color':'rgba(255,255,220, 1)',
                'fill-color': 'rgba(200, 100, 240, 0)'
            }
        });
    }    
}

function getTime() {
    var d = new Date();
   // document.getElementById("demo").innerHTML = d.toLocaleTimeString();
    return d
}
function getSum(obj,column) {
  var sum = 0;
  for( var el in obj ) {
    if(obj.hasOwnProperty(el) && isNaN(obj[el][column])!=true) {
        sum += parseFloat( obj[el][column]);
    }
  }
  return sum;
}
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function normalize(string) {
    return string.trim().toLowerCase();
}
function addButtonFly(map){
    document.getElementById('map').addEventListener('click', function() {
          flying = false
    })
    
      document.getElementById('fly').addEventListener('click', function() {
          flying = true
    reversing=false          
      d3.select("#introText").remove()
        map.flyTo({
              center:[-98.35,39],
              zoom: pub.minZoom,
              speed: pub.speed, // make the flying slow
              curve: pub.curve // change the speed at which it zooms out
           
          });
      })
      var isAtStart = true;
    document.getElementById('fly2').addEventListener('click', function() {
          flying = true
        
    reversing=false
      var allLayers = map.getStyle().layers
      var allSources = map.getStyle().sources
  
        for(var l in allLayers){
            var layer = allLayers[l]
            if(layer.id.split("_")[0]=="frame"){
                map.removeLayer(layer.id);            
            }
        }
        for(var s in allSources){
            if(s.split("_")[0]=="frame"){
                map.removeSource(s)
            }
        }
   //   d3.select("#fly2").html("<i class=\"fa fa-play\" style=\"font-size:12spx\"></i>")
     //   isAtStart = !isAtStart;
        d3.select("#nextLocation").html("")
        map.flyTo({
              center:[-98.35,39],
              zoom: pub.maxZoom,
              speed: pub.speed, // make the flying slow
              curve: pub.curve // change the speed at which it zooms out
          });
      });
}
function getFeatures(map,dataDictionary,blockGroup,tract,county){
    
    var zoomLevel = map.getZoom();
  // console.log("get features at zoom "+zoomLevel)
   
    if(zoomLevel>=10){
        var blockgroupGeos = map.queryRenderedFeatures({layers:['blockGroup']});
        if (blockgroupGeos){
            var uBlockGroups = getUniqueFeatures(blockgroupGeos, "AFFGEOID", blockGroup,map)
            return uBlockGroups
        //    d3.select("#count").html(blockgroups.length.toLocaleString()+" Census BLock Groups")    
          //  getData(uBlockGroups,blockGroup,dataDictionary,zoomLevel,map)
        }
    }else if (zoomLevel >=7 && zoomLevel <=10){
        var tractGeos = map.queryRenderedFeatures({layers:['tracts']});
        var uTracts = getUniqueFeatures(tractGeos, "AFFGEOID",tract,map)
        return uTracts
    }else{
        var countyGeos = map.queryRenderedFeatures({layers:['counties']});
        var uCounties = getUniqueFeatures(countyGeos, "AFFGEOID",county,map)
        return uCounties
    }
}

function getUniqueFeatures(array, comparatorProperty, censusData,map) {
    var population = 0
    var households = 0
    
    var countyCats = ["SE_T003_001","SE_T150_002","SE_T150_008","SE_T027_008","SE_T030_002","SE_T037_003","SE_T049_003","SE_T049_004","SE_T049_005","SE_T049_006","SE_T049_007","SE_T049_009","SE_T049_011","SE_T049_012","SE_T053_003","SE_T053_004","SE_T053_006","SE_T056_002","SE_T056_017","SE_T080_002","SE_T108_002","SE_T114_002","SE_T128_003","SE_T128_004","SE_T128_005","SE_T128_006","SE_T129_009","SE_T145_002","SE_T131_002","B07003013","B07003016","B10063002"]
    var tractCats = ["SE_T003_001","SE_T150_002","SE_T150_008","SE_T027_008","SE_T030_002","SE_T037_003","SE_T049_002","SE_T049_003","SE_T049_004","SE_T049_005","SE_T049_006","SE_T049_007","SE_T049_009","SE_T049_011","SE_T049_012","SE_T053_003","SE_T053_004","SE_T053_006","SE_T056_002","SE_T056_017","SE_T080_002","SE_T108_002","SE_T114_002","SE_T128_003","SE_T128_004","SE_T128_005","SE_T128_006","SE_T129_009","SE_T145_002","SE_T131_002","B07003013","B07003016","B10063002"]
    var blockGroupCats = ["SE_T003_001","SE_T150_002","SE_T150_008","SE_T027_008","SE_T030_002","SE_T037_003","SE_T053_003","SE_T053_004","SE_T053_006","SE_T056_002","SE_T056_017","SE_T080_002","SE_T108_002","SE_T128_003","SE_T128_004","SE_T128_005","SE_T128_006","SE_T129_009","SE_T131_002"]

    var zoomLevel = map.getZoom()
    if(zoomLevel>=10){
        var keysInUse= blockGroupCats
    }else if (zoomLevel >=7 && zoomLevel <=10){
        var keysInUse= tractCats
    }else{
        var keysInUse= countyCats
    }
    
    //var keysInUse = Object.keys(keys)
    
  //  var randomIndex = Math.round(Math.random()*(keysInUse.length-1))
   // console.log((timer/timeInterval)%(keysInUse.length-1))
    var randomIndex = Math.round((timer/timeInterval)%(keysInUse.length-1))
    var column = keysInUse[randomIndex]
    var otherStat = 0
//    var totalPopulation = getSum(filtered,"SE_T001_001")
//    var totalHouseholds = getSum(filtered,"SE_T017_001")
    
    var existingFeatureKeys = {};
    var ids = []
    var landArea = 0
    
    var sums = {}
    var uniqueFeatures = array.filter(function(el) {
        if (existingFeatureKeys[el.properties[comparatorProperty]]) {
            return false;
        } else {
            existingFeatureKeys[el.properties[comparatorProperty]] = true;
            var gid = el.properties[comparatorProperty].replace("00000","000")
            ids.push(gid)
            landArea+=el.properties["ALAND"]
            if(censusData[gid]!=undefined){
                population+=parseInt(censusData[gid]["SE_T001_001"])
                //households+=parseInt(censusData[gid]["SE_T017_001"])
                otherStat +=parseInt(censusData[gid][column]) 
                
            }
            return true;
        }
    });
    
    displayCircleStatistic(otherStat,column)
    
  //  displayCornerStatistic(population,households,landArea,ids.length,map)
    displayCenterStatistic(population,map)
 //   console.log("population: "+population+" households: "+households)
    return ids
    return uniqueFeatures
}
function displayCircleStatistic(value,key){        
   // console.log(key)
//    console.log(keys[key])
    if(value ==0){
        d3.selectAll("#topics_"+String(topicIndex%5+1)).html(keys[key][0])
    }else if(value ==1){
        d3.selectAll("#topics_"+String(topicIndex%5+1)).html(value.toLocaleString()+" "+ keys[key][1])
    }else{
        d3.selectAll("#topics_"+String(topicIndex%5+1)).html(value.toLocaleString()+" "+ keys[key][2])
        
    }
}

function displayCornerStatistic(population,households,land,geos,map){
    var zoomLevel = map.getZoom()
    if(zoomLevel>=10){
        geoString = geos+" Block Groups"
    }else if (zoomLevel >=7 && zoomLevel <=10){
        geoString = geos+" Tracts"
    }else{
        geoString = geos+" Counties"
    }
    d3.select("#count")    .style("opacity",1)

        .html("APPROXIMATELY* <br/>"+geoString+"<br/>"
        //+households.toLocaleString()
        //+" Households"+"<br/>"
        +population.toLocaleString()+" People"
        +"<br/> ")
    .transition()
    .delay(3000)
    .duration(3000)
    .style("opacity",0)
    
}
function displayCenterStatistic(totalPopulation,map){
    var previousPower = pub.power
    var factor = 1
    
    for(var k =1;k<String(totalPopulation).length;k++){
      factor = factor*10
    }
  
    if(String(totalPopulation).length!=previousPower){
        d3.select("#powerBase").html(totalPopulation.toLocaleString()+ "<br/> Americans")
        
        //    .html(Math.round(totalPopulation/factor*100)/100
        //    +" &#xd7; 10<br/><span style=\"size:24px\">Americans</span>")
       // d3.select("#power").html(String(totalPopulation).length-1)
    }
    
    if(String(totalPopulation).length-1>previousPower && reversing==false){
       
        var point = map._containerDimensions()
        var upoint =  map.unproject(point)
        var uzeros =  map.unproject([0,0])
        var x1 = uzeros.lng
        var y1 = uzeros.lat
        var x2 = upoint.lng
        var y2 = upoint.lat
        var p1 = [x1,y1]
        var p2 = [x2,y1]
        var p3 = [x2,y2]
        var p4 = [x1,y2]
        
        var layerId = "_power_"+String(String(totalPopulation).length)
        
        var offSetLabel = map.unproject([point[0]+45, -20])
         
        map.addSource('frame_labelsource'+layerId, {
          type: 'geojson',
          data: {
              "type": "FeatureCollection",
              "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:EPSG::4269" } },
              "features": [
                  { "type": "Feature", "geometry": 
                  { "type": "Point", "coordinates": [ offSetLabel.lng,offSetLabel.lat]} }
              ]
          }}
      );      
        map.addLayer({
            "id":"frame_Label"+layerId,
            "type": 'symbol',
            "source":'frame_labelsource'+layerId,
            "layout":{
                'text-field':"power of "+String(String(totalPopulation).length-1),
                 'text-size': 12,
            }, 
            paint: {
          'text-translate-anchor': 'viewport', // up to you to change this -- see the docs
          'text-color': 'rgba(255,255,220, .5)' // whatever you want -- can even be data driven using a `{featureProperty}`,
        }
        })
        map.addLayer({
          'id': "frame_"+layerId,
          'type': 'fill',
            'source': {
                "type":"geojson",
                "data":{
                'type': 'Feature',
                'geometry': {
                    'type': 'Polygon',
                    'coordinates': [[p1,p2,p3,p4,p1]]
                }
            }
        },
            'paint': {
                'fill-outline-color':'rgba(255,255,220, .8)',
                'fill-color': 'rgba(200, 100, 240, 0)'
            }
        });
    }    
    pub.power = String(totalPopulation).length-1
}

function getLocation() {
    if (navigator.geolocation) {
       var position = navigator.geolocation.getCurrentPosition(showPosition);
       return position
   //     var position = navigator.geolocation.getCurrentPosition()
     //   return position
    } else { 
      //  x.innerHTML = "Geolocation is not supported by this browser.";
    }
}
function showPosition(position) {
  currentPosition = position
  console.log(position)
  return position
    // console.log([position.coords.latitude,position.coords.longitude])
}