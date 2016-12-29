function Pos(x,y){
  var pp = this;
  this.X = x;
  this.Y = y;

  this.lengthBetween = function(p1,p2){
    return Math.sqrt(Math.pow(p1.X - p2.X,2) + Math.pow(p1.Y - p2.Y,2));
  }

  this.clone = function(){
    return new Pos(pp.X,pp.Y);
  }

  this.sum = function(p2){
    return new Pos(pp.X + p2.X, pp.Y + p2.Y);
  }

  this.isInto = function(lb,rb,tb,bb){
    if (x >= lb && x <= rb && y >= tb && y <= bb)
      return true;
    return false;
  }

  this.compareWith = function(p2){
    return pp.X == p2.X && pp.Y == p2.Y;
  }
}

function setAttr(obj,attr,value){
  obj.setAttributeNS(null,attr,value);
}

function KeyBoardHandler(element, keymapdown, keymapup){
  var elements = {};
  var buffer = [];
  element.addEventListener('keydown', keydown);
  element.addEventListener('keyup', keyup);

  function keyup(e){
    if (typeof keymapup[e.keyCode] != 'undefined')
      keymapup[e.keyCode]();

    var bnew = [];
    for (var b = 0; b < buffer.length; b++)
      if (buffer[b] != e.keyCode)
        bnew[bnew.length] = buffer[b];
    buffer = bnew;
  }

  function keydown(e){
    if (typeof keymapdown[e.keyCode] != 'undefined' || typeof keymapup[e.keyCode] != 'undefined')
      buffer[buffer.length] = e.keyCode;
  }

  var interval = setInterval(function(){
    if (buffer.length > 0)
      if (typeof keymapdown[buffer[buffer.length-1]] != 'undefined')
        keymapdown[buffer[buffer.length-1]]();
  }, 16);

  this.disable = function(){
    clearInterval(interval);
    element.removeEventListener('keydown', keydown);
    element.removeEventListener('keyup', keyup);
  }
}
