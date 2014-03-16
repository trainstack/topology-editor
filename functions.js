var hardware = null;
var slots = null;
var topology = null;
var buf = null;
var menuevent = null;
var dragObject = null;
var mainfield = null;
var renaming = false;
var connectObject1 = null; 
var connectObject2 = null; 
var paper = null;
var wires = {};
var deviceMap = {}; 
var d = null;
var save = {}; 


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

//парсинг model.json
function loadTopology(callback) {
  var newXHR = new XMLHttpRequest();
  newXHR.open('GET', config.api_endpoint + 'model.json');
  newXHR.onreadystatechange = function() {
    if (newXHR.readyState == 4) {
      var resp = parseJson(newXHR.responseText);
      var mock = {
       devices: [],
       wires: []
      };
      callback(resp);  
    }
  };
  newXHR.send(null); 
}

//заполнение списка устройств
function fillDevices(data) {
	hardware = data;
  var picture = null; 
	var devicesList = document.getElementById('devices');
	devicesList.deleteRow(0);
  devicesList.innerHTML = '<div><button class="btn" onclick="saveTopology()"><i class="icon-hdd icon-white"></i> Сохранить топологию</button></div><br><div><button class="btn" onclick="networkStart()"><FONT color="white"> &#9658 </button><button class="btn" onclick="networkStop()"><FONT color="white">&nbsp&#9632&nbsp</FONT></button></div><br>';
	for ( var id in data.devices) {
    if ((data.devices[id].metadata.image != undefined) &&
    (data.devices[id].metadata.image.main != undefined) && 
    (data.devices[id].metadata.image.main.url != undefined)) 
    {picture = data.devices[id].metadata.image.main.url} else 
    {picture = "/img/default.png"};
	 var acc = '<div id=' + id + ' style="text-align:center;"><img src='
				+ picture + ' id=img_' + id + ' class="palette_icon" style="height:32px; width:32px;">'
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
}


//заполнение топологии
function fillTopology(data) {
	topology = data;
  var picture = null;
	var constructfield = document.getElementById('constructfield');
  var svg = document.getElementById('svg');
  var slotsArray = [];
  var portsArray = [];
  var slotObject = {};
  for (var i in topology.devices) {
  slotsArray = [];
    for (var j in topology.devices[i].slots) {
        for (var k in slots.cards) {
        if (slots.cards[k].model == topology.devices[i].slots[j].model) {
          for (var n = 0; n < slots.cards[k].ports.length; n++ ) {
            portsArray = [];
            for (var m = 0; m < slots.cards[k].ports[n].count; m++) {
                 portsArray[m] = {
                 type: slots.cards[k].ports[n].type,
                 wire: null,
                 slot_id: topology.devices[i].slots[j].id,
                 id: portsArray.length
                }
              slotsArray[j] = {
              id: i,
              editable: topology.devices[i].slots[j].editable,
              model: topology.devices[i].slots[j].model,
              ports: portsArray
              }
            }
          } 
        }
      }
    }
    var device = {
    id: topology.devices[i].id,
    hardware: topology.devices[i].hardware,
    name: topology.devices[i].name,
    metadata: {position: {x: topology.devices[i].metadata.position.x, y: topology.devices[i].metadata.position.y}},
    slots: slotsArray
  };
  deviceMap[topology.devices[i].id] = device; 

  var parent = document.getElementById('constructfield');
  for (var j in hardware.devices) {
    
    if (hardware.devices[j].id == topology.devices[i].hardware) {
      if ((hardware.devices[j].metadata.image != undefined) &&
          (hardware.devices[j].metadata.image.main != undefined) && 
          (hardware.devices[j].metadata.image.main.url != undefined)) 
      {  
        picture = hardware.devices[j].metadata.image.main.url
      } else {
        picture = "/img/default.png"
      };
    };
  }
  var div = document.createElement( "div" );
  div.id = topology.devices[i].id;
 // var currentDiv = document.getElementById(div.id);
 //  currentDiv.style.left = device.metadata.position.x;
 //  currentDiv.style.top = device.metadata.position.y;
  div.className = 'constrdevice';
  div.oncontextmenu = menuevent; 
        div._editorDevice = device;
        div.style.visibility = 'hidden';
    div.innerHTML = '<img src="' 
   + picture + '" class="editor_icon" style="height:64px; width:64px;" id="img_' + device.id + '"/>'
   + '<br/> <p id="p_' + device.id + '" name = "' + device.name + '" class="js-device-name">' + device.name
   + '</p> <br/>';
   parent.appendChild(div);
   var sizer = div.childNodes.item("img_" + device.id);

   div.style.left = device.metadata.position.x;
   div.style.top = device.metadata.position.y;
   div.style.visibility = 'visible';
   div.onmousedown = wrapHandler(divDragStart);
  } 
  for (var i in topology.wires) {
      var numb = topology.wires[i].id;
      numb = numb.split("_");
      numb = numb[1];
      wires[numb] = {
      id: topology.wires[i].id,
      left: {device: topology.wires[i].left.device, slot: topology.wires[i].left.slot, port: topology.wires[i].left.port},
      right: {device: topology.wires[i].right.device, slot: topology.wires[i].right.slot, port: topology.wires[i].right.port}
      }
      var pathId = topology.wires[i].id.split("_");
      pathId = pathId[1];
      pathId = 'path_' + pathId; 
      var left = topology.wires[i].left.device;
      var right = topology.wires[i].right.device;
      for (var j in deviceMap) {
        if (left == deviceMap[j].id) {
          var x1 = deviceMap[j].metadata.position.x + 32; 
          var y1 = deviceMap[j].metadata.position.y + 32;
          var s1 = topology.wires[i].left.slot;
          var p1 = topology.wires[i].left.port;
          deviceMap[j].slots[s1].ports[p1].wire = topology.wires[i].id;
        };
        if (right == deviceMap[j].id) {
          var x2 = deviceMap[j].metadata.position.x + 32; 
          var y2 = deviceMap[j].metadata.position.y + 32;
          var s2 = topology.wires[i].right.slot;
          var p2 = topology.wires[i].right.port;
          deviceMap[j].slots[s2].ports[p2].wire = topology.wires[i].id;
        };
      }
      var newpath = document.createElementNS('http://www.w3.org/2000/svg','path');
      var newdefs = document.createElementNS('http://www.w3.org/2000/svg','defs');
      newpath.setAttribute('d', 'M' + x1 + ',' + y1 + 'L' + x2 + ',' + y2 + 'Z');
      newpath.setAttribute('id', pathId);
      newpath.setAttribute('stroke', '#000000');
      newpath.setAttribute('style', '');
      newpath.setAttribute('fill', 'none');
      svg.appendChild(newdefs);
      svg.appendChild(newpath); 
  };
wireRendering();
}

function saveTopology(onsuccess) {
  var deviceArray = [];
  var slotObject={};
  var slotsArray = {};
  var wiresArray = [];  
  for (var i in deviceMap) {
    // save.devices[i].id = deviceMap[i].id
    // save.devices[i].name = deviceMap[i].name;
    // save.devices[i].hardware = deviceMap[i].hardware;
    // for (var j in deviceMap[i].slots) {
    //   save.devices[i].slots[j].id = deviceMap[i].slots[j].id;
    //   save.devices[i].slots[j].model = deviceMap[i].slots[j].model;
    //   save.devices[i].slots[j].editable = deviceMap[i].slots[j].editable;
    // }
    var h = 0;
    for (var j in deviceMap[i].slots) {
      slotObject ={
        id: deviceMap[i].slots[j].id,
        model: deviceMap[i].slots[j].model,
        editable: deviceMap[i].slots[j].editable
      }
     slotsArray[h] = slotObject;
     slotObject ={};
     h++;
      }
      var px = deviceMap[i].metadata.position.x;
      var py = deviceMap[i].metadata.position.y;
      var p = {
      x: px,
      y: py
      }
      var pos = {position: p}
      deviceArray[deviceArray.length] = {
        id: deviceMap[i].id,
        name: deviceMap[i].name,
        hardware: deviceMap[i].hardware,
        metadata: pos, 
        slots: slotsArray
      }
     slotsArray=[];
    //console.log(deviceArray[i]);
    //console.log(i);
    }
    for (var i in wires) {
      wiresArray[i] = {
        id: wires[i].id,
        left: wires[i].left,
        right: wires[i].right
      }
     //console.log(i); 
    }
  //}
   save = {
    devices: deviceArray,
    wires: wiresArray
   } 
  var jsonStr = JSON.stringify(save);
  $.post(config.api_endpoint + 'model.json', jsonStr, onsuccess); 
}

//хендлер щелчка 
function wrapHandler(f) {
	return function(e) {
		var ev = window.event ? window.event : e;
		var el = ev ? ev.target : e.srcElement;
		f(ev, el);
	};
}

//поиск свободного id для устройств
function getFreeId(){
	for (var i=0; i<100; i++) {
		if (!document.getElementById('device_' + i)) break; 
	}
	return (i);
}	

// {
//   id: "device_1",
//   name: "VM 1",
//   metadata: { position: {x: 1, y: 2}},
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
              editable: buf.slots[i].editable,
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
    hardware: proto.id,
    name: devnum,
    metadata: {position: {x: 0, y: 0}},
    slots: slotsArray
  };
  deviceMap[deviceId] = device; 
  return device;
}

