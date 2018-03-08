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

#open institutions
#open geojson areas
#for each area, loop through each institution
#if in area, add to array
#print out area id, length of institutions list, maybe actual list
#shape({ "type" : "GeometryCollection", "geometries" : [ { "type" : "MultiPolygon", "coordinates" : [ [ [ [ -176.392059198913, -44.2871679740063 ], [ -4.2871117706912 ], [ -176.393615889469, -44.2873486730876 ] ], [ [ -176.393615889469, -44.2873486730876 ], [ -176.393639694824, -44.2875105944256 ] ] ] } ] })

def filterData(geo,category):
    formatted={}
    infile = geo+"_"+category

    with open("data_census/"+category+"_keys.json") as c:
        keysInUse = json.load(c)
        #print keysInUse
        keyCodes = keysInUse.keys()
        #print keyCodes
        
    with open("data_census/"+infile+"_filtered.csv","a")as out:
        csvWriter = csv.writer(out)
        count = 0
        with open("data_census/"+infile+".csv","Ur") as sefile:
            csvReader = csv.reader(sefile)
            geoDictionary={}
            for r in csvReader:
                header = r
                break
            for row in csvReader:
                count+=1
                if count%1000==0:
                    print count
                #print row
                #print header
                geoid = row[0]
                #print geoid
                geoDictionary[geoid]={}
                entry=[]
                formattedHeader=["geoid"]
                entry.append(geoid)
                for h in header:
                    formattedH = h.replace("ACS16_5yr_","").replace("SE_T","T")
                    if formattedH in keyCodes:
                        if count ==1:
                            formattedHeader.append(formattedH)
                        formattedHeader.append(formattedH)
                        hIndex = header.index(h)
                        geoDictionary[geoid][h]=row[hIndex]
                        entry.append(row[hIndex])
                if count==1:
                    csvWriter.writerow(formattedHeader)
                csvWriter.writerow(entry)
            print formattedHeader
##            with open(infile+"filtered.json","w") as out:
##                json.dump(geoDictionary,out)
##                #print geoDictionary
geos = ["state","county","tract","blockgroup"]   
category = ["income","women","language"] 
for g in geos:
    for c in category:
        print g+"_"+c
        filterData(g,c)