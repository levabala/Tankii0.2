function TanksRoomServer(){
  TanksRoom.apply(this,arguments);
  var tr = this;

  this.teams = {
    Blue: new Team('Blue', 'darkblue'),
    Red: new Team('Red', 'brown'),
    Green: new Team('Green', 'green')
  };
  this.bots = {};

  /*setInterval(function(){
    console.log('---- TeamName, Kills, Deaths, Players, Teamkills')
    for (var t in tr.teams)
      console.log('\t',t,tr.teams[t].totalKills,tr.teams[t].totalDeaths,tr.teams[t].playersCount,tr.teams[t].teamKills)
  },100)*/

  this.addToTeam = function(player,teamName){
    var team;
    if (tr.teams[teamName])
      team = tr.teams[teamName];
    else {
      var smallest = tr.teams['Blue']; //'Blue' team is always here, yes?
      for (var t in tr.teams)
        if (t != 'Blue' && tr.teams[t].playersCount < smallest.playersCount) smallest = tr.teams[t];
      team = smallest;
    }

    tr.changeObjectProperty(player.id, 'color', team.color)
    team.addPlayer(player)
    //console.log(player.id,'to',team.name)
  }

  this.stp = {  //standartTankParams
    size: {width: 3, height: 3},
    hp: 5,
    rotation: [1,0,0,0],
    speed: 0.05,
    botColor: 'darkblue',
    playerColor: 'brown'
  }

  const maxTankSize = [3,3];
  const borderSize = 3;
  this.spawnAreas = [
    {lt: new Pos(borderSize,borderSize), rb: new Pos(tr.map.width-borderSize-maxTankSize[0],tr.map.height-borderSize-maxTankSize[1])} //lt - left top, rb - right bottom
  ]

  function getPositionToSpawn(){
    var spawnArea = tr.spawnAreas[randomInteger(0,tr.spawnAreas.length-1)];
    var x = randomInteger(spawnArea.lt.X,spawnArea.rb.X);
    var y = randomInteger(spawnArea.lt.Y,spawnArea.rb.Y);
    return new Pos(x,y);
  }

  this.registerPlayer = function(peer){
    //sending current room configuration
    peer.sendDataChannel.send(JSON.stringify({type: 'roomSnap', value: tanksroom.createSnap()}))

    //creating tank
    var clientTank = new Tank(new Pos(25,15), tanksroom.map, 3, 3, 5, true, [0,1,0,0], 0.04, tanksroom.removeObject, tanksroom.appendObject)

    //to control the tank
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
        if (clientTank.hp <= 0) return;
        commandsMap[comm]();
      }
    }

    //receiving player commands
    peer.recevingDataChannel.addEventListener('message',function(e){
      var m = JSON.parse(e.data);
      messagesMap[m.type](m.value)
    });
    peer['linkedTank'] = clientTank;


    //sending tank id to the player
    var tankId = tanksroom.appendObject(clientTank);
    console.log(clientTank, tankId)
    tanksroom.addToTeam(clientTank)
    peer.sendDataChannel.send(JSON.stringify({type: 'yourTankCreated', value: tankId}))
  }

  //sending to peers event about new object created (my english..)
  this.onObjectAdded = function(obj){
    var snap = obj.createSnap();
    snap.constructorName = obj.constructor.name
    for (var p in activePeers)
      peers[activePeers[p]].sendDataChannel.send(JSON.stringify({type: 'newObject', value: snap}))
  }

  //game updates interval
  this.gameSharingInterval = setInterval(function(){
    for (var p in activePeers)
      peers[activePeers[p]].sendDataChannel.send(JSON.stringify({type: 'changes', value: tr.changedObjects}))
    if (tr.removedObjects.length > 0)
      for (var p in activePeers)
        peers[activePeers[p]].sendDataChannel.send(JSON.stringify({type: 'removings', value: tr.removedObjects}))
    tr.AcceptChanges();
  },16);

  //hotkeys for room host
  window.onkeydown = function(e){
    switch (e.keyCode) {
      case 82:
        tr.restartHostTank();
        break;
      case 66:
    		//tr.addBots(1, 'RandomBot', 'Green');
    		tr.addBots(1, 'FunctionalBot', 'Red');
        tr.addBots(1, 'SuicideBot', 'Blue');
        break;
    }
  }

  //adding some stupid bots from available list
  this.addBots = function(count, botType,team){
  	for(var i = 0; i < count; i++){
  		var bot = new Tank(getPositionToSpawn(), tr.map, tr.stp.size.width, tr.stp.size.height, tr.stp.hp, true, tr.stp.rotation, tr.stp.speed, tr.removeObject, tr.appendObject, tr.stp.botColor)
  		tr.appendObject(bot);
      tr.addToTeam(bot,team);
      new availableBots[botType](bot)
  	}
  }

  var mapDrawingEnabled = false;
  this.enableMapDrawing = function(){
    if (mapDrawingEnabled) return;

    var downpos = new Pos(0,0)
    container.addEventListener('mousedown', function(e){
      e.preventDefault();
      var x = e.pageX - jqcontainer.offset().left;
      var y = e.pageY - jqcontainer.offset().top;
      downpos = new Pos(x,y)
    });

    container.addEventListener('mouseup', function(e){
      e.preventDefault();
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
      var w = new Wall(downpos, tr.map, uppos.X - downpos.X, uppos.Y - downpos.Y, (e.ctrlKey) ? 'deathless' : (uppos.X - downpos.X) * (uppos.Y - downpos.Y) / 2, true, null, null, tanksroom.removeObject)
      tanksroom.appendObject(w);
    });

    mapDrawingEnabled = true;
  }

  this.restartHostTank = function(){
    if (mytank.destructSelf) mytank.destructSelf();
    var justTank = new Tank(new Pos(5,5), tr.map, tr.stp.size.width, tr.stp.size.height, tr.stp.hp, true, tr.stp.rotation, tr.stp.speed+0.01/* >_< */, tr.removeObject, tr.appendObject, tr.stp.playerColor)
    mytank = justTank;

    var kd1 = keymapdown1(justTank);
    var ku1 = keymapup1(justTank);
    var jmap1 = joystickmap1(justTank);
    var k1 = new KeyBoardHandler(window, kd1, ku1);
    var j1 = new joystickHandler(joystick,jmap1,justTank.stop)
    justTank.setCommandsHandler(k1)
    justTank.setCommandsHandler(j1)

    tr.appendObject(justTank);
    tr.addToTeam(justTank)
  }
}


