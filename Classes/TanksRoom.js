function TanksRoom(map,jqcontainer){
  var tr = this;
  this.map = map;
  this.objects = {};

  //operations with objects
  var counter = 0;
  this.appendObject = function(obj){
    obj.id = counter;
    tr.objects[counter] = obj;
    jqcontainer.append(obj.svgBody);

    counter++;
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

  //game loop
  this.changedObjects = {};
  var gameInterval = setInterval(function(){
    for (var o in tr.objects){
      var obj = tr.objects[o];
      if (obj.tick()) tr.changedObjects[obj.id] = obj; //"true" result means successful moving/rotating
    }
  }, 16);

  //svg refresh loop
  setInterval(function(){
    $(jqcontainer).hide().show(0);
  },16);

  function ClearChanges(){
    tr.changedObjects = {};
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
        if (mgobj.map.field[mgobj.cellP.X+x][mgobj.cellP.Y+mgobj.height+1].obj.physical) return mgobj.map.field[mgobj.cellP.X+x][mgobj.cellP.Y+mgobj.height+1].obj;
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
    var changed = false;
    var collResult = checkCollisionFuns[mgobj.rotation.indexOf(1)]();
    if (!collResult)
      changed = move();
    else mgobj.collisionCaseAction(collResult);

    mgobj.IWantToDoSmth();
    console.log(changed,mgobj.IWantToDoSmth)
    if (changed) updateBodyPosition();
    return changed;
  }

  this.isVeryNear = function(){
    return ((mgobj.pos.X - Math.floor(mgobj.pos.X) <= mgobj.speed*1.1 || Math.ceil(mgobj.pos.X) - mgobj.pos.X <= mgobj.speed*1.1) && (mgobj.pos.Y - Math.floor(mgobj.pos.Y) <= mgobj.speed*1.1 || Math.ceil(mgobj.pos.Y) - mgobj.pos.Y <= mgobj.speed*1.1))
  }

  function rotate(newRotation){
    mgobj.rotation = newRotation;
  }

  function move(){
    if (!mgobj.moveOn) return false;
    mgobj.pos.X += (mgobj.rotation[1] * mgobj.speed - mgobj.rotation[3] * mgobj.speed) * mgobj.moveOn;
    mgobj.pos.Y += (mgobj.rotation[2] * mgobj.speed - mgobj.rotation[0] * mgobj.speed) * mgobj.moveOn;
    var newcellP = new Pos((mgobj.pos.X - Math.floor(mgobj.pos.X) < Math.ceil(mgobj.pos.X) - mgobj.pos.X) ? Math.floor(mgobj.pos.X) : Math.ceil(mgobj.pos.X), ((mgobj.pos.Y - Math.floor(mgobj.pos.Y) < Math.ceil(mgobj.pos.Y) - mgobj.pos.Y)) ? Math.floor(mgobj.pos.Y) : Math.ceil(mgobj.pos.Y));
    if (!mgobj.cellP.compareWith(newcellP)){
      updatemapPosition(mgobj.cellP, newcellP)
      mgobj.cellP = newcellP;
    }
    return true;
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
  //<editor-fold>

  function updateBodyPosition(){
    var r = mgobj.rotation[0] * 180 + mgobj.rotation[1] * 270 + mgobj.rotation[3] * 90;
    mgobj.svgBody.setAttributeNS(null,'transform', 'translate(' + (mgobj.pos.X) + ',' + (mgobj.pos.Y) + ') rotate(' + r + ',' + mgobj.width/2 + ',' + mgobj.height/2 + ')');
  }

  function updatemapPosition(oldP, newP){
    for (var dx = 0; dx < mgobj.width; dx++)
      for (var dy = 0; dy < mgobj.height; dy++)
        mgobj.map.field[oldP.X + dx][oldP.Y + dy].obj = {physical: false};

    for (var dx = 0; dx < mgobj.width; dx++)
      for (var dy = 0; dy < mgobj.height; dy++)
        mgobj.map.field[newP.X + dx][newP.Y + dy].obj = mgobj;
  }
}
