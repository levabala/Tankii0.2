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
        if (tanksroom.objects[c]) {
          tanksroom.objects[c].setProperties(cc)
          for (var p in tanksroom.objects[c].VIEW_CHANGING_PROPERTIES)
            if (cc[tanksroom.objects[c].VIEW_CHANGING_PROPERTIES[p]]){
              tanksroom.objects[c].updateView();
              break;
            }
        }
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
      console.log(obj.color)
      var gameobj = new tanksroom.GameObjectTypes[obj.constructorName](new Pos(obj.pos.X, obj.pos.Y),tanksroom.map,obj.width,obj.height,obj.hp,obj.physical,obj.rotation,obj.speed,tanksroom.removeObject,tanksroom.appendObject,obj.color)
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
