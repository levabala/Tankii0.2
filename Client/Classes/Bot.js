function farAB(a,b){
	return Math.sqrt(((b.X-a.X)*(b.X-a.X))+((b.Y-a.Y)*(b.Y-a.Y)));
}

function RandomBot(tank){
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
	if(tanksroom.objects[i].constructor.name=='Tank' && tanksroom.objects[i]!=tank){
		if(farAB(tanksroom.objects[i].pos,tank.pos)<minfar){
			minfar = farAB(tanksroom.objects[i].pos,tank.pos);
			idminfar=i;
		}
	}
}
var mchance = Math.random();
var enemypos = tanksroom.objects[idminfar].pos;
if(minfar >100){
	if(Math.abs(tank.pos.X-enemypos.X)<Math.abs(tank.pos.Y-enemypos.Y)){
		if(tank.pos.X<enemypos.X){
			tank.toLeft();
			tank.move();
		}
		if(tank.pos.X>enemypos.X){
			tank.toRight();
			tank.move();
		}
	}else{
		if(tank.pos.Y>enemypos.Y){
			tank.toTop();
			tank.move();
		}
		if(tank.pos.Y<enemypos.Y){
			tank.toBottom();
			tank.move();
		}
	}
}else if(Math.abs(tank.pos.X-enemypos.X)<Math.abs(tank.pos.Y-enemypos.Y)){
	if(tank.pos.X<enemypos.X-1){
		tank.toLeft();
			tank.move();
	}
	if(tank.pos.X>enemypos.X+1){
		tank.toRight();
			tank.move();
	}else{
		if(tank.pos.Y<enemypos.Y-1){
			tank.toBottom();
			tank.stop();
			var schance = Math.random();
			if (schance > 0.985) tank.shoot();
		}else{
			tank.toTop();
			tank.stop();
    var schance = Math.random();
    if (schance > 0.985) tank.shoot();
		}
	}
}else{
	if(tank.pos.Y>enemypos.Y+1){
		tank.toTop();
			tank.move();
	}
	if(tank.pos.Y<enemypos.Y-1){
		tank.toBottom();
			tank.move();
	}else{
		if(tank.pos.X<enemypos.X-1){
			tank.toRight();
			tank.stop();
			var schance = Math.random();
			if (schance > 0.985) tank.shoot();
		}else{
			tank.toLeft();
			tank.stop();
			var schance = Math.random();
			if (schance > 0.985) tank.shoot();
		}
	}
}
  tank.onDestructSelf = function(){
    clearInterval(interval)
  }
});
}
