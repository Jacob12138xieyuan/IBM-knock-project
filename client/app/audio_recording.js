// Authorization: 'Basic YWNvdXN0aWMucG9rQGdtYWlsLmNvbTpBY291c3RpY3BvazEyMw=='
// 4:39:07 PM: {
//     "classifications": {
//         "infill": {
//             "labelName": "infill",
//             "labelValue": "",
//             "confidence": 1.0,
//             "rankedValues": [
//                 {
//                     "labelValue": "",
//                     "confidence": 1.0
//                 },
//                 {
//                     "labelValue": "30",
//                     "confidence": 0.0
//                 },
//                 {
//                     "labelValue": "10",
//                     "confidence": 0.0
//                 },
//                 {
//                     "labelValue": "50",
//                     "confidence": 0.0
//                 },
//                 {
//                     "labelValue": "20",
//                     "confidence": 0.0
//                 },
//                 {
//                     "labelValue": "40",
//                     "confidence": 0.0
//                 }
//             ]
//         }
//     }
// }
let chart = new Chart(barChart, {
	type: 'bar',
	data:{
	labels:['10p','20p','30p','40p','50p'],
	datasets: [
		{
		label: 'prediction',
		data: [0.5,0.5,0.5,0.5,0.5],
		backgroundColor: 'blue',
		borderWidth: 1
		}
	]
	},
	options: {
	scale:{
		yAxes:[{
		ticks:{
			beginAtZero: true,
			max: 1
		}
		}]
	}
	}
});

//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL || window.mozURL;

var gumStream; 						//stream from getUserMedia()
var rec; 							//Recorder.js object
var input; 							//MediaStreamAudioSourceNode we'll be recording

// shim for AudioContext when it's not avb. 
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext //audio context to help us record

var recordButton 	= document.getElementById("recordButton");
// var stopButton 		= document.getElementById("stopButton");
// var pauseButton 	= document.getElementById("pauseButton");

//add events to those 2 buttons
recordButton.addEventListener("click", startRecording);
// stopButton.addEventListener("click", stopRecording);
// pauseButton.addEventListener("click", pauseRecording);

function startRecording() {
	console.log("recordButton clicked");

	/*
		Simple constraints object, for more advanced audio features see
		https://addpipe.com/blog/audio-constraints-getusermedia/
	*/
	var constraints = { audio: true, video: false }

	/*
	  Disable the record button until we get a success or fail from getUserMedia() 
  	*/
	recordButton.disabled = true;
	// stopButton.disabled = false;
	// pauseButton.disabled = false

	/*
    	We're using the standard promise based getUserMedia() 
    	https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
	*/
	navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
		console.log("getUserMedia() success, stream created, initializing Recorder.js ...");

		/*
			create an audio context after getUserMedia is called
			sampleRate might change after getUserMedia is called, like it does on macOS when recording through AirPods
			the sampleRate defaults to the one set in your OS for your playback device
		*/
		audioContext = new AudioContext();

		//update the format 
		document.getElementById("formats").innerHTML = "Format: 1 channel pcm @ " + audioContext.sampleRate / 1000 + "kHz"

		/*  assign to gumStream for later use  */
		gumStream = stream;

		/* use the stream */
		input = audioContext.createMediaStreamSource(stream);

		/* 
			Create the Recorder object and configure to record mono sound (1 channel)
			Recording 2 channels will double the file size
		*/
		rec = new Recorder(input, { numChannels: 1 })

		//start the recording process
		
		
		setTimeout(function(){
			console.log("Recording started");
			rec.record();
		}, 1200);
		
		//============== request knock========
		var xhr1 = new XMLHttpRequest();
		// xhr1.onload = function (e) {
		// 	if (this.readyState === 4) {
		// 		console.log("success")
		// 	}
		// }
		xhr1.open("POST", "/api/knock", true);
		xhr1.send();

		//==================================

		// stop the recording process - after 3 secs recording
		setTimeout(function() {
			console.log("stopButton clicked");

			//disable the stop button, enable the record too allow for new recordings
			// stopButton.disabled = true;
			recordButton.disabled = false;
			// pauseButton.disabled = true;

			//reset button just in case the recording is stopped while paused
			// pauseButton.innerHTML = "Pause";

			//tell the recorder to stop the recording
			rec.stop();

			//stop microphone access
			gumStream.getAudioTracks()[0].stop();

			//create the wav blob and pass it on to createDownloadLink
			rec.exportWAV(createDownloadLink);
			
		}, 1700);

	}).catch(function (err) {
		//enable the record button if getUserMedia() fails
		// recordButton.disabled = false;
		// stopButton.disabled = true;
		// pauseButton.disabled = true
		console.log(err);
	});
}

