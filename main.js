var svg = $("#SVGRoom");
var container = document.createElementNS("http://www.w3.org/2000/svg",'g');
var jqcontainer = $(container);
svg.append(container);

initWebRtc();

var tanksroom;

function initTanksRoomServer(){
  var map1 = new Map(100,100);
  map1.fitToContainer(svg.width(), svg.height())
  //svg.append(map1.generateMesh())

  tanksroom = new TanksRoom(map1,container);
  tanksroom.appendObject(new Wall(new Pos(60,40), map1, 20, 30, 10, true, null, null, tanksroom.removeObject))

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

  var justTank = new Tank(new Pos(10,10), map1, 7, 7, 5, true, [0,1,0,0], 0.1, tanksroom.removeObject, tanksroom.appendObject)

  var kd1 = keymapdown1(justTank);
  var ku1 = keymapup1(justTank);
  var k1 = new KeyBoardHandler(window, kd1, ku1);
  justTank.setCommandsHandler(k1)

  tanksroom.appendObject(justTank);

  var GameSharingInterval = setInterval(function(){
    //console.log(tanksroom.changedObjects)
    for (var p in activePeers)
      peers[activePeers[p]].sendDataChannel.send(JSON.stringify({type: 'changes', value: tanksroom.changedObjects}))
    tanksroom.AcceptChanges();
  },16);
}

function AcceptClient(peer){
  peer.sendDataChannel.send(JSON.stringify({type: 'roomSnap', value: tanksroom.createShap()}))
}

function initTanksRoomClient(){
  var messagesMap = {
    'roomSnap': function(snap){
      console.log('snap:',snap)
      tanksroom = BuildTanksRoomFromSnap(snap, container);
      tanksroom.map.fitToContainer(svg.width(), svg.height());
    },
    'changes': function(changes){
      for (var c in changes){
        var cc = changes[c];
        if (cc.pos) cc.pos = new Pos(cc.pos.X, cc .pos.Y)
        //console.log(changes[c])
        tanksroom.objects[c].setProperties(changes[c])
      }
    },
    'yourTankCreated': function(id){

    },
    'notification': function(notify){
      console.log('notification:',notify)
    }
  }
  HostPeer.peerConnection.addEventListener('datachannel', function(){
    HostPeer.recevingDataChannel.onmessage = function(e){
      var mee = JSON.parse(e.data)
      messagesMap[mee.type](mee.value)
    }
  });
}
