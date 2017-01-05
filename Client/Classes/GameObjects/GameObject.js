function GameObject(pos,map,width,height,hp,physical,rotation,speed,destructSelfFun,createObjectFun,color){
  Reactor.apply(this,[]);
  var gobj = this;

  //base props
  this.pos = pos;
  this.color = color;
  this.cellP = new Pos(Math.floor(pos.X), Math.floor(pos.Y));
  this.map = map;
  this.width = width;
  this.height = height;
  this.rotation = rotation || [0,0,0,0]; // example: [1,0,0,0]  common view: [top,right,bottom,left]
  this.speed = speed;
  this.physical = physical; //is it an obstance or not
  this.svgBody = null;
  this.id = null;
  this.hp = hp;
  this.maxhp = hp;
  this.hpPerc = 1; //health points percentage
  this.wasDamaged = false;
  this.deathless = (hp == 'deathless');
  this.VIEW_CHANGING_PROPERTIES = ['color']

  //external access
  this.destructSelfFun = destructSelfFun;
  this.createObjectFun = createObjectFun;
  this.commandsHandlers = [];

  //events
  this.registerEvent('death')
  this.registerEvent('kill')
  this.registerEvent('teamkill')

  //object's doings
  this.tick = function(){
    var changed = gobj.wasDamaged;
    gobj.wasDamaged = false;
    return changed;
  }

  this.onDestructSelf = function(){

  }

  this.damaged = function(damage, damager){
    if (gobj.deathless) return;

    gobj.hp -= damage;
    if (gobj.hp < 1){
      gobj.destructSelf();
      gobj.hp = 0;
      if (damager && gobj.constructor.name == 'Tank')
        if (gobj.team.name != damager.team.name) damager.kill();
        else damager.teamkill();
    }

    gobj.svgBody.setAttributeNS(null,'fill-opacity', gobj.hp / gobj.maxhp)
    gobj.wasDamaged = true;
  }

  this.kill = function(id){
    gobj.dispatchEvent('kill', id)
  }

  this.teamkill = function(id){
    gobj.dispatchEvent('teamkill', id)
  }

  this.destructSelf = function(){
    gobj.dispatchEvent('death', gobj.id)
    gobj.destructSelfFun(gobj);

    for (var ch in gobj.commandsHandlers)
      gobj.commandsHandlers[ch].disable();

    gobj.onDestructSelf();
  }

  this.createObject = function(obj){
    gobj.createObjectFun(obj);
  }

  //generate and set "body" tag
  this.createBaseBody = function(obj){
    var r = (obj.rotation) ? obj.rotation[0] * 180 + obj.rotation[1] * 270 + obj.rotation[3] * 90 : 0;
    obj.svgBody = document.createElementNS("http://www.w3.org/2000/svg",'g');
    setAttr(obj.svgBody, 'transform', 'translate(' + obj.pos.X + ',' + obj.pos.Y  + ') rotate(' + r + ',' + obj.width/2 + ',' + obj.height/2 + ')');
    setAttr(obj.svgBody, 'width', obj.width);
    setAttr(obj.svgBody, 'height', obj.height);
  }

  this.setColor = function(){

  }

  //additional view elements
  this.generateView = function(obj){

  }

  this.updateView = function(){
    $(gobj.svgBody).empty()
    gobj.generateView(gobj)
  }

  //base view generation
  this.createBaseBody(this);

  //span for recreating
  this.createSnap = function(){
    return {id: gobj.id, pos: gobj.pos, width: gobj.width, height: gobj.height, hp: gobj.hp, physical: gobj.physical, rotation: gobj.rotation, speed: gobj.speed, color: gobj.color};
  }

  this.setProperties = function(props){
    for (var p in props){
      gobj[p] = props[p]
    }
    gobj.updateSvgBody();
  }

  this.updateSvgBody = function(){
    var r = gobj.rotation[0] * 180 + gobj.rotation[1] * 270 + gobj.rotation[3] * 90;
    gobj.svgBody.setAttributeNS(null,'transform', 'translate(' + (gobj.pos.X) + ',' + (gobj.pos.Y) + ') rotate(' + r + ',' + gobj.width/2 + ',' + gobj.height/2 + ')');
    var newHpPerc = gobj.hp / gobj.maxhp;
    if (gobj.hpPerc != newHpPerc) gobj.svgBody.setAttributeNS(null,'fill-opacity', newHpPerc)
    gobj.hpPerc = newHpPerc;
  }

  this.rotationToString = function(rotation){

  }
}
