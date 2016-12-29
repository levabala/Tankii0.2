var svg = $("#SVGRoom");
var container = document.createElementNS("http://www.w3.org/2000/svg",'g');
var jqcontainer = $(container);
svg.append(container);

initWebRtc();

var tanksroom;
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

function initTanksRoomServer(){

  var map1 = new Map(170,100);
  map1.fitToContainer(svg.width(), svg.height())
  //svg.append(map1.generateMesh())

  tanksroom = new TanksRoom(map1,container);
  tanksroom.appendObject(new Wall(new Pos(60,40), map1, 20, 30, 10, true, null, null, tanksroom.removeObject))

  var justTank = new Tank(new Pos(10,10), map1, 7, 7, 5, true, [0,1,0,0], 0.2, tanksroom.removeObject, tanksroom.appendObject)

  var kd1 = keymapdown1(justTank);
  var ku1 = keymapup1(justTank);
  var k1 = new KeyBoardHandler(window, kd1, ku1);
  justTank.setCommandsHandler(k1)

  tanksroom.appendObject(justTank);
  tanksroom.appendObjectHandler = function(obj){
    var snap = obj.createSnap();
    snap.constructorName = obj.constructor.name
    for (var p in activePeers)
      peers[activePeers[p]].sendDataChannel.send(JSON.stringify({type: 'newObject', value: snap}))
  }

  var GameSharingInterval = setInterval(function(){
    for (var p in activePeers)
      peers[activePeers[p]].sendDataChannel.send(JSON.stringify({type: 'changes', value: tanksroom.changedObjects}))
    tanksroom.AcceptChanges();
  },16);
}

function AcceptClient(peer){
  peer.sendDataChannel.send(JSON.stringify({type: 'roomSnap', value: tanksroom.createShap()}))

  var clientTank = new Tank(new Pos(20,20), tanksroom.map, 7, 7, 5, true, [0,1,0,0], 0.1, tanksroom.removeObject, tanksroom.appendObject)
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
  var crazyWaitTimeComboLimit = 1;

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
        //console.log(changes[c])
        tanksroom.objects[c].setProperties(changes[c])
      }      
      lastTime = performance.now();
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

  var k1 = new KeyBoardHandler(window, keymapdown1, keymapup1)

  HostPeer.peerConnection.addEventListener('datachannel', function(){
    HostPeer.recevingDataChannel.onmessage = function(e){
      var mee = JSON.parse(e.data)
      messagesMap[mee.type](mee.value)
    }
  });

  function send(comm){
    HostPeer.sendDataChannel.send(JSON.stringify({type: 'command', value:comm}));
  }
}
