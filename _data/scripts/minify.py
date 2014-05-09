#minify data_bytime.json 
import json
import datetime

station_id_list=['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '16', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '41', '42', '45', '46', '47', '48', '49', '50', '51', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', '70', '71', '72', '73', '74', '75', '76', '77', '80', '82', '83']
station_map={'56': 'Beale at Market', '54': 'Embarcadero at Bryant', '42': 'Davis at Jackson', '50': 'Harry Bridges Plaza (Ferry Building)', '60': 'Embarcadero at Sansome', '61': '2nd at Townsend', '62': '2nd at Folsom', '63': 'Howard at 2nd', '64': '2nd at South Park', '49': 'Spear at Folsom', '66': 'South Van Ness at Market', '67': 'Market at 10th', '68': 'Yerba Buena Center of the Arts (3rd @ Howard)', '69': 'San Francisco Caltrain 2 (330 Townsend)', '80': 'San Jose Government Center', '53': 'Powell Street BART', '24': 'Redwood City Public Library', '25': 'Broadway at Main', '26': 'Redwood City Medical Center', '27': 'Mountain View City Hall', '21': 'Franklin at Maple', '22': 'Redwood City Caltrain Station', '23': 'San Mateo County Center', '46': 'Washington at Kearney', '47': 'Post at Kearney', '82': 'Broadway St at Battery St', '45': 'Commercial at Montgomery', '28': 'Mountain View Caltrain Station', '29': 'San Antonio Caltrain Station', '41': 'Clay at Battery', '3': 'San Jose Civic Center', '2': 'San Jose Diridon Caltrain Station', '5': 'Adobe on Almaden', '4': 'Santa Clara at Almaden', '7': 'Paseo de San Antonio', '6': 'San Pedro Square', '9': 'Japantown', '8': 'San Salvador at 1st', '51': 'Embarcadero at Folsom', '83': 'Mezes Park', '77': 'Market at Sansome', '76': 'Market at 4th', '75': 'Mechanics Plaza (Market at Battery)', '38': 'Park at Olive', '73': 'Grant Avenue at Columbus Avenue', '72': 'Civic Center BART (7th at Market)', '71': 'Powell at Post (Union Square)', '70': 'San Francisco Caltrain (Townsend at 4th)', '58': 'San Francisco City Hall', '11': 'MLK Library', '10': 'San Jose City Hall', '13': 'St James Park', '12': 'SJSU 4th at San Carlos', '59': 'Golden Gate at Polk', '14': 'Arena Green / SAP Center', '16': 'SJSU - San Salvador at 9th', '33': 'Rengstorff Avenue / California Street', '32': 'Castro Street and El Camino Real', '31': 'San Antonio Shopping Center', '30': 'Evelyn Park and Ride', '37': 'Cowper at University', '36': 'California Ave Caltrain Station', '35': 'University and Emerson', '34': 'Palo Alto Caltrain Station', '55': 'Temporary Transbay Terminal (Howard at Beale)', '74': 'Steuart at Market', '48': 'Embarcadero at Vallejo', '57': '5th at Howard', '65': 'Townsend at 7th'}

times_list=[]
for hour in range(24):
    minute=0
    second=0
    for i in range(4):
        times_list.append(str(datetime.time(hour,minute,second)))
        minute+=15

f=open("../data_bytime.json","r")
data=json.loads(f.read())
f.close()

array=[]

i=0
for time in times_list:
	array.append({"t":time,"s":[]})
	j=0
	for station in station_id_list:
		array[i]["s"].append({
			"sid": station,
			"AO": data[i]['stations'][j]["avg_outflow"],
			"TOS": [],
			"AE": data[i]['stations'][j]["avg_emp"],
			"s": data[i]['stations'][j]["score"],
			"r": data[i]['stations'][j]["rank"]
			})
		for k in range(len(data[i]['stations'][j]["tot_outflow_stations"])):
			array[i]["s"][j]["TOS"].append({"sid":data[i]['stations'][j]["tot_outflow_stations"][k]['station_id'],
				'c': data[i]['stations'][j]["tot_outflow_stations"][k]['count']
				})
		j+=1
	i+=1

f=open("data_bytime_min2.json","w")
f.write(json.dumps(array,sort_keys=True))
f.close()