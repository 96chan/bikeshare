import json
import csv
import datetime
import collections

station_map={}
#create list of objects for javascript
station_id_list=[]
with open("station_data.csv","r") as f:
    reader=csv.reader(f)
    #skip first header row
    reader.next()
    for row in reader:
        station_map[row[0]]=row[1]
        station_id_list.append(row[0])


#create list of times
times_list=[]
for hour in range(24):
    minute=0
    second=0
    for i in range(4):
        times_list.append(str(datetime.time(hour,minute,second)))
        minute+=15

f=open("aggregate_output2.json","r")
aggregate=json.loads(f.read())
f.close()
array=[]
avg_emp_dur_list=[]
tot_inflow=[]
i=0

for time in times_list:
	array.append({"time":time})
	array[i]["stations"]=[]
	j=0
	for station in station_id_list:
		array[i]["stations"].append({
			"station_id": station,
			"station_name": station_map[station],
			"tot_inflow": aggregate[time][station]["tot_inflow"],
			"avg_inflow": aggregate[time][station]["avg_inflow"],
			"tot_outflow": aggregate[time][station]["tot_outflow"],
			"avg_outflow": aggregate[time][station]["avg_outflow"],
			"tot_outflow_stations": [],
			"tot_inflow_stations": [],
			#"empty_occurances_count": aggregate[time][station]["count_emp_occ"],
			"tot_empty_duration": aggregate[time][station]["total_emp_dur"],
			#"avg_empty_duration": aggregate[time][station]["avg_emp_dur"]
			"avg_emp":aggregate[time][station]["avg_emp"],
			"perc_emp":aggregate[time][station]["perc_emp"],
			"score": aggregate[time][station]["score"],
			"rank": aggregate[time][station]["rank"]
			})
		k=0
		for out_station in aggregate[time][station]["tot_outflow_stations"]:
			array[i]["stations"][j]["tot_outflow_stations"].append({"station_id":out_station})
			array[i]["stations"][j]["tot_outflow_stations"][k]["count"]=aggregate[time][station]["tot_outflow_stations"][out_station]
			k+=1
		l=0
		for in_station in aggregate[time][station]["tot_inflow_stations"]:
			array[i]["stations"][j]["tot_inflow_stations"].append({"station_id":in_station})
			array[i]["stations"][j]["tot_inflow_stations"][l]["count"]=aggregate[time][station]["tot_inflow_stations"][in_station]
			l+=1
		j+=1
	i+=1

g=open("array_scores.json","w")
g.write(json.dumps(array,sort_keys=True))
g.close()