function initTanksRoomServer(){
  var map = new Map(mapWidth,mapHeight);
  map.fitToContainer(svg.width(), svg.height())
  //svg.append(map1.generateMesh())


  tanksroom = new TanksRoomServer(map,container);
  tanksroom.runGameLoop();
  tanksroom.appendObject(new Wall(new Pos(10,10), map, 10, 5, 10, true, null, null, tanksroom.removeObject))

  tanksroom.enableMapDrawing();
  tanksroom.restartHostTank();

  var interval = setInterval(function(){
    tanksroom.addBots(1, 'RandomBot', 'Green');
    tanksroom.addBots(1, 'FunctionalBot', 'Red');
    tanksroom.addBots(1, 'SuicideBot', 'Blue');
  },500);
  clearInterval(interval)

	//if(Math.random() > 0.5) tanksroom.addBots(2, 'RandomBot');
	//tanksroom.addBots(1, 'FunctionalBot');
  //tanksroom.addBots(1, 'SuicideBot');
  //tanksroom.addBots(2, 'RandomBot');
}
/*setInterval(function(){
	for(var i = 0; i < 10;i++)
	if (Math.random() > 0.5) tanksroom.addBots(1, 'RandomBot');
	else tanksroom.addBots(1, 'SuicideBot');
}, 30000);*/

function AcceptClient(peer){
  tanksroom.registerPlayer(peer);
}
