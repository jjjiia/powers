var reversing = false
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
function addMapLayers(map){
      var layout = {
                  "icon-image": "art-gallery-15",
                  "icon-padding": 0,
                  "icon-size": 0,
                  "icon-allow-overlap":true
                  }
                  var zoomLevel = map.getZoom();
                  map.addLayer({
                    'id': 'blockGroup',
                    'type': 'symbol',
                    'maxzoom':22,
                    'minzoom':16,
                      'source': {
                          'type': 'geojson',
                          'data': 'https://raw.githubusercontent.com/jjjiia/powers/master/data_geo/blockGroupCentroids.geojson'
                      },        
                      "layout": layout
                      })
      
                  map.addLayer({
                      'id': 'tract',
                      'type': 'symbol',
                    'maxzoom':16,
                    'minzoom':14,
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
                    map.addLayer({
                        'id': 'state',
                        'type': 'symbol',
                      'maxzoom':6,
                      'minzoom':3,
                        'source': {
                            'type': 'geojson',
                              'data':'https://raw.githubusercontent.com/jjjiia/powers/master/data_geo/state_centroids.geojson'
                        },        
                        "layout": layout
                        })
             
}
function reverse(map,cities){
    reversing=true
  //  map.removeLayer("frame_power_1");
  //  map.removeLayer("frame_power_2");
  //  map.removeLayer("frame_power_3");
  //  map.removeLayer("frame_power_4");
  //  map.removeLayer("frame_power_5");
  //  map.removeLayer("frame_power_6");
  //  map.removeLayer("frame_power_7");
  //  map.removeLayer("frame_power_8");
  //  
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
               zoom: 15,
               speed: .1, // make the flying slow
           });
}

function getFeatures(map,dataDictionary,county_c,state_c,tract_c,blockGroup,tract,county,state){
    
    var zoomLevel = map.getZoom();
   
    if(zoomLevel<22&&zoomLevel>=16){
        var blockgroups = map.queryRenderedFeatures({layers:['blockGroup']});
        if (blockgroups){
          if (blockgroups.length>0){
            var uBlockGroups = getUniqueFeatures(blockgroups, "AFFGEOID")
            d3.select("#count").html(blockgroups.length.toLocaleString()+" Census BLock Groups")    
            getData(uBlockGroups,blockGroup,dataDictionary,zoomLevel,map)
          }
        }
    }else if(zoomLevel<16&&zoomLevel>=14){
        var tracts = map.queryRenderedFeatures({layers:['tract']});
        if (tracts){
            if (tracts.length>0){
                var utracts = getUniqueFeatures(tracts, "AFFGEOID")
                var filterdTracts = tract_c.filter(function(el){
                    if(utracts.indexOf(el["tractid"].replace("15000US","14000US"))>-1){
                        return true
                    }
                })
                var totalBlockgroups = d3.sum(filterdTracts, function(d) {return parseInt(d.blockgroups); });
                d3.select("#count").html(tracts.length.toLocaleString()+" Census Tracts<br/>"+totalBlockgroups.toLocaleString()+" Census Block Groups")
                getData(utracts,tract,dataDictionary,zoomLevel,map)
            }
        }
    }else if(zoomLevel<14&&zoomLevel>=6){
        var counties = map.queryRenderedFeatures({layers:['county']});
        if (counties){
          if (counties.length>0){
              d3.select("#count").html(counties.length+" Counties<br/>")
              var ucounties = getUniqueFeatures(counties, "AFFGEOID")
              var filterdCounties= county_c.filter(function(el){
              if(ucounties.indexOf(el["countyid"].replace("15000US","05000US"))>-1){
                return true
              }
            })
            var totalTracts = d3.sum(filterdCounties, function(d) {return parseInt(d.tracts); });
            var totalBlockgroups = d3.sum(filterdCounties, function(d) {return parseInt(d.blockgroups); });
          d3.select("#count").html(counties.length.toLocaleString()+" Counties<br/>"+totalTracts.toLocaleString()+" Census Tracts<br/>"+totalBlockgroups.toLocaleString()+" Census Block Groups")
              getData(ucounties,county,dataDictionary,zoomLevel,map)
        }}
    }else if(zoomLevel<6&&zoomLevel>=3){
        var states = map.queryRenderedFeatures({layers:['state']});
        if (states){
            if (states.length>0){
                var ustates = getUniqueFeatures(states, "AFFGEOID")
                var filterdStates= state_c.filter(function(el){
                    if(ustates.indexOf(el["stateid"].replace("15000US","04000US"))>-1){
                        return true
                    }
                })
                var totalCounties = d3.sum(filterdStates, function(d) {return parseInt(d.counties);});
                var totalTracts = d3.sum(filterdStates, function(d) {return parseInt(d.tracts); });
                var totalBlockgroups = d3.sum(filterdStates, function(d) {return parseInt(d.blockgroups);});
                d3.select("#count").html(states.length.toLocaleString()+" states<br/>"+totalCounties.toLocaleString()
                +" counties<br/>"+totalTracts.toLocaleString()+" tracts<br/>"+totalBlockgroups.toLocaleString()+" blockgroups")
              getData(ustates,state,dataDictionary,zoomLevel,map)
            }
        }
    }
    
}

