var hardware = null;
var slots = null;
var topology = null;
var buf = null;
var menuevent = null;
var dragObject = null;
var mainfield = null;
var renaming = false;
var deviceArray = {}; 

var config = {
	api_endpoint: '/examples/' // default for dev environment
};

//функция для парсинга
function parseJson(jsonString) {
	return eval('(' + jsonString + ')');
}


//парсинг hardware.json
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

//парсинг slots.json
function loadSlots(callback) {
  var newXHR = new XMLHttpRequest();
  newXHR.open('GET', config.api_endpoint + 'slots.json');
  newXHR.onreadystatechange = function() {
    if (newXHR.readyState == 4) {
      var resp = parseJson(newXHR.responseText);
      callback(resp);
    }
  };
  newXHR.send(null); 
}

//загрузка топологии
function loadTopology(callback) {
	var mock = {
		devices: [],
		wires: []
	};
	callback(mock);
}

//заполнение списка устройств
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

// заполнение списка слотов 
function fillSlots(data) {
  slots = data; 
  console.log(slots);
}


//заполнение топологии
function fillTopology(data) {
	topology = data;
	// render data here...
}

//хендлер щелчка 
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

// {
//   id: "device_1",
//   name: "VM 1",
//   position: {x: 1, y: 2},
//   slots: [
//     {
//       id: 0,
//       model: "Realtek",
//       ports: [
//         {type: "Ethernet", wire: null, slot_id: 0, id: 0}
//       ]
//     }
//   ]
// }


function newDevice(proto) {
	var deviceId = 'device_' + getFreeId();
  if (proto != null) {var devnum = proto.name};
  var slotsArray = [];
  var portsArray = [];
  // for (var i = 0; i < slots.cards.length; i++) { 
  //     slotsArray[i] = {
  //       id: i,
  //       model: slots.cards[i].model
  //     }
  //     ports = [];
  //     for (var k=0; k<slots.cards[i].ports.length; k++) {
  //       for (var m=0; m < slots.cards[i].ports[k].count; m++) {
  //         ports[ports.length] = {
  //           type: slots.cards[i].ports[k].type,
  //           wire: null,
  //           slot_id: i,
  //           id: ports.length
  //         }
  //       }
  //     } 
  // };
  for (var i in buf.slots) {
    for (var k in slots.cards) {
      if (slots.cards[k].model == buf.slots[i].model) {
        for (var n = 0; n < slots.cards[k].ports.length; n++ ) {
          portsArray = [];
          for (var m = 0; m < slots.cards[k].ports[n].count; m++) {
               portsArray[m] = {
               type: slots.cards[k].ports[n].type,
               wire: null,
               slot_id: i,
               id: portsArray.length
              }
              slotsArray[i] = {
              id: i,
              model: buf.slots[i].model,
              ports: portsArray
              }
          }
        } 
      }
    }

  }
  var device = {
    id: deviceId,
    name: devnum,
    position: {x: 0, y: 0},
    slots: slotsArray
  };
  deviceArray[deviceId] = device; 
  return device;
  console.log(device); 
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
	var device = newDevice(buf);
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
      var portsList = '';
      var goalDevice = parentSearch(event.target);
      var necessaryDevice = deviceArray[goalDevice.id];
      console.log(necessaryDevice); 
      event = event || window.event;
      event.preventDefault ? event.preventDefault() : event.returnValue = false; 
      var menu = document.getElementById("contextMenuId");
      var html = "";
      for (var i in necessaryDevice.slots) {
        portsList = '';
        for (var m in necessaryDevice.slots[i].ports) {
          portsList += '<li>' + necessaryDevice.slots[i].ports[m].type + ' ' + (necessaryDevice.slots[i].ports[m].id + 1) + '</li>';
        }
        html += 
        '<li class="dropdown-submenu">' + 
        '<a tabindex="-1" href="#">' + necessaryDevice.slots[i].model + '</a>'+
        '<ul class="dropdown-menu">' +
        portsList +
        '</ul>' +
        '</li>';
        }
      html += '<li class="divider"></li>';
      html += '<li><a tabindex="-1" href="#" class="js-get-html-rename"> Переименовать </a></li>';
      html += '<li class="divider"></li>';
      html += '<li><a tabindex="-1" href="#" class="js-get-html-remove"> Удалить </a></li>';
      menu.innerHTML = html;
      $(".js-get-html-rename").on('click', function() {
        var parent = parentSearch(event.target);
        renameDevice(parent);     
      });
      $(".js-get-html-remove").on('click', function() {
        var parent = parentSearch(event.target);
        removeDevice(parent);
      });
      menu.style.top = defPosition(event).y + 'px';
      menu.style.left = defPosition(event).x + 'px';
      menu.style.display = '';
	   if (renaming == false) {document.getElementById("contextMenuId").style.display = "block"};
};


//Переименование элемента
function renameDevice(elem) {
      renaming = true; 
      var div = $(elem);
      var p = div.find("p");
      p.hide();
      p.after(
          "<input type='text' class='js-edit' style='width: 96; height: 28;'>"
      );
      var edit = div.find(".js-edit");
      edit.keydown(function(e) {      
          if (e.keyCode == 13) {
              e.preventDefault();
              p.text(edit.val());           
              edit.remove();
              p.show();
              renaming = false; 
          }
      });
}

//Удаление элемента
function removeDevice(elem) {
  return elem.parentNode ? elem.parentNode.removeChild(elem) : elem;
}

//Определение слотов и портов элемента
function portsSlotsDefinition() {
  console.log('ololo');
}

//Перетаскивание эелемента
function divDragStart(event) {
  if (renaming == true) {return false}
    else {
        var element = parentSearch(event.target);
        dragObject = element;
        var mainfield = document.getElementById("constructfield");
        event.preventDefault();
      };
}

function divDrag(e) {
  e = e || window.event;
  var parent = document.getElementById("constructfield");
  var mouse_x = e.clientX - parent.offsetLeft - 32;
  var mouse_y = e.clientY - parent.offsetTop - 32;  
  if (dragObject != null)  {    
    dragObject.style.left =  mouse_x + "px";
    dragObject.style.top = mouse_y + "px";
    var tester = 0 + "px"; 
    if (dragObject.style.left < (0 + "px")) {dragObject.style.left =  0 + "px"; };
  };
}

function divDragFinish() {
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
  loadSlots(function(data) {
    fillSlots(data);
  });

};
