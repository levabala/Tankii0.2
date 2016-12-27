var svg = $("#SVGRoom");
var container = document.createElementNS("http://www.w3.org/2000/svg",'g');
var jqcontainer = $(container);
svg.append(container);

var map1 = new Map(30,30);
map1.fitToContainer(svg.width(), svg.height())

var tanksroom1 = new TanksRoom(map1,container);
tanksroom1.appendObject(new Wall(new Pos(20,20), map1, 5, 5, 10, true))

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

var justCar = new Tank(new Pos(10,10), map1, 2, 2, 5, true, [0,1,0,0], 0.3)

var kd1 = keymapdown1(justCar);
var ku1 = keymapup1(justCar);
var k1 = new KeyBoardHandler(window, kd1, ku1);

tanksroom1.appendObject(justCar);
