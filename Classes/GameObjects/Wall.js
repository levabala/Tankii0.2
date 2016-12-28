function Wall(){
  GameObject.apply(this,arguments);

  var wall = this;
  this.physical = true;

  this.generateView = function(obj){
    var rect = document.createElementNS("http://www.w3.org/2000/svg",'rect');
    setAttr(rect, 'x', 0);
    setAttr(rect, 'y', 0);
    setAttr(rect, 'width', this.width);
    setAttr(rect, 'height', this.height);
    setAttr(rect, 'fill', 'darkgray');

    obj.svgBody.append(rect);
  }

  this.generateView(this);
}
