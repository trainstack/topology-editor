var hardware = null;
var topology = null;
var buf = null;
var menuevent = null;
var dragObject = null;
var mainfield = null;  


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
		var acc = '<div id=' + id + ' style="text-align:center;"><img src='
				+ data.devices[id].image.main.url + ' id=img_' + id + ' class="palette_icon" >'
				+ '<p id=p_' + id + '>' + data.devices[id].name
				+ '</p></div>';
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
			name: 'Device ' + devnum, 
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
	if (buf != null) {
    div.innerHTML = '<img src="' 
	 + buf.image.main.url + '" class="editor_icon" id="img_' + device.id + '"/>'
	 + '<br/> <p id="p_' + device.id + '" class="js-device-name">' + device.name
	 + '</p> <br/>';
	 parent.appendChild(div);
	 var sizer = div.childNodes.item("img_" + device.id);
	 div.style.left = mouse_x - ((div.clientWidth)/2) + 'px';
	 div.style.top = mouse_y - ((sizer.clientHeight)/2) + 'px';
	 div.style.visibility = 'visible';
  }
  div.onmousedown = wrapHandler(divDragStart);
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
      html = '<li><a tabindex="-1" href="#" class="js-get-html-rename"> Переименовать </a></li>';
      html += '<br><li><a tabindex="-1" href="#" class="js-get-html-remove"> Удалить </a></li>';
      menu.innerHTML = html;
      $(".js-get-html-rename").on('click', function() {
        console.log(event);
        var parent = parentSearch(event.target);
        renameDevice(parent);        
      });
      $(".js-get-html-remove").on('click', function() {
        console.log(event);
        var parent = parentSearch(event.target);
        removeDevice(parent);
      });      
      menu.style.top = defPosition(event).y + 'px';
      menu.style.left = defPosition(event).x + 'px';
      menu.style.display = '';
	   document.getElementById("contextMenuId").style.display = "block";
};


//Переименование элемента
function renameDevice(elem) {
      var div = $(elem);
      var p = div.find("p");
      p.hide();
      p.after(
          "<input type='text' class='js-edit' style='width: 96; height: 28;'>"
      );
      var edit = div.find(".js-edit");
      edit.keydown(function(e) {   
          console.log(e.keyCode);     
          if (e.keyCode == 13) {
              e.preventDefault();
              p.text(edit.val());           
              edit.remove();
              p.show();
          }
      });
}

//Удаление элемента
function removeDevice(elem) {
  return elem.parentNode ? elem.parentNode.removeChild(elem) : elem;
}

//Перетаскивание эелемента
function divDragStart(event) {
  var element = parentSearch(event.target);
  console.log("Starting drag " + element);
  dragObject = element;
  var mainfield = document.getElementById("constructfield");
  event.preventDefault();
}

function divDrag(e) {
  e = e || window.event;
  var parent = document.getElementById("constructfield");
  var mouse_x = e.clientX - parent.offsetLeft - 32;
  var mouse_y = e.clientY - parent.offsetTop - 32; 
  console.log(dragObject.style.left + ' ' + dragObject.style.top);
  if (dragObject != null) {    
    dragObject.style.left =  mouse_x + "px";
    dragObject.style.top = mouse_y + "px";
  };
}

function divDragFinish() {
  console.log("Finishing drag on element " + dragObject);
  dragObject = null;
}


//Поиск "родителя"
function parentSearch(node) {
  for (var realParent = node; realParent.className !="constrdevice"; realParent = realParent.parentNode);
  return realParent;
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
  var constructfield = document.getElementById('constructfield');
	constructfield.onclick = handleDeviceAddFinish;
  constructfield.onmouseup = wrapHandler(divDragFinish);
  constructfield.onmousemove = wrapHandler(divDrag);
	loadHardware(function(data) {
		fillDevices(data);
		loadTopology(fillTopology);
	});

};