function dataDidLoad(error,cities,dataDictionary,blockGroup,tract,county,state,county_c,state_c,tract_c) {  
    var randomIndex = getRandomInt(0, cities.length)
    var currentCity = cities[randomIndex]
    var currentCenter = [currentCity.longitude,currentCity.latitude]
    d3.select("#fly").html("Start from "+currentCity.city+", "+currentCity.state)
    var bounds = [
        [-126.098852, 33.815507], // Southwest coordinates
        [-58.071510, 46.573835]  // Northeast coordinates
    ];
    mapboxgl.accessToken = 'pk.eyJ1IjoiampqaWlhMTIzIiwiYSI6ImNpbDQ0Z2s1OTN1N3R1eWtzNTVrd29lMDIifQ.gSWjNbBSpIFzDXU2X5YCiQ';
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/jjjiia123/cjd9bcmhe14kj2so4ze5y812e',
        center: currentCenter,
        maxZoom: 21,
        minZoom: 3,
        zoom:17
    });
    
    map.on('load', function() {
        addMapLayers(map)
        addMapFeatures(map)
    })
    
    map.on('move', function() {
        var zoomLevel = map.getZoom();
        if(zoomLevel<4){
            reverse(map,cities)
        }
        getFeatures(map,dataDictionary,county_c,state_c,tract_c,blockGroup,tract,county,state)
    });
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
//  console.log(randomIndex)
  var colors = ["#f0c87e","#e1baf6","#96e8a0","#6be8d9","#d4e38b"]
  
  var totalPopulation = getSum(filtered,"SE_T001_001")
  var totalHouseholds = getSum(filtered,"SE_T017_001")
  var previousPower = d3.select("#power").html()
  
    if(String(totalPopulation).length!=previousPower){
        d3.select("#powerBase").html("10<br/><span style=\"size:24px\">Americans</span>")
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
       // map.addSource("framesource_"+layerId,{
       //     type:"geojson",
       //     data: {
       //         'type': 'Feature',
       //         'geometry': {
       //             'type': 'Polygon',
       //             'coordinates': [[p1,p2,p3,p4,p1]]
       //         },
       //         "properties":{
       //             "label":layerId+" people",
       //             
       //         }
       //     }
       // })
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
                'fill-outline-color':'rgba(255,255,220, .5)',
                'fill-color': 'rgba(200, 100, 240, 0)'
            }
        });
       // map.addLayer({
       //     "id": "label"+layerId,
       //     "type": "symbol",
       //     "source": layerId,
       //     "layout": {
       //       "text-field": "{label}",
       //       "text-font": [
       //         "DIN Offc Pro Medium",
       //         "Arial Unicode MS Bold"
       //       ],
       //       "text-size": 12
       //     }
       //   });
    }
    
  var titleText = d3.select("#count").html() 
  d3.select("#count").html("APPROXIMATELY* <br/>"+titleText+"<br/>"+totalHouseholds.toLocaleString()+" Households"+"<br/>"+totalPopulation.toLocaleString()+" People")

    var dictionaryRoots = {
        "T152":"education",
        "T052":"occupation",
        "T139":"birthplace",
        "B24126":"detailed_occupation"
    }
    
   var education = getSum(filtered,"SE_T152_008")
    if(education>0){
        d3.select("#topics").html("<br/>"+education.toLocaleString()+" "+dataDictionary["degree"]["T152_008"])
    }
      var birthPlaceText = getBirthplaceData("birthplace",dataDictionary,filtered)
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
      document.getElementById('fly').addEventListener('click', function() {
    reversing=false          
      d3.select("#fly2").html("go")
      d3.select("#introText").remove()
        map.flyTo({
              center:[-98.35,39],
              zoom: 3,
              speed: .07, // make the flying slow
            //  curve: .3, // change the speed at which it zooms out
           
          });
      })
    var isAtStart = true;
    document.getElementById('fly2').addEventListener('click', function() {
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
              zoom: 3,
              speed: .07, // make the flying slow
              curve: 2, // change the speed at which it zooms out
          });
});
    
}
function getUniqueFeatures(array, comparatorProperty) {
    var existingFeatureKeys = {};
    var ids = []
    // Because features come from tiled vector data, feature geometries may be split
    // or duplicated across tile boundaries and, as a result, features may appear
    // multiple times in query results.
    var uniqueFeatures = array.filter(function(el) {
        if (existingFeatureKeys[el.properties[comparatorProperty]]) {
            return false;
        } else {
            existingFeatureKeys[el.properties[comparatorProperty]] = true;
          ids.push(el.properties[comparatorProperty].replace("00000","000"))
            return true;
        }
    });
//    console.log(ids)
    return ids
    //return uniqueFeatures;
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