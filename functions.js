function parseJson(jsonString) {
	return eval('(' + jsonString + ')');
}

function loadHardware(callback) {
	var newXHR = new XMLHttpRequest();
	newXHR.open('GET', 'hardware.json');
	newXHR.onreadystatechange = function() {
		if (newXHR.readyState == 4) {
			var resp = parseJson(newXHR.responseText);
			callback(resp);
		}
	}
	newXHR.send(null);
}

function loadTopology(callback) {
	var mock = {
		devices: [],
		wires: []
	};
	callback(mock);
}

var hardware = null;
var topology = null

function fillDevices(data) {
	hardware = data; 
	var i = 0;
	var devicesList = document.getElementById('devices');
	devicesList.deleteRow(0);
	for ( var id in data.devices) {
		var acc = "<div id=" + id + "><img src="
				+ data.devices[id].image.main.url + " id=img_" + id + " >"
				+ "<br> <p id=p_" + id + ">" + data.devices[id].name
				+ "</p> <br></div>";
		var row = devicesList.insertRow(-1);
		var cell = row.insertCell(0);
		cell.innerHTML = acc;
	}
	for ( var id in data.devices) {
		document.getElementById(id).onclick = handleDeviceAddStart;
	}
}

function fillTopology(data) {
	topology = data;
	// render data here...
}



// щелчки
var buf = null;

function wrapHandler(f) {
	return function(e) {
		var ev = window.event ? window.event : e;
		var el = ev ? ev.target : e.srcElement;
		f(ev, el);
	}
}

function deviceAddStart(ev, el) {
	alert(el.id);
	var elid = el.id;
	var temp = elid.split("_");
	buf = hardware.devices[temp[1]];
}

function deviceAddFinish(ev, el) {
	var mouse_x = ev.clientX;
	var mouse_y = ev.clientY;
	// var divcrt = "<div id=\"" + buf + "\"><img src=\""
	// + buf.image.main.url + "\" >"
	// + "<br> <p id=\"p_" + buf + "\">" + buf.name
	// + "</p> <br></div>";
	alert(buf);
	buf = null;
}

// координаты
function point(xcoord,ycoord){
	var p = {
			x: xcoord,
			y: ycoord,
			add: function(other){
		        var xnew = this.x + other.x;
		        var ynew = this.y + other.y;
				return point(xnew, ynew);
			},
	        toString: function(){
				return 'Point(' + this.x + ',' + this.y + ')';
			}
	}
	return p;
}

// конуструтор
function getFreeId(){
	var i=0;
	while (i <= 100) {
		if (!document.getElementById('device_' + i + 1)) {break} 
	}
	return (i);
}	

function newDevice() {
	var id = getFreeId(); 
	var device = {
			name: 'device_' + id, 
			id: 'device_' + id 
	}
    return device; 	
}



handleDeviceAddStart = wrapHandler(deviceAddStart);
handleDeviceAddFinish = wrapHandler(deviceAddFinish);

window.onload = function(e) {
	document.getElementById('constructfield').onclick = handleDeviceAddFinish;
	loadHardware(function(data) {
		fillDevices(data);
		loadTopology(fillTopology);
	});
	
}
