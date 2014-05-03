import json

f=open("aggregate_output2.json","r")
aggregate=json.loads(f.read())
f.close()

station_id_list=['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '16', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '41', '42', '45', '46', '47', '48', '49', '50', '51', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', '70', '71', '72', '73', '74', '75', '76', '77', '80', '82', '83']
station_map={'56': 'Beale at Market', '54': 'Embarcadero at Bryant', '42': 'Davis at Jackson', '50': 'Harry Bridges Plaza (Ferry Building)', '60': 'Embarcadero at Sansome', '61': '2nd at Townsend', '62': '2nd at Folsom', '63': 'Howard at 2nd', '64': '2nd at South Park', '49': 'Spear at Folsom', '66': 'South Van Ness at Market', '67': 'Market at 10th', '68': 'Yerba Buena Center of the Arts (3rd @ Howard)', '69': 'San Francisco Caltrain 2 (330 Townsend)', '80': 'San Jose Government Center', '53': 'Powell Street BART', '24': 'Redwood City Public Library', '25': 'Broadway at Main', '26': 'Redwood City Medical Center', '27': 'Mountain View City Hall', '21': 'Franklin at Maple', '22': 'Redwood City Caltrain Station', '23': 'San Mateo County Center', '46': 'Washington at Kearney', '47': 'Post at Kearney', '82': 'Broadway St at Battery St', '45': 'Commercial at Montgomery', '28': 'Mountain View Caltrain Station', '29': 'San Antonio Caltrain Station', '41': 'Clay at Battery', '3': 'San Jose Civic Center', '2': 'San Jose Diridon Caltrain Station', '5': 'Adobe on Almaden', '4': 'Santa Clara at Almaden', '7': 'Paseo de San Antonio', '6': 'San Pedro Square', '9': 'Japantown', '8': 'San Salvador at 1st', '51': 'Embarcadero at Folsom', '83': 'Mezes Park', '77': 'Market at Sansome', '76': 'Market at 4th', '75': 'Mechanics Plaza (Market at Battery)', '38': 'Park at Olive', '73': 'Grant Avenue at Columbus Avenue', '72': 'Civic Center BART (7th at Market)', '71': 'Powell at Post (Union Square)', '70': 'San Francisco Caltrain (Townsend at 4th)', '58': 'San Francisco City Hall', '11': 'MLK Library', '10': 'San Jose City Hall', '13': 'St James Park', '12': 'SJSU 4th at San Carlos', '59': 'Golden Gate at Polk', '14': 'Arena Green / SAP Center', '16': 'SJSU - San Salvador at 9th', '33': 'Rengstorff Avenue / California Street', '32': 'Castro Street and El Camino Real', '31': 'San Antonio Shopping Center', '30': 'Evelyn Park and Ride', '37': 'Cowper at University', '36': 'California Ave Caltrain Station', '35': 'University and Emerson', '34': 'Palo Alto Caltrain Station', '55': 'Temporary Transbay Terminal (Howard at Beale)', '74': 'Steuart at Market', '48': 'Embarcadero at Vallejo', '57': '5th at Howard', '65': 'Townsend at 7th'}
'''
a=[]

for time in aggregate:
	tot_rides=[]
	for station in aggregate[time]:
		tot_rides.append(aggregate[time][station]["tot_outflow"])
	a.append((
		time,
		"total rides: "+str(sum(tot_rides)),
		"avg rides per day: "+str(sum(tot_rides)/132.0)
		))

a=sorted(a)

for i in a:
	print i
'''
array=[]
i=0
tot_scores=[]
for station_id in station_id_list:
	score_list=[]
	inflow_station_dict={}
	outflow_station_dict={}
	array.append({
		"station_id":station_id,
		"station_name":station_map[station_id],
		})
	tot_inflow=0
	tot_outflow=0
	tot_emp=0	
	for time in aggregate:
		s=aggregate[time][station_id]
		tot_outflow+=s["tot_outflow"]
		tot_inflow+=s["tot_inflow"]
		tot_emp+=s["total_emp_dur"]
		for j in s["tot_inflow_stations"]:
			if inflow_station_dict.has_key(j):
				inflow_station_dict[j]+=s["tot_inflow_stations"][j]	 	
			else:
				inflow_station_dict[j]=s["tot_inflow_stations"][j]
	
		for j in s["tot_outflow_stations"]:
			if outflow_station_dict.has_key(j):
				outflow_station_dict[j]+=s["tot_outflow_stations"][j]	 	
			else:
				outflow_station_dict[j]=s["tot_outflow_stations"][j]
		#if s["avg_outflow"]>=.25:
		score_list.append(s["score"])
	#if len(score_list)>0:
	array[i]["score"]=sum(score_list)/len(score_list)
	tot_scores.append(array[i]["score"])
	#else:
		#array[i]["score"]="NA"
	if array[i]["score"]>=0 and array[i]["score"]<0.0012373836458333335:
		array[i]["rank"]=5
	elif array[i]["score"]>=0.0012373836458333335 and array[i]["score"]<0.004300385312500001:
		array[i]["rank"]=4
	elif array[i]["score"]>=0.004300385312500001 and array[i]["score"]<0.009112359895833333:
		array[i]["rank"]=3
	elif array[i]["score"]>=0.009112359895833333 and array[i]["score"]<0.015410274895833341:
		array[i]["rank"]=2
	elif array[i]["score"]>=0.015410274895833341 and array[i]["score"]<=0.04040574885416666:
		array[i]["rank"]=1
	else:
		array[i]["rank"]="NA"
	array[i]["tot_outflow"]=tot_outflow
	array[i]["tot_inflow"]=tot_inflow	
	array[i]["tot_empty_duration"]=tot_emp
	array[i]["avg_emp"]=tot_emp/132.0
	array[i]["avg_outflow"]=tot_outflow/132.0
	array[i]["avg_inflow"]=tot_inflow/132.0
	array[i]["outflow_stations"]=[]
	array[i]["inflow_stations"]=[]
	for k in outflow_station_dict:
		array[i]["outflow_stations"].append({
			"station_id":k,
			"count":outflow_station_dict[k]
			})	
	for k in inflow_station_dict:
		array[i]["inflow_stations"].append({
			"station_id":k,
			"count":inflow_station_dict[k]
			})
	print station_map[station_id],"rank",array[i]["rank"] 
	i+=1

f=open("station_aggregate.json","w")
f.write(json.dumps(array,sort_keys=True))
f.close()


		

