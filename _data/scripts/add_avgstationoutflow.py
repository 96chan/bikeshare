#add total and avg outflow to station_data.json
import json

f=open("../station_data_with_scores.json","r")
data=json.loads(f.read())
f.close()

f=open("../station_aggregate.json","r")
station_aggregate=json.loads(f.read())
f.close()

tot_outflow_list=[]
avg_outflow_list=[]

for i in range(len(station_aggregate)):
	data[i]["tot_outflow"]=station_aggregate[i]["tot_outflow"]
	data[i]["avg_outflow"]=station_aggregate[i]["avg_outflow"]
	tot_outflow_list.append(station_aggregate[i]["tot_outflow"])
	avg_outflow_list.append(station_aggregate[i]["avg_outflow"])

print "total outflow"
print sorted(tot_outflow_list)
print "avg outflow"
print sorted(avg_outflow_list)

# o=open("station_data_with_outflow.json","w")
# o.write(json.dumps(data,sort_keys=True))
# o.close()