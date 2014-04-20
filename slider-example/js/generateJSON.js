/*
Primary Data Structures
One set of JSON arrays per time period (month). Each array stored in a separate .json file that we will load via $.GET and json.parse

Array of Photo objects (allPhotos):
{
	// the following variables are from the interestingness.getList call
	id: 12345,
	farm: 5,
	server: 4444,
	secret: 'e3d64kdk3',
	title: 'sunset at the bridge'
	tags: ["tag1","tag2","tag3"]
	tagcount: 3

	// the following variables are from the getExif call
	// in my experience, make and model are inconsistent, perhaps to different file structures? i dunno. probably better to rely on the camera string than make+model
	camera: "Canon 5D",
	make: "Canon",
	model: "5D",
}

Array of tags (allTags):
{
	tag: 'bridge',
	count: 193,
	photoIDs: [1234, 3841, 374, 173, 42853]
}

Array of Camera objects (allCameras):
{
	camera: "Canon 5D",
	make: "Canon",
	model: "5D",
	count: 48,
	photoIDs: [19481, 17263, 18723, 123, 44]
}
*/

var allPhotos = [];
var allTags = [];
var allCameras = [];
var ajaxConnections = 0;
var photosPerDay = 50; // set to 50 for final data? 50*30 = ~1500 per month for a good sample size.
var totalAjax = 0;
var apikey = '803b4fba97fed821c7d451d31da3c60f';

// dan's auth info
// var apikey = '844ff70b5e025eac452ff98c661b7295';
// var secret = '821ad3df37bd73f5';

// FlickrPhoto object constructor. Doesn't have the camera/make/model, which are added later
function FlickrPhoto(id, farm, server, secret, title, tags) {
	this.id = id;
	this.farm = farm;
	this.server = server;
	this.secret = secret;
	this.title = title;
	this.tags = tags;
	this.tagcount = tags.length;
	this.camera = null;
	this.model = null;
	this.make = null;
}

// tag object constructor (used in allTags)
function FlickrTag(tag, count, photoid) {
	this.tag = tag;
	this.count = count;
	this.photoIDs = [photoid];
}

// camera object constructor (used in allCameras)
function FlickrCamera(cameraString, make, model, count, photoid) {
	this.camera = cameraString;
	this.make = make;
	this.model = model;
	this.count = count;
	this.photoIDs = [photoid];
}

$(document).ready(function(){
    // Add tags that a user types in
    $("#getInterestingnessPhotos").click(function(){
        var startdate= $("#startdatepicker").val();
        var thisDate;

        for(var day = 1 ; day <= 31 ; ++day) {
        	// build date string (yyyy-mm-dd)
			// get list of interesting photos for all dates that are valid within yyyy-mm-dd from 01-31
			// (ie, not all months have 01-31, don't waste API calls for 2013-02-29 through 2013-02-31
        	thisDate = startdate + '-' + zeroPad(day,2);
	        if(isValidDate2(thisDate)) {
		        ajaxConnections++;
				$.getJSON('http://api.flickr.com/services/rest/?method=flickr.interestingness.getList&api_key=' + apikey + '&date=' + thisDate + '&extras=tags&per_page=' + photosPerDay + '&format=json&jsoncallback=?',
				function (data) { 
					ajaxConnections--;

					if(data.stat == 'fail') {
						// some sort of error.
						console.log("interestingness.getList error " + data.code + ": " + data.message);
					} else {
						$.each(data.photos.photo, function(key,value){
			                var tagString=value.tags.trim();
			                var tagArray = tagString.split(' ');

			                // add photos and tags into the allPhotos array
			                allPhotos.push(new FlickrPhoto(value.id, value.farm, value.server, value.secret, value.title, tagArray));

			                // if tag doesn't exist in allTags, add it. if it exists, add photoID to photo list
			                addPhotoTag(tagArray, value.id);

							//get camera info for each photo
			                ajaxConnections++;
			                console.log("getting exif for " + value.id);
							console.log("ajaxConnections: " + ajaxConnections);
							getExif(value);

			            });
					} // end error check
				})
				.fail(function() {
					console.log("flickr.interestingness.getList fail");
					--ajaxConnections;
				});
			}
		}
    });
});

