import json

f=open("../station_data_with_scores.json","r")
data=json.loads(f.read())
f.close()

for row in data:
	if row['rank']==5:
		row["rank"]=1
	elif row["rank"]==4:
		row["rank"]=2
	elif row["rank"]==2:
		row["rank"]=4
	elif row["rank"]==1:
		row["rank"]=5

f=open("station_data_switchedranks.json","w")
f.write(json.dumps(data,sort_keys=True))
f.close()