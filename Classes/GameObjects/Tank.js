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
    setAttr(gun, 'x', 2);
    setAttr(gun, 'y', 2);
    setAttr(gun, 'width', 1);
    setAttr(gun, 'height', obj.height-2);
    setAttr(gun, 'fill', 'red');

    obj.svgBody.appendChild(rect);
    obj.svgBody.appendChild(turret);
    obj.svgBody.appendChild(gun);
  }

  this.generateView(this);
}
