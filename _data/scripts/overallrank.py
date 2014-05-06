##calculates average inflow and outflow, avg emptiness and percent emptiness, and score

import json
import csv
import datetime
import collections

station_map={}
#create list of objects for javascript
station_object=[]
station_id_list=[]
with open("station_data.csv","r") as f:
    reader=csv.reader(f)
    #skip first header row
    reader.next()
    for row in reader:
        station_map[row[0]]=row[1]
        station_id_list.append(row[0])
        station_object.append({
        	"station_id":row[0],
        	"station_name":row[1],
        	"lat":row[2],
        	"long":row[3],
        	"dockcount":row[4],
        	"region":row[5],
        	"installation_date":row[6]
        	})
'''
#print station_object

#create list of times
times_list=[]
for hour in range(24):
    minute=0
    second=0
    for i in range(4):
        times_list.append(str(datetime.time(hour,minute,second)))
        minute+=15
'''
#debugging + add avg inflow and outflow
f=open("aggregate_output2.json","r")
aggregate=json.loads(f.read())
f.close()

total=[]
score=[]
avg_outflow=[]

for time in aggregate:
	for station in aggregate[time]:
		s=aggregate[time][station]
		#add avg inflow and outflow
		s["avg_inflow"]=round(aggregate[time][station]["tot_inflow"]/132.0,4)
		s["avg_outflow"]=round(aggregate[time][station]["tot_outflow"]/132.0,4)
		s["avg_emp"]=round(aggregate[time][station]["total_emp_dur"]/132.0,4)
		s["perc_emp"]=round(aggregate[time][station]["avg_emp"]/15,4)
		s["score"]=s["avg_outflow"]*s["perc_emp"]
		#compute scoring rank, only considering those with avg trips over .25 a day
		if s["avg_outflow"]>=.25:
			if s["score"]>=0 and s["score"]<0.0172368:
				s["rank"]=5
			elif s["score"]>=0.0172368 and s["score"]<0.06214012:
				s["rank"]=4
			elif s["score"]>=0.06214012 and s["score"]<.17354999999:
				s["rank"]=3
			elif s["score"]>=.17354999999 and s["score"]<0.36635085:
				s["rank"]=2
			elif s["score"]>=0.36635085 and s["score"]<=0.6977672:
				s["rank"]=1
		else:
			s["rank"]="NA"

		if s.has_key("perc_empty"):
			del aggregate[time][station]["perc_empty"]
		del s["count_emp_occ"]
		del s["avg_emp_dur"]
		del s["duration_list"]

		#debug
		if s["avg_outflow"]>=.25:
			score.append(s["avg_outflow"]*s["perc_emp"])
			avg_outflow.append(s["avg_outflow"])
			total.append((
				s["score"],
				s["rank"],
				station_map[station],
				time,
				str(aggregate[time][station]["avg_emp"])+" min",
				str(aggregate[time][station]["perc_emp"])+"%",
				str(aggregate[time][station]["avg_outflow"])+" trips"
				))

#print aggregate["07:45:00"]["73"]
#print sorted(score,reverse=True)

total=sorted(total,reverse=True)
avg_outflow=sorted(avg_outflow,reverse=True)
print avg_outflow
'''
g=open("debug.txt","w")
g.write(str(sorted(total,reverse=True)))
g.close()

f=open("aggregate_output2.json","w")
f.write(json.dumps(aggregate,sort_keys=True))
f.close()
'''