// given a photo object, get the EXIF and add it to the appropriate arrays. Once the EXIF gathering is done, output the JSON
function getExif(photoObj) {
	$.getJSON('http://api.flickr.com/services/rest/?method=flickr.photos.getExif&api_key=' + apikey + '&photo_id=' + photoObj.id + '&format=json&jsoncallback=?',
	function(data) {
		ajaxConnections--;
		console.log("ajaxConnections: " + ajaxConnections);

        var cameraMake, cameraModel;

		if(data.stat == 'fail') {
			// some sort of error. if everything is set up correctly, probably permissions, or EXIF is not available.
			console.log("getExif error " + data.code + ": " + data.message + ". Photo ID " + photoObj.id);
		} else {
			console.log("EXIF worked for " + photoObj.id);
			if(data.photo.camera) {
				// camera exists
				console.log(photoObj.id + " camera: " + data.photo.camera);
			} else {
				console.log("no camera string");
			}

			for(var i=0,j=data.photo.exif.length ; i < j ; ++i) {
				// check if this exif item is make or model. the case may be different depending on camera... depending on how much variation we have in capitalization, we may have to save a different "normalized" name for binning, and a separate "display" name
				if(data.photo.exif[i].label.toLowerCase() === 'make') {
					console.log(photoObj.id + " make: " + data.photo.exif[i].raw._content);
					cameraMake = data.photo.exif[i].raw._content;
				} else if(data.photo.exif[i].label.toLowerCase() === 'model') {
					console.log(photoObj.id + " model: " + data.photo.exif[i].raw._content);
					cameraModel = data.photo.exif[i].raw._content;
				}
			}

			// add cameras into the allCameras array. Also update the allPhotos array with camera information
			if(data.photo.camera) {
				addCameraToPhotos(photoObj.id, data.photo.camera, cameraMake, cameraModel);
			}

			if(ajaxConnections==0) {
				// finished with all requests, sort, stringify and update the textareas
				allPhotos.sort(function(a,b) { return parseInt(b.tagcount) - parseInt(a.tagcount) } );
				allTags.sort(function(a,b) { return parseInt(b.count) - parseInt(a.count) } );
				allCameras.sort(function(a,b) { return parseInt(b.count) - parseInt(a.count) } );
		        var chosenMonth = $("#startdatepicker").val();
				$("#allPhotosLabel").text(chosenMonth + "photos.json");
				$("#allTagsLabel").text(chosenMonth + "tags.json");
				$("#allCamerasLabel").text(chosenMonth + "cameras.json");
				$("#allPhotosResult").text(JSON.stringify(allPhotos, null, " "));
				$("#allTagsResult").text(JSON.stringify(allTags, null, " "));
				$("#allCamerasResult").text(JSON.stringify(allCameras, null, " "));
			}
		}
	})
	.fail(function() {
		console.log("flickr.photos.getExif fail for " + photoObj.id);
		--ajaxConnections;
	});
}

// if tag doesn't exist in allTags, add it
// if it exists, add photoID to photo list
function addPhotoTag(tagArray, photoid) {
	for(var i=0, j=tagArray.length ; i<j ; ++i) {
		var found = 0;
		for(var k=0, m=allTags.length ; k<m ; ++k) {
			if(allTags[k].tag == tagArray[i]) {
				// found it!
				allTags[k].count++;
				allTags[k].photoIDs.push(photoid);
				found = 1;
			}
			else if (k == (m-1) && found == 0) {
				// it's not in allTags (ie, it is not found, and we reached the last tag in allTags)
				allTags.push(new FlickrTag(tagArray[i],1,photoid));
			}
		}
		if(allTags.length == 0) {
			// edge case -- nothing in allTags yet
			allTags.push(new FlickrTag(tagArray[i],1,photoid));
		}
	}
}

// add camera to allPhotos and allCameras
function addCameraToPhotos(photoid, cameraString, make, model) {
	// add to allPhotos. photoid should already exist from interestingness.getInfo
	for(var i=0, j=allPhotos.length; i < j ; ++i) {
		if(allPhotos[i].id == photoid) {
			allPhotos[i].camera = cameraString;
			allPhotos[i].make = make;
			allPhotos[i].model = model;
		}
	}

	var found = 0;
	// if camera doesn't exist in allCameras, add it. if it exists, add photoID to photo list
	for(var i=0, j=allCameras.length ; i<j ; ++i) {
		if(allCameras[i].camera == cameraString) {
			// found it!
			allCameras[i].photoIDs.push(photoid);
			allCameras[i].count++;
			found = 1;
		} else if(i == (j-1) && found == 0) {
			// it's not in allCamera (ie, it is not found, and we reached the last camera in array allCameras
			allCameras.push(new FlickrCamera(cameraString, make, model, 1, photoid));
		}
	}
	if(allCameras.length == 0) {
		// edge case -- nothing in allCameras yet
		allCameras.push(new FlickrCamera(cameraString, make, model, 1, photoid));
	}
}

// check if date string is a valid date
function isValidDate2(s) {
	var bits = s.split('-');
	var y = bits[0], m  = bits[1], d = bits[2];
	// Assume not leap year by default (note zero index for Jan)
	var daysInMonth = [31,28,31,30,31,30,31,31,30,31,30,31];

	// If evenly divisible by 4 and not evenly divisible by 100,
	// or is evenly divisible by 400, then a leap year
	if ( (!(y % 4) && y % 100) || !(y % 400)) {
		daysInMonth[1] = 29;
	}
	return d <= daysInMonth[--m]
}

// flickr api expects date and month to be two digits. this function zero pads
function zeroPad(num, width) {
	var n = Math.abs(num);
	var zeros = Math.max(0, width - Math.floor(n).toString().length );
	var zeroString = Math.pow(10,zeros).toString().substr(1);
	if( num < 0 ) {
		zeroString = '-' + zeroString;
	}

	return zeroString+n;
}