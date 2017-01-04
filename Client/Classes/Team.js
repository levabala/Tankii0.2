function Team(name, color){
  var team = this;

  this.name = name;
  this.color = (color) ? color : 'darkgray'
  this.totalKills = 0;
  this.totalDeaths = 0;
  this.players = {};
  this.playersCount = 0;

  this.addPlayer = function(player){
    player['kills'] = 0;
    player.team = team;

    player.addEventListener('death', function(id){
      //console.log(player.id, 'died');
      team.removePlayer(id) //remove when client reconnecting will be done
      team.playersCount--;
      team.totalDeaths++;
    })
    player.addEventListener('kill', function(id){
      //console.log(id, 'killed by', player.id);
      team.totalKills++;
      player['kills']++;
    })
    team.players[player.id] = player;
    team.playersCount++;
  }

  this.removePlayer = function(id){
    delete team.players[id];
  }
}
