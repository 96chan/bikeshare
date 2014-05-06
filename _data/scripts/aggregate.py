#!/usr/bin/env python
import csv
from dateutil import parser
import datetime
import json

#read and map station data
station_map={}
station_id_list=[]
with open("station_data.csv","r") as f:
    reader=csv.reader(f)
    #skip first header row
    reader.next()
    for row in reader:
        station_map[row[0]]=row[1]
        station_id_list.append(row[0])

#build aggregate dictionary with 15 min time intervals as the key
aggregate={}
for hour in range(24):
    minute=0
    second=0
    for i in range(4):
        aggregate[str(datetime.time(hour,minute,second))]={}
        minute+=15

#add stations as keys under time
for time in aggregate:
    for station in station_id_list:
        aggregate[time][station]={}
        aggregate[time][station]["count_emp_occ"]=0
        aggregate[time][station]["total_emp_dur"]=0
        aggregate[time][station]["duration_list"]=[]
        aggregate[time][station]["avg_emp_dur"]=0
        aggregate[time][station]["tot_outflow"]=0
        aggregate[time][station]["tot_inflow"]=0
        aggregate[time][station]["tot_outflow_stations"]={}
        aggregate[time][station]["tot_inflow_stations"]={}
print "finish building aggregate base"

###############populate aggregate with trip_data
print 'entering in trip_data loop'
with open("trip_data.csv","r") as f:
    reader=csv.reader(f)
    #skip first header row
    reader.next()
    #set up counters
    num_weekdays=0.0
    prev_date=""
    i=1

    for row in reader:
        if i in [5,10,100,1000,10000,100000,1000000]:
            print "about",i,"times looped"
        i+=1
        #set up variables
        #creates datetime object
        start_time=parser.parse(row[2])
        date=datetime.date(start_time.year,start_time.month, start_time.day)
        start_min=start_time.minute
        start_hour=start_time.hour
        end_time=parser.parse(row[5])
        end_min=end_time.minute
        end_hour=end_time.hour
        start_terminal=row[4]
        end_terminal=row[7]

        #only aggregate if it is a weekday
        if start_time.weekday()<5:
            #count number of weekdays
            if date!=prev_date:
                num_weekdays+=1
            #label start time according to time interval
            if start_min>=0 and start_min<15:
                start_int=0
            elif start_min>=15 and start_min<30:
                start_int=15
            elif start_min>=30 and start_min<45:
                start_int=30
            else:
                start_int=45
            #label end time according to time interval
            if end_min>=0 and end_min<15:
                end_int=0
            elif end_min>=15 and end_min<30:
                end_int=15
            elif end_min>=30 and end_min<45:
                end_int=30
            else:
                end_int=45
            start_time_key=aggregate[str(datetime.time(start_hour,start_int))]
            end_time_key=aggregate[str(datetime.time(end_hour,end_int))]

            #calculate total inflow sand outflows
            start_time_key[start_terminal]["tot_outflow"]+=1
            end_time_key[end_terminal]["tot_inflow"]+=1

            if start_time_key[start_terminal]["tot_outflow_stations"].has_key(end_terminal):
                start_time_key[start_terminal]["tot_outflow_stations"][end_terminal]+=1
            else:
                start_time_key[start_terminal]["tot_outflow_stations"][end_terminal]=1
            if end_time_key[end_terminal]["tot_inflow_stations"].has_key(start_terminal):
                end_time_key[end_terminal]["tot_inflow_stations"][start_terminal]+=1
            else:
                end_time_key[end_terminal]["tot_inflow_stations"][start_terminal]=1
        #set previous date for the weekday counter
        prev_date=date

#populate aggregate with rebalacing_data.csv
with open("rebalancing_data.csv","r") as f:
    reader=csv.reader(f)
    #skip the first header row
    reader.next()
    prev_row_bikes=""
    prev_date=""
    prev_time_int=""
    print "starting rebalancing loop"
    i=1
    rownum=0
    for row in reader:
        if i in [5,10,100,1000,10000,100000,1000000,2000000,3000000,4000000,5000000,6000000,7000000,8000000,9000000,10000000,11000000,12000000,13000000,14000000,15000000]:
            print "about",i,"times looped"
        i+=1
        rownum+=1
        #define variables
        row_time=parser.parse(row[3])
        row_min=row_time.minute
        row_hour=row_time.hour
        date=datetime.date(row_time.year,row_time.month, row_time.day)
        station_id=row[0]
        row_bikes=int(row[1])

        #label start time according to time interval
        if row_min>=0 and row_min<15:
            start_int=0
        elif row_min>=15 and row_min<30:
            start_int=15
        elif row_min>=30 and row_min<45:
            start_int=30
        else:
            start_int=45
        time_key=aggregate[str(datetime.time(row_hour,start_int))]
        time_int=datetime.time(row_hour,start_int)

        #only aggregate if it is a weekday
        if row_time.weekday()<5:
            if row_bikes==0:
                if prev_row_bikes==0:
                    if time_int==prev_time_int:
                        if date==prev_date:
                            # current list is empty
                            if time_key[station_id]["duration_list"]==[]:
                                time_key[station_id]["duration_list"].append([datetime.time(row_hour,row_min)])
                                prev_date=date
                                prev_time_int=time_int
                            else: #current list is not empty
                                time_key[station_id]["duration_list"][-1].append(datetime.time(row_hour,row_min))
                                prev_date=date
                                prev_time_int=time_int
                        else: #previous row is on different day
                            time_key[station_id]["duration_list"].append([datetime.time(row_hour,row_min)])
                            prev_date=date
                            prev_time_int=time_int
                    else: #prev row was a different time_int
                        time_key[station_id]["duration_list"].append([datetime.time(row_hour,row_min)])
                        prev_date=date
                        prev_time_int=time_int
                else: #previous row is not 0
                    time_key[station_id]["duration_list"].append([datetime.time(row_hour,row_min)])
                    prev_date=date
                    prev_time_int=time_int
        prev_row_bikes=row_bikes

       
#calculate empty occurance count, total empty duration, and average empty duration per row
print "done iterating. starting aggregation"
for time in aggregate:
    for station in aggregate[time]:
        n=0
        for occ in aggregate[time][station]['duration_list']:
            #print "time",time,"station",station,aggregate[time][station]['duration_list']
            #only count empty occurances if the duration is longer than 1 min
            if len(occ)>1:
                aggregate[time][station]["count_emp_occ"]+=1
                diff=occ[-1].minute-occ[0].minute
                aggregate[time][station]["total_emp_dur"]+=diff
            aggregate[time][station]['duration_list'][n]=[str(i) for i in occ]
            n+=1
        #to make sure don't divide by 0
        if aggregate[time][station]["count_emp_occ"]>0:
            #calculate average
            aggregate[time][station]['avg_emp_dur']=round(float(aggregate[time][station]["total_emp_dur"])/aggregate[time][station]["count_emp_occ"],2)
        # if aggregate[time][station]["count_emp_occ"]>0:
        #     print "time",time,"station",station,aggregate[time][station]['duration_list']
        #     print "count",aggregate[time][station]["count_emp_occ"]
        #     print "tot emp duration",aggregate[time][station]["total_emp_dur"]
        #     print "avg",aggregate[time][station]['avg_emp_dur']
        #del aggregate[time][station]['duration_list']

output=open("aggregate_output.json","w")
output.write(json.dumps(aggregate))
output.close()

print "done!!!!!"