function pauseRecording() {
	console.log("pauseButton clicked rec.recording=", rec.recording);
	if (rec.recording) {
		//pause
		rec.stop();
		pauseButton.innerHTML = "Resume";
	} else {
		//resume
		rec.record()
		pauseButton.innerHTML = "Pause";
	}
}

function stopRecording() {
	console.log("stopButton clicked");

	// Disable the stop button, enable the record too allow for new recordings
	stopButton.disabled = true;
	recordButton.disabled = false;
	pauseButton.disabled = true;

	//reset button just in case the recording is stopped while paused
	pauseButton.innerHTML = "Pause";

	//tell the recorder to stop the recording
	rec.stop();

	//stop microphone access
	gumStream.getAudioTracks()[0].stop();

	//create the wav blob and pass it on to createDownloadLink
	rec.exportWAV(createDownloadLink);
}

function createDownloadLink(blob) {
	// max 1 recording
	var list = document.getElementById("recordingsList");
	if(list.childNodes[0]) list.removeChild(list.childNodes[0]);

	var url = URL.createObjectURL(blob);
	var au = document.createElement('audio');
	var li = document.createElement('li');
	var link = document.createElement('a');

	//name of .wav file to use during upload and download (without extendion)
	var filename = new Date().toISOString();

	//add controls to the <audio> element
	au.controls = true;
	au.src = url;

	//save to disk link
	link.href = url;
	link.download = filename + ".wav"; //download forces the browser to donwload the file using the  filename
	// link.innerHTML = '<br><button class="btn btn-outline-info form-control-sm">Save to disk</button>';

	//add the new audio element to li
	li.appendChild(au);

	//add the filename to the li
	li.appendChild(document.createTextNode(filename + ".wav "))

	//add the save to disk link to li
	li.appendChild(link);

	//upload link
	// var upload = document.createElement('a');
	// upload.href = "#";
	// upload.innerHTML = '<button class="btn btn-outline-primary form-control-sm">Watson Acoustic Submission</button>';
	// upload.addEventListener("click", function (event) {
	// alert("Recorded acoustic audio submitting for IOT SOUND MODEL. \n\nPlease be patient!\n");
	document.getElementById("showTable").style.display="none";
	var xhr = new XMLHttpRequest();
	xhr.onload = function (e) {
		if (this.readyState === 4) {			
			let response = JSON.parse(e.target.response);
			let body = JSON.parse(response.body);
			console.log("Server returned: ", body);
			let classifications = body.classifications;
			let infill = classifications.infill;
			let rankArray = infill.rankedValues;
			let rankArrayOrdered = rankArray.slice(0);
			rankArrayOrdered.sort(function(a,b){
				return parseInt(a.labelValue) - parseInt(b.labelValue);
			})
			let dataArray = [];
			rankArrayOrdered.forEach(function(item){
				dataArray.push(item.confidence);
			}) 
			//console.log(dataArray);

			var barChart = document.getElementById("barChart");
			let chart = new Chart(barChart, {
				type: 'bar',
				data:{
				labels:['10p','20p','30p','40p','50p'],
				datasets: [
					{
					label: 'prediction',
					data: dataArray,
					backgroundColor: 'blue',
					borderWidth: 1
					}
				]
				},
				options: {
				scale:{
					yAxes:[{
					ticks:{
						beginAtZero: true,
						max : 1
					}
					}]
				}
				}
			});
						
			var dt = new Date();
			document.getElementById("resultdisplay").innerHTML = "";
			document.getElementById("resultdisplay").innerHTML = '  ' + infill.labelValue + '% infill block is knocked!';
			document.getElementById("datetime").innerHTML = dt.toLocaleString();
			document.getElementById("showTable").style.display="block";
		}
	};
	var fd = new FormData();
	fd.append("audiofile", blob);
	xhr.open("POST", "/api/modelscore", true);
	// xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhr.send(fd);
	// })
	li.appendChild(document.createTextNode(" "))	//add a space in between
	// li.appendChild(upload)							//add the upload link to li

	//add the li element to the ol
	recordingsList.appendChild(li);
	console.log(recordingsList)
}