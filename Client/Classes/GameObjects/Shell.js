function Shell(){
  MovableGameObject.apply(this,arguments)
  var shell = this;

  this.papa = {};

  this.collisionCaseAction = function(obj){
    obj.damaged(1,shell.papa)
    //if (obj.hp <= 0 && obj.constructor.name == 'Tank') shell.papa.kill(obj.id);

    shell.destructSelf();
  }

  this.generateView = function(obj){
    var rect = document.createElementNS("http://www.w3.org/2000/svg",'rect');
    setAttr(rect, 'x', 0);
    setAttr(rect, 'y', 0);
    setAttr(rect, 'width', this.width);
    setAttr(rect, 'height', this.height);
    setAttr(rect, 'fill', 'darkred');

    obj.svgBody.append(rect);
  }

  this.generateView(this)
}
