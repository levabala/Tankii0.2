function Tank(){
  MovableGameObject.apply(this,arguments);

  var tank = this;

  this.generateView = function(obj){
    var rect = document.createElementNS("http://www.w3.org/2000/svg",'rect');
    setAttr(rect, 'x', 0);
    setAttr(rect, 'y', 0);
    setAttr(rect, 'width', obj.width);
    setAttr(rect, 'height', obj.height);
    setAttr(rect, 'fill', 'brown');
    var turret = document.createElementNS("http://www.w3.org/2000/svg",'rect');
    setAttr(turret, 'x', 1);
    setAttr(turret, 'y', 1);
    setAttr(turret, 'width', obj.width-2);
    setAttr(turret, 'height', 2);
    setAttr(turret, 'fill', 'darkred');
    var gun = document.createElementNS("http://www.w3.org/2000/svg",'rect');
    setAttr(gun, 'x', obj.width*0.4);
    setAttr(gun, 'y', 2);
    setAttr(gun, 'width', obj.width*0.2);
    setAttr(gun, 'height', obj.height-2);
    setAttr(gun, 'fill', 'red');

    obj.svgBody.appendChild(rect);
    obj.svgBody.appendChild(turret);
    obj.svgBody.appendChild(gun);
  }

  this.shoot = function(){
    var x = tank.pos.X+tank.rotation[3]*-1+tank.rotation[1]*tank.width+(1-(tank.rotation[1]+tank.rotation[3]))*Math.floor(tank.width/2);
    var y = tank.pos.Y+tank.rotation[0]*-1+tank.rotation[2]*tank.height+(1-(tank.rotation[0]+tank.rotation[2]))*Math.floor(tank.height/2);
    console.log('tank:',tank)
    var shell = new Shell(new Pos(x, y), tank.map, 1, 1, 1, 1, tank.rotation, 0.4, tank.destructSelfFun);
    shell.moveOn = 1;
    tank.createObject(shell);
  }

  this.generateView(this);
}
