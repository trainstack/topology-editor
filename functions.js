var hardware = null;
var topology = null;
var buf = null;
var menuevent = null;

var config = {
	api_endpoint: '/examples/' // default for dev environment

};

function parseJson(jsonString) {
	return eval('(' + jsonString + ')');
}

function loadHardware(callback) {
	var newXHR = new XMLHttpRequest();
	newXHR.open('GET', config.api_endpoint + 'hardware.json');
	newXHR.onreadystatechange = function() {
		if (newXHR.readyState == 4) {
			var resp = parseJson(newXHR.responseText);
			callback(resp);
		}
	};
	newXHR.send(null);
}

function loadTopology(callback) {
	var mock = {
		devices: [],
		wires: []
	};
	callback(mock);
}

function fillDevices(data) {
	hardware = data; 
	var devicesList = document.getElementById('devices');
	devicesList.deleteRow(0);
	for ( var id in data.devices) {
		var acc = '<div id=' + id + '><img src='
				+ data.devices[id].image.main.url + ' id=img_' + id + ' class="palette_icon" >'
				+ '<br> <p id=p_' + id + '>' + data.devices[id].name
				+ '</p> <br></div>';
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

function wrapHandler(f) {
	return function(e) {
		var ev = window.event ? window.event : e;
		var el = ev ? ev.target : e.srcElement;
		f(ev, el);
	};
}

//конуструтор
function getFreeId(){
	for (var i=0; i<100; i++) {
		if (!document.getElementById('device_' + i)) break; 
	}
	return (i);
}	

function newDevice() {
	var id = getFreeId();
	var devnum = id + 1;
	var device = {
			name: 'device ' + devnum, 
			id: 'device_' + id,
			position:  {"x":-1, "y":-1}
	};
    return device; 	
}

//щелчки 

function deviceAddStart(ev, el) {
	var elid = el.id;
	var temp = elid.split("_");
	buf = hardware.devices[temp[1]];
}

function deviceAddFinish(ev, el) {
	var parent = document.getElementById("constructfield");
	var mouse_x = ev.clientX - parent.offsetLeft;
	var mouse_y = ev.clientY - parent.offsetTop;
	var device = newDevice();
	var div = document.createElement( "div" );
	div.id = device.id;
	div.className = 'constrdevice';
	div.oncontextmenu = menuevent; 
     div._editorDevice = device;
        div.style.visibility = 'hidden';
	div.innerHTML = '<img src="' 
	+ buf.image.main.url + '" class="editor_icon" id="img_' + device.id + '"/>'
	+ '<br/> <p id="p_' + device.id + '">' + device.name
	+ '</p> <br/>';
	parent.appendChild(div);
	var sizer = div.childNodes.item("img_" + device.id);
	div.style.left = mouse_x - ((div.clientWidth)/2) + 'px';
	div.style.top = mouse_y - ((sizer.clientHeight)/2) + 'px';
	div.style.visibility = 'visible';
	device.position.x = div.style.left;
	device.position.y = div.style.top;
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
	};
	return p;
}

//Функция для определения координат указателя мыши (для выпадающего меню)
function defPosition(event) {
      var x = y = 0;
  	  var parent = document.getElementById("constructfield");
  	  var x = event.clientX - parent.offsetLeft;
	  var y = event.clientY - parent.offsetTop;
      return {x:x, y:y};
}

//выпадающее меню при правом клике на устройство
menuevent = function(event) {
         event = event || window.event;
         event.preventDefault ? event.preventDefault() : event.returnValue = false; 
   		 var menu = document.getElementById("contextMenuId");
   	     var html = "";
   	     html = '<form><input type=button name="removebutton" value="Переименовать" onClick="removeDevice"></form>';
   	     html += '<form><input type=button name="removebutton" value="Удалить" onClick="removeDevice"></form>';
   	  if (html) {
          menu.innerHTML = html;
          menu.style.top = defPosition(event).y + 'px';
          menu.style.left = defPosition(event).x + 'px';
          menu.style.display = '';
	  document.getElementById("contextMenuId").style.display = "block";
      }
};

//Удаление элемента
function removeDevice() {
  alert('Удаление');
}

//Переименование элемента
function renameDevice() {
  alert('Переименование');
}

    
 // Функция для добавления обработчиков событий, связанных с выпадающим меню
   function addHandler(object, event, handler, useCapture) {
       if (object.addEventListener) {
           object.addEventListener(event, handler, useCapture ? useCapture : false);
       } else if (object.attachEvent) {
           object.attachEvent('on' + event, handler);
       } else alert("Add handler is not supported");
  }
  addHandler(document, "click", function() {
       document.getElementById("contextMenuId").style.display = "none";
    });   
        

//вызов функций

handleDeviceAddStart = wrapHandler(deviceAddStart);
handleDeviceAddFinish = wrapHandler(deviceAddFinish);

window.onload = function(e) {
	document.getElementById('constructfield').onclick = handleDeviceAddFinish;
	loadHardware(function(data) {
		fillDevices(data);
		loadTopology(fillTopology);
	});
	
};