//щелчки 

function deviceAddStart(ev, el) {
	var elid = el.id;
	var temp = elid.split("_");
	buf = hardware.devices[temp[1]];
}

function deviceAddFinish(ev, el) { 
  	var picture = null;
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
		if ((buf.metadata.image != undefined) && 
		    (buf.metadata.image.main != undefined) && 
		    (buf.metadata.image.main.url != undefined)) 
		{
		  picture = buf.metadata.image.main.url
		} else {
		  picture = "/img/default.png"
		};
		div.innerHTML = '<img src="' 
		 + picture + '" class="editor_icon" style="height:64px; weight:64px;" id="img_' + device.id + '"/>'
		 + '<br/> <p id="p_' + device.id + '" name="' + device.name + '" class="js-device-name">' + device.name
		 + '</p> <br/>';
		 parent.appendChild(div);
		 var sizer = div.childNodes.item("img_" + device.id);
         var px = mouse_x - ((div.clientWidth)/2);
         var py = mouse_y - ((sizer.clientHeight)/2);
		 div.style.left = px + 'px';
		 div.style.top = py + 'px';
		 div.style.visibility = 'visible';      
 	 	 div.onmousedown = wrapHandler(divDragStart);
		 device.metadata.position.x = div.style.left;
		 device.metadata.position.y = div.style.top;
	  }
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
      var tripList = [];
      var portsList = '';
      var goalDevice = parentSearch(event.target);
      var necessaryDevice = deviceMap[goalDevice.id];
      event = event || window.event;
      event.preventDefault ? event.preventDefault() : event.returnValue = false; 
      var menu = document.getElementById("contextMenuId");
      var html = "";
      for (var i in necessaryDevice.slots) {
        portsList = '';
        for (var m in necessaryDevice.slots[i].ports) {
          if (necessaryDevice.slots[i].ports[m].wire == null) { portsList += '<li><a title="свободен" tabindex = "-1" href="#" class="js-port-connect" datadevice="' + necessaryDevice.id + '" dataslot = "' + i + '" dataport = "' + m + '" > &#9675 ' + necessaryDevice.slots[i].ports[m].type + ' ' + (necessaryDevice.slots[i].ports[m].id + 1) + '</a></li>'}
          else { var necessaryWire = necessaryDevice.slots[i].ports[m].wire;
                for (var k in wires) {
                  if (necessaryWire == wires[k].id) {
                    if (wires[k].left.device == necessaryDevice.id) {
                      var paragraph = document.getElementById('p_' + wires[k].right.device);
                      paragraph = paragraph.getAttribute('name');
                      tripList[i] =[]; 
                      tripList[i][m] = 'Подключен к ' + paragraph;
                    } 
                    else {
                      var paragraph = document.getElementById('p_' + wires[k].left.device);
                      paragraph = paragraph.getAttribute('name');
                      tripList[i] =[]; 
                      tripList[i][m] = 'Подключен к ' + paragraph;
                    };
                  }
                }
                portsList += '<li><a title="' + tripList[i][m] + '" tabindex = "-1" href="#" class="js-port-remove" datadevice="' + necessaryDevice.id + '" dataslot = "' + i + '" dataport = "' + m + '" > &#9679 ' + necessaryDevice.slots[i].ports[m].type + ' ' + (necessaryDevice.slots[i].ports[m].id + 1) + '</a></li>'};
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
      html += '<li><a tabindex="-1" href="#" class="js-get-html-webconsole"> Терминал </a></li>';
      html += '<li class="divider"></li>';
      html += '<li><a tabindex="-1" href="#" class="js-get-html-rename"> Переименовать </a></li>';
      html += '<li class="divider"></li>';
      html += '<li><a tabindex="-1" href="#" class="js-get-html-remove"> Удалить </a></li>';
      menu.innerHTML = html;
      $(".js-get-html-webconsole").on('click', function() {
        var parent = parentSearch(event.target);
        webconsole(parent);     
      });
      $(".js-get-html-rename").on('click', function() {
        var parent = parentSearch(event.target);
        renameDevice(parent);     
      });
      $(".js-get-html-remove").on('click', function() {
        var parent = parentSearch(event.target);
        removeDevice(parent);
      });
        $(".js-port-connect").on('click', function(ev) {
        var parent = parentSearch(event.target);
        var datadevice = ev.target.getAttribute('datadevice');
        var dataslot = ev.target.getAttribute('dataslot');
        var dataport = ev.target.getAttribute('dataport');
        portConnectStart(parent, datadevice, dataslot, dataport);
      });
      $(".js-port-remove").on('click', function(ev) {
        var parent = parentSearch(event.target);
        var datadevice = ev.target.getAttribute('datadevice');
        var dataslot = ev.target.getAttribute('dataslot');
        var dataport = ev.target.getAttribute('dataport');
        if (connectObject1 != null) {alert('Порт занят, выберите другой порт')} else { if (confirm('Отсоединить провод?')) {wireRemove(parent, datadevice, dataslot, dataport)}};
      }); 
      menu.style.top = defPosition(event).y + 'px';
      menu.style.left = defPosition(event).x + 'px';
      menu.style.display = '';
	   if (renaming == false) {document.getElementById("contextMenuId").style.display = "block"};
};

function webconsole() {
  window.open('/webconsole/' + parent.id, 'webconsole');
}

function networkStart() {
  saveTopology(function() {
    var obj = {};
    $.post('/start/', obj);
  }) 
}

function networkStop(parent) {
  var obj = {};
  $.post('/stop/', obj); 
}

//поиск свободного id для линий
function getFreePathId(){
  for (var i = 0; i < 100; i++) {
    if (!document.getElementById('path_' + i)) break; 
  }
  return (i);
}

//Поиск div'ов на концах провода
function vertexSearch(searchParam) {
  return document.getElementById(searchParam.device);
}

//Прорисовка проводов
function wireRendering() {
  for (var i in wires) {
    if (wires[i] != null) {
      var rightDevice = vertexSearch(wires[i].right);
      var leftDevice = vertexSearch(wires[i].left);
      var mem = wires[i].id;
      mem = mem.split("_");
      mem = mem[1];
      var constructfield = document.getElementById('constructfield');
      var x1 = leftDevice.style.left.split('p');
      var x1 = parseInt(x1[0]) + 32;
      var y1 = leftDevice.style.top.split('p');
      var y1 = parseInt(y1[0]) + 30;
      var x2 = rightDevice.style.left.split('p');
      var x2 = parseInt(x2[0]) + 32;
      var y2 = rightDevice.style.top.split('p');
      var y2 = parseInt(y2[0]) + 30;
      var path = document.getElementById('path_' + mem);
      path.setAttribute('d', 'M' + x1 + ',' + y1 + 'L' + x2 + ',' + y2 + 'Z');
    };
  };
}


//Соединение устройств
function portConnectStart(elem, dd, ds, dp) {
if (connectObject1 == null)  {connectObject1 = elem; 
  d = {d: dd, s: ds, p:dp};
  return false;
};
if (connectObject1 != null) {
    connectObject2 = elem;
    if (connectObject2 != connectObject1) {
    var d2 = {d: dd, s: ds, p: dp};
    var numb = getFreePathId();
    var wireId = 'wire_' + numb; 
    wires[numb] = {
      id: wireId,
      left: {device: d.d, slot: d.s, port: d.p},
      right: {device: d2.d, slot: d2.s, port: d2.p},
    };
    for (var i in deviceMap) {
      if (d.d == deviceMap[i].id) {deviceMap[i].slots[d.s].ports[d.p].wire = wireId;};
      if (d2.d == deviceMap[i].id) {deviceMap[i].slots[d2.s].ports[d2.p].wire = wireId;};
    }
    var constructfield = document.getElementById('constructfield');
    var x1 = connectObject1.style.left.split('p');
    var x1 = parseInt(x1[0]) + 32;
    var y1 = connectObject1.style.top.split('p');
    var y1 = parseInt(y1[0]) + 32;
    var x2 = connectObject2.style.left.split('p');
    var x2 = parseInt(x2[0]) + 32;
    var y2 = connectObject2.style.top.split('p');
    var y2 = parseInt(y2[0]) + 32;


    var svg = document.getElementById('svg'); 
    var newpath = document.createElementNS('http://www.w3.org/2000/svg','path');
    var newdefs = document.createElementNS('http://www.w3.org/2000/svg','defs');
    newpath.setAttribute('d', 'M' + x1 + ',' + y1 + 'L' + x2 + ',' + y2 + 'Z');
    newpath.setAttribute('id', 'path_' + numb);
    newpath.setAttribute('stroke', '#000000');
    newpath.setAttribute('style', '');
    newpath.setAttribute('fill', 'none');
    svg.appendChild(newdefs);
    svg.appendChild(newpath);
    connectObject1 = null;
    connectObject2 = null;
    d = null;  

    wireRendering(); 
  } else {connectObject1 = null};
  }
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
              p[0].attributes[1].nodeValue = p[0].childNodes[0].data;
              renaming = false; 
          } 
      });
}


