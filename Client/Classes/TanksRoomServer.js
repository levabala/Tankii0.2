function randomInteger(min, max) {
  var rand = min + Math.random() * (max - min)
  rand = Math.round(rand);
  return rand;
}
var map1
function addBot(count){
		for(var i = 0; i<count;i++){
			var bot = new Tank(new Pos(randomInteger(3,mapWidth-6),randomInteger(3,mapHeight-6)), map1, 3, 3, 5, true, [0,1,0,0], 0.05, tanksroom.removeObject, tanksroom.appendObject)
			tanksroom.appendObject(bot);
			RandomBot(bot)
		}

	}
function initTanksRoomServer(){
  map1 = new Map(mapWidth,mapHeight);
  map1.fitToContainer(svg.width(), svg.height())
  //svg.append(map1.generateMesh())


  tanksroom = new TanksRoom(map1,container);
  tanksroom.appendObject(new Wall(new Pos(10,10), map1, 10, 5, 10, true, null, null, tanksroom.removeObject))

  restartMyTank();
	addBot(2);

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

  window.onkeydown = function(e){
    switch (e.keyCode) {
      case 82:
        restartMyTank();
        break;
      case 66:
        addBot(1);
        break;
    }
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

  var downpos = new Pos(0,0)
  container.addEventListener('mousedown', function(e){
    var x = e.pageX - jqcontainer.offset().left;
    var y = e.pageY - jqcontainer.offset().top;
    downpos = new Pos(x,y)
  });

  container.addEventListener('mouseup', function(e){
    var x = e.pageX - jqcontainer.offset().left;
    var y = e.pageY - jqcontainer.offset().top;
    var uppos = new Pos(x,y)

    var buf = 0;
    if (downpos.X > uppos.X){
      buf = uppos.X;
      uppos.X = downpos.X;
      downpos.X = buf;
    }
    if (downpos.Y > uppos.Y){
      buf = uppos.Y;
      uppos.Y = downpos.Y;
      downpos.Y = buf;
    }
    downpos.X /= tanksroom.map.xcoeff;
    uppos.X /= tanksroom.map.xcoeff;
    downpos.Y /= tanksroom.map.ycoeff;
    uppos.Y /= tanksroom.map.ycoeff;
    downpos = new Pos(Math.floor(downpos.X), Math.floor(downpos.Y))
    uppos = new Pos(Math.floor(uppos.X), Math.floor(uppos.Y))
    console.log(downpos,uppos)
    var w = new Wall(downpos, map1, uppos.X - downpos.X, uppos.Y - downpos.Y, 10, true, null, null, tanksroom.removeObject)
    tanksroom.appendObject(w);
  });
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
