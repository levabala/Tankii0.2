function TanksRoom(map,jqcontainer){
  var tr = this;
  this.map = map;
  this.objects = {};
  this.changedObjects = {};
  this.removedObjects = [];

  //available Game Objects
  this.GameObjectTypes = {
    'Tank': Tank,
    'Wall': Wall,
    'Shell': Shell
  };

  //operations with objects
  var counter = 0;
  this.appendObject = function(obj){
    obj.svgBody.ondblclick = function(){
        obj.destructSelf();
    }

    obj.id = counter;
    tr.objects[counter] = obj;
    tr.changedObjects[obj.id] = {}
    jqcontainer.append(obj.svgBody);

    //set it to the map
    for (var dx = 0; dx < obj.width; dx++)
      for (var dy = 0; dy < obj.height; dy++)
        tr.map.field[obj.cellP.X + dx][obj.cellP.Y + dy].obj = obj;

    counter++;
    tr.onObjectAdded(obj);
    return obj.id;
  }

  this.onObjectAdded = function(obj){

  }

  this.destructThemAll = function(){
    for (var o in tr.objects)
      if (tr.objects[o].destructSelfFun) tr.objects[o].destructSelf();
  }

  this.setObject = function(id,obj){
    obj.id = id;
    tr.objects[id] = obj;
    jqcontainer.append(obj.svgBody);

    //set it to the map
    for (var dx = 0; dx < obj.width; dx++)
      for (var dy = 0; dy < obj.height; dy++)
        tr.map.field[obj.cellP.X + dx][obj.cellP.Y + dy].obj = obj;

    if (counter <= id) counter = id + 1;
  }

  this.appendObjects = function(objs){
    for (var o in objs)
      tr.appendObject(objs[o])
  }

  this.removeObject = function(obj){
    if (!obj) return;

    obj.hp = 0;
    obj.svgBody.remove()
    tr.removedObjects.push(obj.id)

    for (var dx = 0; dx < obj.width; dx++)
      for (var dy = 0; dy < obj.height; dy++)
        tr.map.field[obj.cellP.X + dx][obj.cellP.Y + dy].obj = {physical: false, id: '|'};

    delete tr.objects[obj.id];
    delete obj;
  }

  //background
  this.ground = document.createElementNS("http://www.w3.org/2000/svg",'rect');
  setAttr(this.ground, 'x', 0);
  setAttr(this.ground, 'y', 0);
  setAttr(this.ground, 'width', this.map.width);
  setAttr(this.ground, 'height', this.map.height);
  setAttr(this.ground, 'fill', 'lightgreen');
  setAttr(this.ground, 'style', 'fill-opacity: 0.3');
  jqcontainer.append(this.ground)

  //this.map scaling
  setAttr(jqcontainer, 'transform','scale('+this.map.xcoeff+','+this.map.ycoeff+')');

  //map borders
  var leftWall = new Wall(new Pos(0,0),tr.map,2,this.map.height,999);
  var rightWall = new Wall(new Pos(this.map.width-2,0),tr.map,2,this.map.height,999);
  var topWall = new Wall(new Pos(2,0),tr.map,this.map.width-2,2,999);
  var bottomWall = new Wall(new Pos(2,this.map.height-2),tr.map,this.map.width-2,2,999);
  this.appendObjects([leftWall,rightWall,topWall,bottomWall]);

  //game loop
  this.runGameLoop = function(){
    var gameInterval = setInterval(function(){
      for (var o in tr.objects){
        var obj = tr.objects[o];
        if (obj.tick()){  //"true" result means successful moving/rotating
          var changeObj = tr.changedObjects[o];
          changeObj['pos'] = obj.pos;
          changeObj['rotation'] = obj.rotation;
          changeObj['hp'] = obj.pos;
        }
      }
    }, 4);
  }

  this.changeObjectProperty = function(objId, propertyName, value){
    tr.objects[objId][propertyName] = value;
    tr.objects[objId].updateView();
    
    if (!tr.changedObjects[objId]) tr.changedObjects[objId] = {};
    tr.changedObjects[objId][propertyName] = value;
  }

  this.stopGameLoop = function(){
    clearInterval(gameInterval)
  }

  this.AcceptChanges = function(){
    tr.changedObjects = {};
    for (var o in tr.objects)
      tr.changedObjects[o] = {};
    tr.removedObjects = [];
  }

  //svg refresh loop
  if (screen.width > 900)
    setInterval(function(){
      $(jqcontainer).hide().show(0);
    },500);

  this.createSnap = function(){
    var snaps = {objects: {}, map: {}};
    for (var t in tr.GameObjectTypes)
      snaps.objects[t] = [];
    for (var o in tr.objects){
      var object = tr.objects[o]
      var snap = object.createSnap();
      snaps.objects[object.constructor.name].push(snap);
    }
    snaps.map = {width: tr.map.width, height: tr.map.height};

    return snaps;
  }
}

function BuildTanksRoomFromSnap(snap,container){
  var map = new Map(snap.map.width,snap.map.height);
  map.fitToContainer(svg.width(), svg.height())
  var tanksroom = new TanksRoom(map,container);
  for (var constr in snap.objects)
    for (var o in snap.objects[constr]){
      var objSnap = snap.objects[constr][o];
      var gameObj = new tanksroom.GameObjectTypes[constr](new Pos(objSnap.pos.X, objSnap.pos.Y),map,objSnap.width,objSnap.height,objSnap.hp,objSnap.physical,objSnap.rotation,objSnap.speed,tanksroom.removeObject,tanksroom.appendObject,objSnap.color)
      gameObj.id = objSnap.id;
      tanksroom.setObject(gameObj.id, gameObj)
    }
  return tanksroom
}

function BuildTanksRoomServerFromSnap(snap,container){
  var map = new Map(snap.map.width,snap.map.height);
  map.fitToContainer(svg.width(), svg.height())
  var tanksroom = new TanksRoomServer(map,container);
  for (var constr in snap.objects)
    for (var o in snap.objects[constr]){
      var objSnap = snap.objects[constr][o];
      var gameObj = new tanksroom.GameObjectTypes[constr](new Pos(objSnap.pos.X, objSnap.pos.Y),map,objSnap.width,objSnap.height,objSnap.hp,objSnap.physical,objSnap.rotation,objSnap.speed,tanksroom.removeObject,tanksroom.appendObject,objSnap.color)
      gameObj.id = objSnap.id;
      tanksroom.setObject(gameObj.id, gameObj)
    }
  return tanksroom
}