//Удаление элемента
function removeDevice(elem) {
  var wacc = []; 
  var pathArray = [];
  var portArray = [];
  for (var i in deviceMap) {
    for (var m in deviceMap[i].slots) {
      for (var n in deviceMap[i].slots[m].ports) {
        if ((elem.id == deviceMap[i].id) && (deviceMap[i].slots[m].ports[n].wire != null)) {
          var rw = deviceMap[i].slots[m].ports[n].wire;
          for (var k in wires) {
            if (wires[k].id == rw) {
              wacc[wacc.length] = k; 
            var rpid = rw.split('_');
            rpid = rpid[1];
            rpid = 'path_' + rpid; 
            rpid = document.getElementById(rpid);
            pathArray.push(rpid); 
            for (var x in deviceMap) {
              if ((deviceMap[x].id == wires[k].left.device) || (deviceMap[x].id == wires[k].right.device)) {
                for (var y in deviceMap[x].slots) {
                  for (var z in deviceMap[x].slots[y].ports) {
                    if (deviceMap[x].slots[y].ports[z].wire == rw) {
                      portArray.push(deviceMap[x].slots[y].ports[z].wire);
                    }
                  }
                }
              }
            }
            };
          }
        };
      };
    };
    if (elem.id == deviceMap[i].id) {delete deviceMap[i]};
  };  
  for (var i = 0; i < pathArray.length; i++) {
    pathArray[i].parentNode.removeChild(pathArray[i]);
  }
  for (var i = 0; i < wacc.length; i++) {
    delete wires[wacc[i]];
  }

  for (var i = 0; i < portArray.length; i++) {
    for (var m in deviceMap) {
      for (var n in deviceMap[m].slots) {
        for (var k in deviceMap[m].slots[n].ports) {
          if (deviceMap[m].slots[n].ports[k].wire == portArray[i]) {
            deviceMap[m].slots[n].ports[k].wire = null;
          };
         } 
      }
    }
  }
  return elem.parentNode ? elem.parentNode.removeChild(elem) : elem;
}

