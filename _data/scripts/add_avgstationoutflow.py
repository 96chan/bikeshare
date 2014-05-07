#add scores and rank to station_data.json
import json

f=open("../station_aggregate.json","r")
data=json.loads(f.read())
f.close()

for row in data:
	for i in range(len(row['inflow_stations'])):
		row['inflow_stations'][i]['avg_count']=row['inflow_stations'][i]['count']/132.0


o=open("station_aggregate2.json","w")
o.write(json.dumps(data,sort_keys=True))
o.close()