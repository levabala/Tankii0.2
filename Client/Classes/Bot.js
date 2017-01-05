var availableBots = {'RandomBot': RandomBot, 'SuicideBot': SuicideBot, 'FunctionalBot': FunctionalBot}

function Bot(tank){
  var bot = this;
  this.tank = tank;
  this.interval;

  tank.onDestructSelf = function(){
    clearInterval(bot.interval)
  }
}

function RandomBot(){
  Bot.apply(this,arguments);
  var tank = this.tank;

  this.interval = setInterval(function(){
    var mchance = Math.random();
    if (mchance > 0.925) tank.toLeft()
    else if (mchance > 0.85) tank.toBottom()
    else if (mchance > 0.775) tank.toRight()
    else if (mchance > 0.7) tank.toTop()

    var schance = Math.random();
    if (schance > 0.6) tank.shoot();
  },100)
}

function FunctionalBot(){
  Bot.apply(this,arguments);
  var bot = this;
  var moveAccuracy = (bot.tank.width + bot.tank.height) / 4
  var lastWeight = 'topW'
  var weightToDirection = {
    'topW': 'toTop',
    'rightW': 'toRight',
    'bottomW': 'toBottom',
    'leftW': 'toLeft'
  }

  this.interval = setInterval(makeDecision, 100);

  var leftWeightFun = function(myX, enemyX){
    return 1 / (myX - enemyX)//(myPos.X > enemyPos.X)// * (myPos.X - enemyPos.X);
  }
  var rightWeightFun = function(myX, enemyX){
    return 1 / (enemyX - myX)//(myPos.X < enemyPos.X)// * (enemyPos.X - myPos.X);
  }
  var topWeightFun = function(myY, enemyY){
    return 1 / (myY - enemyY)//(myPos.Y > enemyPos.Y)// * (myPos.Y - enemyPos.Y);
  }
  var bottomWeightFun = function(myY, enemyY){
    return 1 / (enemyY - myY)//(myPos.Y < enemyPos.Y)// * (enemyPos.Y - myPos.Y);
  }

  function Weights(obj){
    var weights = this;
    if (bot.tank.pos.Y != obj.pos.Y){
      this.topW = topWeightFun(bot.tank.pos.Y + bot.tank.height / 2,obj.pos.Y + obj.height / 2)
      this.bottomW = bottomWeightFun(bot.tank.pos.Y + bot.tank.height / 2,obj.pos.Y + obj.height / 2)
    }
    else this.topW = this.bottomW = 0
    if (bot.tank.pos.X != obj.pos.X){
      this.rightW = rightWeightFun(bot.tank.pos.X + bot.tank.width / 2,obj.pos.X + obj.width / 2)
      this.leftW = leftWeightFun(bot.tank.pos.X + bot.tank.width / 2,obj.pos.X + obj.width / 2)
    }
    else this.rightW = this.leftW = 0

    this.mergeWith = function(w2){
      weights.topW = (weights.topW > w2.topW) ? weights.topW : w2.topW;
      weights.rightW = (weights.rightW > w2.rightW) ? weights.rightW : w2.rightW;
      weights.bottomW = (weights.bottomW > w2.bottomW) ? weights.bottomW : w2.bottomW;
      weights.leftW = (weights.leftW > w2.leftW) ? weights.leftW : w2.leftW;
    }

    this.revert = function(){
      weights.topW = (weights.topW) ? 1 / weights.topW : 0
      weights.rightW = (weights.rightW) ? 1 / weights.rightW : 0
      weights.bottomW = (weights.bottomW) ? 1 / weights.bottomW : 0
      weights.leftW = (weights.leftW) ? 1 / weights.leftW : 0
    }
  }

  function makeDecision(){
    var finalWeights = new Weights(bot.tank); //zero weights

    for (var o in tanksroom.objects)
      if (tanksroom.objects[o].constructor.name == 'Tank' && tanksroom.objects[o].team.name != bot.tank.team.name) finalWeights.mergeWith(new Weights(tanksroom.objects[o]))

    //finalWeights.revert();

    console.log(finalWeights)
    var choosenDirection = {direction: weightToDirection['topW'], weight: finalWeights['topW']};
    for (var w in finalWeights)
      if (finalWeights[w] > choosenDirection.weight && 1 / finalWeights[w] > moveAccuracy) choosenDirection = {direction: weightToDirection[w], weight: finalWeights[w]};

    finalWeights.revert();

    var dx = finalWeights.leftW + finalWeights.rightW//(finalWeights.leftW > finalWeights.rightW) ? finalWeights.leftW : finalWeights.rightW;
    var dy = finalWeights.topW + finalWeights.bottomW//(finalWeights.topW > finalWeights.bottomW) ? finalWeights.topW : finalWeights.bottomW;

    console.log(dx,dy,choosenDirection.direction)//,moveAccuracy,choosenDirection.direction,dx < moveAccuracy || dy < moveAccuracy)
    if (dx < moveAccuracy || dy < moveAccuracy) {
      console.log('stop')
      bot.tank.stop()
    }
    if (choosenDirection.direction != lastWeight){//finalWeights[lastWeight] < moveAccuracy){
      bot.tank.commands[choosenDirection.direction]()
      lastWeight = choosenDirection.direction;
    }
    if (finalWeights[lastWeight] < moveAccuracy)
      bot.tank.shoot();

    //console.log(choosenDirection)
    //console.log(bot.tank.pos)
  }
}

