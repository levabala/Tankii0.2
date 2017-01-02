var availableBots = {'RandomBot': RandomBot}

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
