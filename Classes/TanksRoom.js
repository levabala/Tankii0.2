function BuildTanksRoomFromSnap(snap,container){
  var map = new Map(snap.map.width,snap.map.height);
  map.fitToContainer(svg.width(), svg.height())
  var tanksroom = new TanksRoom(map,container);
  for (var constr in snap.objects)
    for (var o in snap.objects[constr]){
      var objSnap = snap.objects[constr][o];
      var gameObj = new tanksroom.GameObjectTypes[constr](new Pos(objSnap.pos.X, objSnap.pos.Y),map,objSnap.width,objSnap.height,objSnap.hp,objSnap.physical,objSnap.rotation,objSnap.speed)
      gameObj.id = objSnap.id;
      console.log('OOOOObj:',gameObj)
      tanksroom.setObject(gameObj.id, gameObj)
      //pos,map,width,height,hp,physical,rotation,speed,commandsHandler,destructSelfFun,createChildFun
    }
  return tanksroom
}

function TanksRoom(map,jqcontainer){
  var tr = this;
  this.map = map;
  this.objects = {};

  //available Game Objects
  this.GameObjectTypes = {
    'Tank': Tank,
    'Wall': Wall,
    'Shell': Shell
  };

  //operations with objects
  var counter = 0;
  this.appendObject = function(obj){
    console.log('obj.id:', counter)
    obj.id = counter;
    tr.objects[counter] = obj;
    jqcontainer.append(obj.svgBody);

    //set it to the map
    for (var dx = 0; dx < obj.width; dx++)
      for (var dy = 0; dy < obj.height; dy++)
        tr.map.field[obj.cellP.X + dx][obj.cellP.Y + dy].obj = obj;

    counter++;
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
    jqcontainer.remove(obj.svgBody)
    delete tr.objects[obj.id];
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
  this.changedObjects = {};
  var gameInterval = setInterval(function(){
    for (var o in tr.objects){
      var obj = tr.objects[o];
      if (obj.tick()) tr.changedObjects[o] = {pos: obj.pos, rotation: obj.rotation, hp: obj.hp}; //"true" result means successful moving/rotating
    }
  }, 1);

  this.AcceptChanges = function(){
    tr.changedObjects = {};
  }

  //svg refresh loop
  setInterval(function(){
    $(jqcontainer).hide().show(0);
  },16);

  this.createShap = function(){
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

function GameObject(pos,map,width,height,hp,physical,rotation,speed,commandsHandler,destructSelfFun,createChildFun){
  var gobj = this;

  //base props
  this.pos = pos;
  this.cellP = pos.clone();
  this.map = map;
  this.width = width;
  this.height = height;
  this.rotation = rotation; // example: [1,0,0,0]  common view: [top,right,bottom,left]
  this.speed = speed;
  this.physical = physical; //is it an obstance or not
  this.body = null;
  this.id = null;

  //external access
  this.destructSelfFun = destructSelfFun;
  this.createChildFun = createChildFun;
  this.commandsHandler = commandsHandler;

  //object's doings
  this.tick = function(){

  }

  this.damaged = function(damage){

  }

  this.destructSelf = function(){
    mgobj.svgBody.setAttributeNS(null,'width','0');
    mgobj.svgBody.setAttributeNS(null,'height','0');
  }

  //generate and set "body" tag
  this.createBaseBody = function(obj){
    var r = (obj.rotation) ? obj.rotation[0] * 180 + obj.rotation[1] * 270 + obj.rotation[3] * 90 : 0;
    obj.svgBody = document.createElementNS("http://www.w3.org/2000/svg",'g');
    setAttr(obj.svgBody, 'transform', 'translate(' + obj.pos.X + ',' + obj.pos.Y  + ') rotate(' + r + ',' + obj.width/2 + ',' + obj.height/2 + ')');
    setAttr(obj.svgBody, 'width', obj.width);
    setAttr(obj.svgBody, 'height', obj.height);
  }

  //additional view elements
  this.generateView = function(obj){

  }

  //base view generation
  this.createBaseBody(this);

  //span for recreating
  this.createSnap = function(){
    return {id: gobj.id, pos: gobj.pos, width: gobj.width, height: gobj.height, hp: gobj.hp, physical: gobj.physical, rotation: gobj.rotation, speed: gobj.speed};
  }

  this.setProperties = function(props){
    for (var p in props){
      gobj[p] = props[p]
    }
    gobj.updateSvgBody();
  }

  this.updateSvgBody = function(){
    var r = gobj.rotation[0] * 180 + gobj.rotation[1] * 270 + gobj.rotation[3] * 90;
    gobj.svgBody.setAttributeNS(null,'transform', 'translate(' + (gobj.pos.X) + ',' + (gobj.pos.Y) + ') rotate(' + r + ',' + gobj.width/2 + ',' + gobj.height/2 + ')');
  }
}

function MovableGameObject(){
  //inheriting
  GameObject.apply(this,arguments);
  var mgobj = this;

  //things to do when tick() occur
  this.IWantToDoSmth = function(){

  };

  //is it moving now (triggered)
  this.moveOn = 0;

  //collision functions
  var checkCollisionFuns = {
    //key is rotation.indexOf(1), so 0 = top, 1 = right, 2 = bottom, 3 = left, -1 = invalid rotation.
    //results:
    //"false" - all is okay
    //else - return object with which the collision occurred
    0: function(){
      for (var x = 0; x < mgobj.width; x++)
        if (mgobj.map.field[mgobj.cellP.X+x][mgobj.cellP.Y-1].obj.physical) return mgobj.map.field[mgobj.cellP.X+x][mgobj.cellP.Y-1].obj;
      return false;
    },
    1: function(){
      for (var y = 0; y < mgobj.height; y++)
        if (mgobj.map.field[mgobj.cellP.X+mgobj.width][mgobj.cellP.Y+y].obj.physical) return mgobj.map.field[mgobj.cellP.X+mgobj.width][mgobj.cellP.Y+y].obj;
      return false;
    },
    2: function(){
      for (var x = 0; x < mgobj.width; x++)
        if (mgobj.map.field[mgobj.cellP.X+x][mgobj.cellP.Y+mgobj.height].obj.physical) return mgobj.map.field[mgobj.cellP.X+x][mgobj.cellP.Y+mgobj.height+1].obj;
      return false;
    },
    3: function(){
      for (var y = 0; y < mgobj.height; y++)
        if (mgobj.map.field[mgobj.cellP.X-1][mgobj.cellP.Y+y].obj.physical) return mgobj.map.field[mgobj.cellP.X-1][mgobj.cellP.Y+y].obj;
      return false;
    },
    '-1': function(){
      return false;
    }
  }

  //additional action
  this.collisionCaseAction = function(obj){

  }

  //overriting
  this.tick = function(){
    var collResult = checkCollisionFuns[mgobj.rotation.indexOf(1)]();
    if (collResult) {
      mgobj.stop();
      mgobj.collisionCaseAction(collResult);
    }
    mgobj.IWantToDoSmth();

    var changed = mgobj.moveOn;
    move();

    if (changed) mgobj.updateSvgBody();
    return changed;
  }

  this.isVeryNear = function(){
    return ((mgobj.pos.X - Math.floor(mgobj.pos.X) <= mgobj.speed*1.1 || Math.ceil(mgobj.pos.X) - mgobj.pos.X <= mgobj.speed*1.1) && (mgobj.pos.Y - Math.floor(mgobj.pos.Y) <= mgobj.speed*1.1 || Math.ceil(mgobj.pos.Y) - mgobj.pos.Y <= mgobj.speed*1.1))
  }

  function rotate(newRotation){
    mgobj.rotation = newRotation;
  }

  function move(){
    mgobj.pos.X += (mgobj.rotation[1] * mgobj.speed - mgobj.rotation[3] * mgobj.speed) * mgobj.moveOn;
    mgobj.pos.Y += (mgobj.rotation[2] * mgobj.speed - mgobj.rotation[0] * mgobj.speed) * mgobj.moveOn;
    var newcellP = new Pos((mgobj.pos.X - Math.floor(mgobj.pos.X) < Math.ceil(mgobj.pos.X) - mgobj.pos.X) ? Math.floor(mgobj.pos.X) : Math.ceil(mgobj.pos.X), ((mgobj.pos.Y - Math.floor(mgobj.pos.Y) < Math.ceil(mgobj.pos.Y) - mgobj.pos.Y)) ? Math.floor(mgobj.pos.Y) : Math.ceil(mgobj.pos.Y));
    if (!mgobj.cellP.compareWith(newcellP)){
      updatemapPosition(mgobj.cellP, newcellP)
      mgobj.cellP = newcellP;
    }
  }

  //<editor-fold> External commands
  this.toTop = function(){
    initWaitingToRotate([1,0,0,0])
  }

  this.toRight = function(){
    initWaitingToRotate([0,1,0,0])
  }

  this.toBottom = function(){
    initWaitingToRotate([0,0,1,0])
  }

  this.toLeft = function(){
    initWaitingToRotate([0,0,0,1])
  }

  this.stop = function(){
    if (mgobj.moveOn == 0) return;
    //mgobj.stopping = true;
    mgobj.IWantToDoSmth = function(){
      if (mgobj.isVeryNear()){
        mgobj.pos = new Pos((mgobj.pos.X - Math.floor(mgobj.pos.X) < Math.ceil(mgobj.pos.X) - mgobj.pos.X) ? Math.floor(mgobj.pos.X) : Math.ceil(mgobj.pos.X), ((mgobj.pos.Y - Math.floor(mgobj.pos.Y) < Math.ceil(mgobj.pos.Y) - mgobj.pos.Y)) ? Math.floor(mgobj.pos.Y) : Math.ceil(mgobj.pos.Y));
        mgobj.moveOn = 0;
        mgobj.IWantToDoSmth = function(){};
      }
    }
  }

  //external commands
  this.commands = {
    'toLeft': mgobj.toLeft,
    'toRight': mgobj.toRight,
    'toTop': mgobj.toTop,
    'toBottom': mgobj.toBottom,
    'toStop': mgobj.toStop
  }

  this.setKeyBoardHandler = function(kbh){
    mgobj.kbhandler = kbh;
  }

  function initWaitingToRotate(rotation){
    if (mgobj.rotation == rotation) return;
    if (!checkCollisionFuns[rotation.indexOf(1)]())
      mgobj.IWantToDoSmth = function(){
        if (mgobj.isVeryNear()){
          mgobj.rotation = rotation
          mgobj.moveOn = 1;
          mgobj.IWantToDoSmth = function(){};
        }
      }
    else
      mgobj.IWantToDoSmth = function(){
        if (mgobj.isVeryNear()){
          mgobj.rotation = rotation
          mgobj.IWantToDoSmth = function(){};
        }
      }
  }
  //</editor-fold>

  function updatemapPosition(oldP, newP){
    for (var dx = 0; dx < mgobj.width; dx++)
      for (var dy = 0; dy < mgobj.height; dy++)
        mgobj.map.field[oldP.X + dx][oldP.Y + dy].obj = {physical: false};

    for (var dx = 0; dx < mgobj.width; dx++)
      for (var dy = 0; dy < mgobj.height; dy++)
        mgobj.map.field[newP.X + dx][newP.Y + dy].obj = mgobj;
  }
}
