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
   
#['15000US010010201001', '745', '284']
#['14000US01001020100', '2010', '740']
#['05000US01001', 'Autauga County, Alabama', '55049', '20800']
#['04000US01', 'Alabama', '4841164', '1851061']

def getIds():
    states = {}#{"counties":[],"tracts":[],"blockgroups":[]}
    counties = {}#{"tracts":[],"blockgroups":[]}
    tracts = {}#{"blockgroups":[]}
    
    with open("R11573760_SL150.csv","Ur") as c:
        csvReader = csv.reader(c)
        csvReader.next()
        for row in csvReader:
            blockgroup = row[0]
            tract = row[0][0:18]
            county = row[0][0:12]
            state = row[0][0:9]
            
            if state in states.keys():
                if county not in states[state]["counties"]:
                    states[state]["counties"].append(county)
                if tract not in states[state]["tracts"]:
                    states[state]["tracts"].append(tract)
                if blockgroup not in states[state]["blockgroups"]:
                    states[state]["blockgroups"].append(blockgroup)
            else:
                states[state]={"counties":[],"tracts":[],"blockgroups":[]}
            
            if county in counties.keys():
                if tract not in counties[county]["tracts"]:
                    counties[county]["tracts"].append(tract)
                if blockgroup not in counties[county]["blockgroups"]:
                    counties[county]["blockgroups"].append(blockgroup)
            else:
                counties[county]={"tracts":[],"blockgroups":[]}
            
            if tract in tracts.keys():
                if blockgroup not in tracts[tract]["blockgroups"]:
                    tracts[tract]["blockgroups"].append(blockgroup)
            else:
                tracts[tract]={"blockgroups":[]}
                
    print "made count files"
    counts = {}
    
    with open("geoid_counts/states_counts.csv","a") as out:
        csvWriter = csv.writer(out)
        csvWriter.writerow(["stateid","blockgroups","tracts","counties"])
        print "making states file"
        for s in states:
            csvWriter.writerow([s,len(states[s]["blockgroups"]),len(states[s]["tracts"]),len(states[s]["counties"])])

    with open("geoid_counts/county_counts.csv","a") as out:
        csvWriter = csv.writer(out)
        csvWriter.writerow(["countyid","blockgroups","tracts"])
        print "making county file"
        for c in counties:
            csvWriter.writerow([c,len(counties[c]["blockgroups"]),len(counties[c]["tracts"])])
            
    with open("geoid_counts/tracts_counts.csv","a") as out:
        csvWriter = csv.writer(out)
        csvWriter.writerow(["countyid","blockgroups"])
        print "making tracts file"
        for t in tracts:
            csvWriter.writerow([t,len(tracts[t]["blockgroups"])])           
                #counts[s]={"blockgroups":len(state[c]["blockgroups"]),"tracts":len(state[c]["tracts"]),"counties":len(state[c]["counties"])}
                #print counts

getIds()