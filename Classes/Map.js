function Map(width,height){
  var map = this;
  this.width = width;
  this.height = height;
  this.field = [];
  this.xcoeff = 1;
  this.ycoeff = 1;

  //fill the field
  for (var w = 0; w < width; w++){
    this.field[w] = [];
    for (var h = 0; h < height; h++){
      this.field[w][h] = {pos: new Pos(w,h), obj: {physical: false}};
    }
  }

  this.fitToContainer = function(width,height){
    map.xcoeff = width / map.field[map.field.length-1][0].pos.X;
    map.ycoeff = height / map.field[0][map.field[0].length-1].pos.Y;

    if (map.xcoeff > map.ycoeff) map.xcoeff = map.ycoeff;
    else map.ycoeff = map.xcoeff
  }
}
