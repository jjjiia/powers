//TRY NOT CENTROIDS METHOD
//ADD NUMBER TO POWERS
//ADD 3 more STATS in a fade in fade out

var reversing = false
var flying = false
var keys =null
var topicIndex = 1
var timer = 0
var pub = {
    speed:.1,
    curve:1,
    startZoom:22,
    minZoom:4.01,
    maxZoom:20
}
$(function() {
  	queue()
      .defer(d3.json,"cities.json")
      .defer(d3.json,"data_census/keys_women_language_income_filtered.json")
     // .defer(d3.json,"dictionary_birth.json")
      .defer(d3.csv,"data_census/blockGroup.csv")
      .defer(d3.csv,"data_census/tract.csv")
      .defer(d3.csv,"data_census/county.csv")
      .defer(d3.csv,"data_census/state.csv")
      .defer(d3.csv,"data_geocounts/county_counts.csv")
      .defer(d3.csv,"data_geocounts/states_counts.csv")
      .defer(d3.csv,"data_geocounts/tracts_counts.csv")
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

function dataDidLoad(error,cities,dataDictionary,blockGroup,tract,county,state,county_c,state_c,tract_c) {  
    var randomIndex = getRandomInt(0, cities.length)
    var currentCity = cities[randomIndex]
    var currentCenter = [currentCity.longitude,currentCity.latitude]
    d3.select("#fly").html("Start from "+currentCity.city+", "+currentCity.state)
    
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
    map.on('load', function() {
       // addMapLayers(map)
        addMapFeatures(map)
        console.log(map.getStyle().layers)
     //   var zoomLevel = map.getZoom();
     //   var interval = setInterval(function(){
//   //       getData(geoids[0],blockGroup,dataDictionary,zoomLevel,map)                
     //      timer+=1
     //       
     //      // map.on("moveend",function(){
     //      //   //  console.log("move end")
     //      //     console.log("move end")
     //      //     clearInterval(interval);
     //      //     reverse(map,cities)
     //      //     return
     //      // })                
     //   }, 1000);
    })
    map.on("drag",function(){
            d3.selectAll("#topics_"+String(topicIndex%5+1)).transition().duration(1000).style("opacity",1)
            d3.selectAll("#topics_"+String(topicIndex%5+1)).transition().delay(2000).duration(1000).style("opacity",0)
            topicIndex+=1
        var geoids = getFeatures(map,dataDictionary,blockGroupDataById,tractDataById,countyDataById)
    })
    map.on("move",function(){
           timer+=1
        
        if(flying==true){
            if(timer%100==5){
               // d3.selectAll(".topics").transition().duration(1000).style("opacity",0)
                d3.selectAll("#topics_"+String(topicIndex%5+1)).transition().duration(1000).style("opacity",1)
                d3.selectAll("#topics_"+String(topicIndex%5+1)).transition().delay(2000).duration(1000).style("opacity",0)
                topicIndex+=1
                var geoids = getFeatures(map,dataDictionary,blockGroupDataById,tractDataById,countyDataById)
            }
        }else{
                d3.selectAll("#topics_"+String(topicIndex%5+1)).transition().duration(1000).style("opacity",1)
                d3.selectAll("#topics_"+String(topicIndex%5+1)).transition().delay(2000).duration(1000).style("opacity",0)
                topicIndex+=1
                var geoids = getFeatures(map,dataDictionary,blockGroupDataById,tractDataById,countyDataById)
        }
      //  console.log("start move")
        
       
    })
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
function addMapLayers(map){
      var layout = {
                  "icon-image": "art-gallery-15",
                  "icon-padding": 0,
                  "icon-size": 0,
                  "icon-allow-overlap":true
                  }
        //          var zoomLevel = map.getZoom();
        //          map.addLayer({
        //            'id': 'blockGroup',
        //            'type': 'symbol',
        //            'maxzoom':22,
        //            'minzoom':16,
        //              'source': {
        //                  'type': 'geojson',
        //                  'data': 'https://raw.githubusercontent.com/jjjiia/powers/master/data_geo/blockGroupCentroids.geojson'
        //              },        
        //              "layout": layout
        //              })
      
                  map.addLayer({
                      'id': 'tract',
                      'type': 'symbol',
                    'maxzoom':10,
                    'minzoom':4,
                      'source': {
                          'type': 'geojson',
                          'data': 'https://raw.githubusercontent.com/jjjiia/powers/master/data_geo/tract_centroids.geojson'
                      },        
                      "layout": layout
                      })
            
                    map.addLayer({
                        'id': 'county',
                        'type': 'symbol',
                      'maxzoom':14,
                      'minzoom':6,
                        'source': {
                            'type': 'geojson',
                              'data':'https://raw.githubusercontent.com/jjjiia/powers/master/data_geo/county_centroids.geojson'
                        },        
                        "layout": layout
                        })
                    //map.addLayer({
                    //    'id': 'state',
                    //    'type': 'symbol',
                    //  'maxzoom':6,
                    //  'minzoom':3,
                    //    'source': {
                    //        'type': 'geojson',
                    //          'data':'https://raw.githubusercontent.com/jjjiia/powers/master/data_geo/state_centroids.geojson'
                    //    },        
                    //    "layout": layout
                    //    })
             
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
      d3.select("#fly2").html("go")
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
    
    var keysInUse = ["T052_007","T052_005","T052_011","T152_008","T052_008","T052_012"]
    
    var randomIndex = Math.round(Math.random()*(keysInUse.length-1))
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
                households+=parseInt(censusData[gid]["SE_T017_001"])
                
                otherStat +=parseInt(censusData[gid]["SE_"+column]) 
                
            }
            return true;
        }
    });
    
    displayCircleStatistic(otherStat,column)
    
    displayCornerStatistic(population,households,landArea,ids.length,map)
    displayCenterStatistic(population,map)
 //   console.log("population: "+population+" households: "+households)
    return ids
    return uniqueFeatures
}
function displayCircleStatistic(value,key){

    var cats = {
        T152_008:"women with doctorate degrees",
        T052_005:"women working in Protective Service",
        T052_007:"women working in Building and Grounds Cleaning and Maintenance",
        T052_008:"women working in Personal Care and Service",
        T052_011:"women working in Farming, Fishing, and Forestry",
        T052_012:"women working in Construction, Extraction, and Maintenance"}
        
    d3.selectAll("#topics_"+String(topicIndex%5+1)).html(value.toLocaleString()+" "+ cats[key])
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
    d3.select("#count")
        .html("APPROXIMATELY* <br/>"+geoString+"<br/>"
        +households.toLocaleString()
        +" Households"+"<br/>"+population.toLocaleString()+" People"
        +"<br/> ")
    
}
function displayCenterStatistic(totalPopulation,map){
    var previousPower = d3.select("#power").html()
    var factor = 1
    
    for(var k =1;k<String(totalPopulation).length;k++){
      factor = factor*10
    }
  
    if(String(totalPopulation).length!=previousPower){
        d3.select("#powerBase")
            .html(Math.round(totalPopulation/factor*100)/100
            +" &#xd7; 10<br/><span style=\"size:24px\">Americans</span>")
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
                'fill-outline-color':'rgba(255,255,220, .4)',
                'fill-color': 'rgba(200, 100, 240, 0)'
            }
        });
    }    
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