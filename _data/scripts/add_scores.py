#add scores and rank to station_data.json
import json

f=open("station_data.json","r")
station_data=json.loads(f.read())
f.close()

f=open("totalscore.json","r")
totalscore=json.loads(f.read())
f.close()

i=0
for row in station_data:
	if row["station_id"]==totalscore[i]["station_id"]:
		row["score"]=totalscore[i]["score"]
		row["rank"]=totalscore[i]["rank"]
	i+=1
	
o=open("station_data_with_scores.json","w")
o.write(json.dumps(station_data,sort_keys=True))
o.close()