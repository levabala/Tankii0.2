var svg = $("#SVGRoom");
var container = document.createElementNS("http://www.w3.org/2000/svg",'g');
var jqcontainer = $(container);
svg.append(container);

initWebRtc();

var tanksroom;
var mytank;
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
var joystickmap1 = function(tank){
  return{
    'up': tank.toTop,
    'right': tank.toRight,
    'down': tank.toBottom,
    'left': tank.toLeft,
  }
}
