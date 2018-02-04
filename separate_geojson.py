from functools import partial
import random
import pprint
import pylab
import csv
import math
import json
from math import radians, cos, sin, asin, sqrt
from shapely.geometry import *
from shapely.ops import cascaded_union
from operator import itemgetter
import time

statue = [-74.044502, 40.689247]
statueElevation = 10 #ft
statueHeight = 151
sHeight = statueHeight+statueElevation

root = "data/"

#last step: make new geojson file with visible buildings only

#{u'geometry': {u'type': u'Point', u'coordinates': [-155.47203500031497, 19.199857000100508]}, u'type': u'Feature', u'properties': {u'NAME': u'Kau Hospital', u'TEXTLENGTH': 12, u'FEATTYPE': u'Hospital/Polyclinic', u'STCTYFIPS': u'15001', u'MNFC': 7321, u'FCC': u'D31'}}
        
def makeTypeDictionary():

    with open("us_institutions.geojson") as c:
        institutions = json.load(c)

        print institutions.keys()
        
        typeDictionary = {}
        for i in institutions["features"]:
#            print i.keys()
            instType = i["properties"]["FEATTYPE"]
           # print instType
            if instType in typeDictionary.keys():
                
                typeDictionary[instType]+=1
            else:
                typeDictionary[instType]=1
        print typeDictionary
        return typeDictionary
        
    
def makeNewGeojson():
    types = makeTypeDictionary()
   # return
    featuresByType = {}
    for t in types.keys():
        featuresByType[t]=[]
   
    print featuresByType
   
    with open("us_institutions.geojson") as c:
        institutions = json.load(c)
        newBase = {'crs':institutions['crs'],'type':institutions['type']}
        
        
        for i in institutions["features"]:
#            print i.keys()
            instType = i["properties"]["FEATTYPE"]
            featuresByType[instType].append(i)

    print featuresByType.keys()
    
    for t in types.keys():
        print t
        newBase["features"]=featuresByType[t]
        fileName = t.replace("/","_").replace(" ","")+".json"
        print fileName
        with open(fileName,"w") as out:
            json.dump(newBase,out)
      
makeNewGeojson()