//Удаление провода 
function wireRemove(p, dd, ds, dp) {
  console.log(p, dd, ds, dp);
  for (var i in deviceMap) {
    for (var k in deviceMap[i].slots) {
      for (var m in deviceMap[i].slots[k].ports) {
        if ((deviceMap[i].id == dd) && (deviceMap[i].slots[k].id == ds) && (deviceMap[i].slots[k].ports[m].id == dp)) {
          var goalWire = deviceMap[i].slots[k].ports[m].wire;
        }
      }
    }
  }
  for (var i in deviceMap) {
    for (var k in deviceMap[i].slots) {
      for (var m in deviceMap[i].slots[k].ports) {
        if (deviceMap[i].slots[k].ports[m].wire == goalWire) {deviceMap[i].slots[k].ports[m].wire = null};
      }
    }
  }
  for (var i in wires) {

    if (wires[i].id == goalWire) {delete wires[i];} 
  } 
  var rpid = goalWire.split('_'); 
  rpid = rpid[1];
  rpid = 'path_' + rpid;
  rpid = document.getElementById(rpid);
  console.log(rpid);
  rpid.parentNode.removeChild(rpid);    
}


//Перетаскивание эелемента, начало
function divDragStart(event) {
  if (renaming == true) {return false}
    else {
        var element = parentSearch(event.target);
        dragObject = element;
        var mainfield = document.getElementById("constructfield");
        event.preventDefault();
      };
}

//Перетаскивание эелемента, середина
function divDrag(e) {
  e = e || window.event;
  var parent = document.getElementById("constructfield");
  var mouse_x = e.clientX - parent.offsetLeft - 32;
  var mouse_y = e.clientY - parent.offsetTop - 32;  
  if (dragObject != null)  {    
    dragObject.style.left =  mouse_x + 'px';
    dragObject.style.top = mouse_y + 'px';
    // var tester = 0 + "px"; 
    if (dragObject.style.left < (0 + "px")) {dragObject.style.left =  0 + "px"; };
  };
  wireRendering(); 
}

//Перетаскивание эелемента, конец
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
  });  
  loadSlots(function(data) {
    fillSlots(data);
  });
  loadTopology(function(data) {
    fillTopology(data);
  });  

};
