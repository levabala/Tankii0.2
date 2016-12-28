function Shell(){
  MovableGameObject.apply(this,arguments)
  var shell = this;

  this.collisionCaseAction = function(obj){
    obj.damaged(1)
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
