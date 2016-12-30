var svg = $("#SVGRoom");
var container = document.createElementNS("http://www.w3.org/2000/svg",'g');
var jqcontainer = $(container);
svg.append(container);

initWebRtc();

var tanksroom;
var mytank;
var keymapdown1 = function(tank){
  return {
    38: function(){
      tank.toTop();
    },
    39: function(){
      tank.toRight();
    },
    40: function(){
      tank.toBottom();
    },
    37: function(){
      tank.toLeft();
    }
  }
}
var keymapup1 = function(tank){
  return {
    38: function(){
      tank.stop();
    },
    39: function(){
      tank.stop();
    },
    40: function(){
      tank.stop();
    },
    37: function(){
      tank.stop();
    },
    32: function(){
      tank.shoot();
    }
  }
}
var joystickmap1 = function(tank){
  return{
    'up': tank.toTop,
    'right': tank.toRight,
    'down': tank.toBottom,
    'left': tank.toLeft,
  }
}

function initTanksRoomServer(){
  var map1 = new Map(30,20);
  map1.fitToContainer(svg.width(), svg.height())
  //svg.append(map1.generateMesh())

  tanksroom = new TanksRoom(map1,container);
  tanksroom.appendObject(new Wall(new Pos(10,10), map1, 10, 5, 10, true, null, null, tanksroom.removeObject))

  restartMyTank();

  tanksroom.appendObjectHandler = function(obj){
    var snap = obj.createSnap();
    snap.constructorName = obj.constructor.name
    for (var p in activePeers)
      peers[activePeers[p]].sendDataChannel.send(JSON.stringify({type: 'newObject', value: snap}))
  }

  var GameSharingInterval = setInterval(function(){
    for (var p in activePeers)
      peers[activePeers[p]].sendDataChannel.send(JSON.stringify({type: 'changes', value: tanksroom.changedObjects}))
    if (tanksroom.removedObjects.length > 0)
      for (var p in activePeers)
        peers[activePeers[p]].sendDataChannel.send(JSON.stringify({type: 'removings', value: tanksroom.removedObjects}))
    tanksroom.AcceptChanges();
  },16);

  window.onkeyup = function(e){
    if (e.keyCode == 82)
    restartMyTank();
  }

  function restartMyTank(){
    if (mytank) mytank.destructSelf();
    var justTank = new Tank(new Pos(5,5), map1, 3, 3, 5, true, [0,1,0,0], 0.05, tanksroom.removeObject, tanksroom.appendObject)
    mytank = justTank;

    var kd1 = keymapdown1(justTank);
    var ku1 = keymapup1(justTank);
    var jmap1 = joystickmap1(justTank);
    var k1 = new KeyBoardHandler(window, kd1, ku1);
    var j1 = new joystickHandler(joystick,jmap1,justTank.stop)
    justTank.setCommandsHandler(k1)
    justTank.setCommandsHandler(j1)

    tanksroom.appendObject(justTank);
  }
}

function AcceptClient(peer){
  peer.sendDataChannel.send(JSON.stringify({type: 'roomSnap', value: tanksroom.createShap()}))

  var clientTank = new Tank(new Pos(25,15), tanksroom.map, 3, 3, 5, true, [0,1,0,0], 0.04, tanksroom.removeObject, tanksroom.appendObject)
  var commandsMap = {
    'toLeft': function(){
      clientTank.toLeft();
    },
    'toRight': function(){
      clientTank.toRight();
    },
    'toTop': function(){
      clientTank.toTop();
    },
    'toBottom': function(){
      clientTank.toBottom();
    },
    'stop': function(){
      clientTank.stop();
    },
    'shoot': function(){
      clientTank.shoot();
    }
  }

  var messagesMap = {
    'command': function(comm){
      commandsMap[comm]();
    }
  }

  peer.recevingDataChannel.addEventListener('message',function(e){
    var m = JSON.parse(e.data);
    messagesMap[m.type](m.value)
  });
  peer['linkedTank'] = clientTank;

  peer.recevingDataChannel.onclose = function(){
    console.warn('Неееееет... Мы потеряли игрока..');
  }

  peer.sendDataChannel.send(JSON.stringify({type: 'yourTankCreated', value: tanksroom.appendObject(clientTank)}))
}

function initTanksRoomClient(){
  var lastTime = 0;
  var waitTimeLimit = 500;
  var crazyWaitTimeCombo = 0;
  var crazyWaitTimeComboLimit = 3;

  var messagesMap = {
    'roomSnap': function(snap){
      console.log('snap:',snap)
      tanksroom = BuildTanksRoomFromSnap(snap, container);
      tanksroom.map.fitToContainer(svg.width(), svg.height());
    },
    'changes': function(changes){
      var waitTime = performance.now() - lastTime;
      if (waitTime > waitTimeLimit) crazyWaitTimeCombo++;
      else {
        crazyWaitTimeCombo = 0;
        HideModal();
      }
      if (crazyWaitTimeCombo > crazyWaitTimeComboLimit) ShowModal();

      for (var c in changes){
        var cc = changes[c];
        if (cc.pos) cc.pos = new Pos(cc.pos.X, cc .pos.Y)
        if (tanksroom.objects[c]) tanksroom.objects[c].setProperties(changes[c])
      }
      lastTime = performance.now();
    },
    'removings': function(arr){
      for (var a in arr)
        tanksroom.removeObject(tanksroom.objects[arr[a]]);
    },
    'yourTankCreated': function(id){
      console.log('Yeeah! Now I have a tank!')
    },
    'newObject': function(obj){
      console.log('NEW OBJECT')
      var gameobj = new tanksroom.GameObjectTypes[obj.constructorName](new Pos(obj.pos.X, obj.pos.Y),tanksroom.map,obj.width,obj.height,obj.hp,obj.physical,obj.rotation,obj.speed,tanksroom.removeObject,tanksroom.appendObject)
      gameobj.id = obj.id;
      tanksroom.setObject(gameobj.id, gameobj)
    },
    /*'removeObject': function(id){
      if (typeof tanksroom.objects[id] != 'undefined') tanksroom.removeObject(tanksroom.objects[id]);
    }*/
    'notification': function(notify){
      console.log('notification:',notify)
    }
  }

  var keymapdown1 = {
    38: function(){
      send('toTop');
    },
    39: function(){
      send('toRight');
    },
    40: function(){
      send('toBottom');
    },
    37: function(){
      send('toLeft');
    }
  }
  var keymapup1 = {
    38: function(){
      send('stop');
    },
    39: function(){
      send('stop');
    },
    40: function(){
      send('stop');
    },
    37: function(){
      send('stop');
    },
    32: function(){
      send('shoot');
    }
  }
  var joystickmap1 = {
    'up': function(){send('toTop')},
    'right': function(){send('toRight')},
    'down': function(){send('toBottom')},
    'left': function(){send('toLeft')}
  }

  var k1 = new KeyBoardHandler(window, keymapdown1, keymapup1)
  var j1 = new joystickHandler(joystick,joystickmap1,function(){send('stop')})

  HostPeer.peerConnection.addEventListener('datachannel', function(){
    HostPeer.recevingDataChannel.onmessage = function(e){
      var mee = JSON.parse(e.data)
      messagesMap[mee.type](mee.value)
    }
  });

  mytank = {
    shoot: function(){
      send('shoot')
    }
  }

  function send(comm){
    HostPeer.sendDataChannel.send(JSON.stringify({type: 'command', value:comm}));
  }
}
