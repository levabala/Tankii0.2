function MovableGameObject(){
  //inheriting
  GameObject.apply(this,arguments);
  var mgobj = this;

  //things to do when tick() occur
  this.IWantToDoSmth = function(){
    return false;
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
      for (var x = 0; x < mgobj.width; x++){
        var obj = mgobj.map.field[mgobj.cellP.X+x][mgobj.cellP.Y-1].obj;
        if (obj.physical) return obj; // && obj.id != mgobj.id
      }
      return false;
    },
    1: function(){
      for (var y = 0; y < mgobj.height; y++)
        if (mgobj.map.field[mgobj.cellP.X+mgobj.width][mgobj.cellP.Y+y].obj.physical) return mgobj.map.field[mgobj.cellP.X+mgobj.width][mgobj.cellP.Y+y].obj;
      return false;
    },
    2: function(){
      for (var x = 0; x < mgobj.width; x++)
        if (mgobj.map.field[mgobj.cellP.X+x][mgobj.cellP.Y+mgobj.height].obj.physical) return mgobj.map.field[mgobj.cellP.X+x][mgobj.cellP.Y+mgobj.height].obj;
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
    var lastR = mgobj.rotation;

    if (mgobj.isVeryNear()){
      var newcellP = new Pos((mgobj.pos.X - Math.floor(mgobj.pos.X) < Math.ceil(mgobj.pos.X) - mgobj.pos.X) ? Math.floor(mgobj.pos.X) : Math.ceil(mgobj.pos.X), ((mgobj.pos.Y - Math.floor(mgobj.pos.Y) < Math.ceil(mgobj.pos.Y) - mgobj.pos.Y)) ? Math.floor(mgobj.pos.Y) : Math.ceil(mgobj.pos.Y));
      if (!mgobj.cellP.compareWith(newcellP)){
        updatemapPosition(mgobj.cellP, newcellP);
        mgobj.cellP = newcellP;
      }

      mgobj.IWantToDoSmth();

      var collResult = checkCollisionFuns[mgobj.rotation.indexOf(1)]();
      if (collResult) {
        mgobj.stop();
        mgobj.collisionCaseAction(collResult);
        mgobj.IWantToDoSmth();
      }

      changed = true;
    }

    changed = changed || mgobj.moveOn || lastR != mgobj.rotation || mgobj.wasDamaged;

    move();

    if (changed) mgobj.updateSvgBody();
    mgobj.wasDamaged = false;
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
        RoundPosition();
        mgobj.moveOn = 0;
        mgobj.IWantToDoSmth = function(){};
    }
  }

  function RoundPosition(){
    mgobj.pos = new Pos((mgobj.pos.X - Math.floor(mgobj.pos.X) < Math.ceil(mgobj.pos.X) - mgobj.pos.X) ? Math.floor(mgobj.pos.X) : Math.ceil(mgobj.pos.X), ((mgobj.pos.Y - Math.floor(mgobj.pos.Y) < Math.ceil(mgobj.pos.Y) - mgobj.pos.Y)) ? Math.floor(mgobj.pos.Y) : Math.ceil(mgobj.pos.Y));
  }

  //external commands
  this.commands = {
    'toLeft': mgobj.toLeft,
    'toRight': mgobj.toRight,
    'toTop': mgobj.toTop,
    'toBottom': mgobj.toBottom,
    'toStop': mgobj.toStop
  }

  this.setCommandsHandler = function(ch){
    mgobj.commandsHandlers.push(ch);
  }

  function initWaitingToRotate(rotation){
    if (mgobj.rotation == rotation) return;
    if (!checkCollisionFuns[rotation.indexOf(1)]())
      mgobj.IWantToDoSmth = function(){
          mgobj.rotation = rotation
          mgobj.moveOn = 1;
          mgobj.IWantToDoSmth = function(){};
      }
    else
      mgobj.IWantToDoSmth = function(){
          mgobj.rotation = rotation
          mgobj.IWantToDoSmth = function(){};
      }
  }
  //</editor-fold>

  function updatemapPosition(oldP, newP){
    for (var dx = 0; dx < mgobj.width; dx++)
      for (var dy = 0; dy < mgobj.height; dy++){
        mgobj.map.field[oldP.X + dx][oldP.Y + dy].obj = {physical: false, id: null};
      }

    for (var dx = 0; dx < mgobj.width; dx++)
      for (var dy = 0; dy < mgobj.height; dy++){
        //if (mgobj.map.field[newP.X + dx][newP.Y + dy].obj.physical) throw 'Allah Akbar'
        mgobj.map.field[newP.X + dx][newP.Y + dy].obj = mgobj;
      }
    RoundPosition();
  }
}