function SuicideBot() {
  Bot.apply(this,arguments);
  var bot = this;
  var tank = bot.tank;

  function farAB(a, b) {
    return Math.sqrt(((b.X - a.X) * (b.X - a.X)) + ((b.Y - a.Y) * (b.Y - a.Y)));
  }

  this.interval = setInterval(function() {
    var minfar = 1000000;
    var idminfar;
    for (var i in tanksroom.objects) {
      if (tanksroom.objects[i].constructor.name == 'Tank' && tanksroom.objects[i] != tank && (!tanksroom.objects[i].team || tanksroom.objects[i].team.name != tank.team.name)) {
        if (farAB(tanksroom.objects[i].pos, tank.pos) < minfar) {
          minfar = farAB(tanksroom.objects[i].pos, tank.pos);
          idminfar = i;
        }
      }
    }
    var enemypos;
    if (typeof tanksroom.objects[idminfar] != "undefined") {
      enemypos = tanksroom.objects[idminfar].pos;
      //В КОММЕНТАРИЯХ ИСПОЛЬЗУЮ СИСТЕМУ ОСЕЙ ПРИВЯЗАННУЮ К ВРАГУ
      if (Math.abs(tank.pos.X - enemypos.X) <= Math.abs(tank.pos.Y - enemypos.Y)) { //Если ось Y ближе, чем ось X
        if (tank.pos.X > enemypos.X + 1) { //если мы правее противника
          tank.toLeft(); //едем влево

        }
        if (tank.pos.X < enemypos.X - 1) { //если мы левее противника
          tank.toRight(); //едем вправо
        } else { //если мы на одной линии с противником
          if (tank.pos.Y < enemypos.Y) { //если противник ниже нас
            tank.toBottom(); //разворачиваемся назад
            tank.stop();
            var schance = Math.random();
            if (schance > 0.985) tank.shoot(); //Где напалм, Джонни!?*/
          }
          if (tank.pos.Y > enemypos.Y) { //если противник выше нас
            tank.toTop(); //разворачиваемся вверх
            tank.stop();
            //var schance = Math.random();
            //if (schance > 0.985) tank.shoot();//Где напалм, Джонни!?
          }
        }
      }
      if (Math.abs(tank.pos.X - enemypos.X) > Math.abs(tank.pos.Y - enemypos.Y)) { //если ось X ближе к нам
        if (tank.pos.Y > enemypos.Y + 1) { //если ось X выше нас
          tank.toTop(); //едем вверх

        }
        if (tank.pos.Y < enemypos.Y - 1) { //если ось X ниже нас
          tank.toBottom(); //едем вниз
        } else { //если мы на оси X
          if (tank.pos.X < enemypos.X) { //если враг правее нас
            tank.toRight(); //разворачиваемся направо
            tank.stop();
            var schance = Math.random();
            if (schance > 0.985) tank.shoot(); //Где напалм, Джонни!?
          } else { //если враг левее нас
            tank.toLeft(); //разворачиваемся налево
            tank.stop();
            var schance = Math.random();
            if (schance > 0.985) tank.shoot(); //Где напалм, Джонни!?
          }
        }
      }
    } else {
      tank.stop();
    }
  });
}
