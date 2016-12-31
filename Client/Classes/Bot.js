var availableBots = {'RandomBot': RandomBot, 'SuicideBot': SuicideBot}

function RandomBot(tank){
  var interval = setInterval(function(){
    var mchance = Math.random();
    if (mchance > 0.925) tank.toLeft()
    else if (mchance > 0.85) tank.toBottom()
    else if (mchance > 0.775) tank.toRight()
    else if (mchance > 0.7) tank.toTop()

    var schance = Math.random();
    if (schance > 0.6) tank.shoot();
  },100)

  tank.onDestructSelf = function(){
    clearInterval(interval)
  }
}

function SuicideBot(tank){
  function farAB(a,b){
  	return Math.sqrt(((b.X-a.X)*(b.X-a.X))+((b.Y-a.Y)*(b.Y-a.Y)));
  }

  var interval = setInterval(function(){
    /* var mchance = Math.random();
    if (mchance > 0.925) tank.toLeft()
    else if (mchance > 0.85) tank.toBottom()
    else if (mchance > 0.775) tank.toRight()
    else if (mchance > 0.7) tank.toTop()

    var schance = Math.random();
    if (schance > 0.4) tank.shoot();
  },100) */
var minfar = 1000000;
var idminfar;
for(var i in tanksroom.objects) {
	if(tanksroom.objects[i].constructor.name == 'Tank' && tanksroom.objects[i] != tank && (!tanksroom.objects[i].team || tanksroom.objects[i].team.name != tank.team.name)){
		if(farAB(tanksroom.objects[i].pos,tank.pos) < minfar){
			minfar = farAB(tanksroom.objects[i].pos,tank.pos);
			idminfar=i;
		}
	}
}
var enemypos;
if(typeof tanksroom.objects[idminfar] != "undefined"){
	enemypos = tanksroom.objects[idminfar].pos;
													//В КОММЕНТАРИЯХ ИСПОЛЬЗУЮ СИСТЕМУ ОСЕЙ ПРИВЯЗАННУЮ К ВРАГУ
if(Math.abs(tank.pos.X-enemypos.X)<=Math.abs(tank.pos.Y-enemypos.Y)){//Если ось Y ближе, чем ось X
	if(tank.pos.X>enemypos.X+1){//если мы правее противника
		tank.toLeft();//едем влево

	}
	if(tank.pos.X<enemypos.X-1){//если мы левее противника
		tank.toRight();//едем вправо
	}else{//если мы на одной линии с противником
		if(tank.pos.Y<enemypos.Y){//если противник ниже нас
			tank.toBottom();//разворачиваемся назад
			tank.stop();
			var schance = Math.random();
			if (schance > 0.985) tank.shoot();//Где напалм, Джонни!?*/
		}
		if(tank.pos.Y>enemypos.Y){//если противник выше нас
			tank.toTop();//разворачиваемся вверх
			tank.stop();
			//var schance = Math.random();
			//if (schance > 0.985) tank.shoot();//Где напалм, Джонни!?
		}
	}
}
if(Math.abs(tank.pos.X-enemypos.X)>Math.abs(tank.pos.Y-enemypos.Y)){//если ось X ближе к нам
	if(tank.pos.Y>enemypos.Y+1){//если ось X выше нас
		tank.toTop();//едем вверх

	}
	if(tank.pos.Y<enemypos.Y-1){//если ось X ниже нас
		tank.toBottom();//едем вниз
	}else{//если мы на оси X
		if(tank.pos.X<enemypos.X){//если враг правее нас
			tank.toRight(); //разворачиваемся направо
			tank.stop();
			var schance = Math.random();
			if (schance > 0.985) tank.shoot();//Где напалм, Джонни!?
		}else{//если враг левее нас
			tank.toLeft();//разворачиваемся налево
			tank.stop();
			var schance = Math.random();
			if (schance > 0.985) tank.shoot();//Где напалм, Джонни!?
		}
	}
}}else{tank.stop();}
tank.onDestructSelf = function(){clearInterval(interval)}});}
