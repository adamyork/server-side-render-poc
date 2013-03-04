var http = require("http");

var express = require('express');
var app = express();
var server = http.createServer(app).listen(8080);
app.configure(function(){
  app.use(express.static(__dirname + '/public'));
});

var fs = require("fs");
var canvas = require("canvas");
var io = {};
var maxX=1680;
var maxY=1050;
var playerX = 61;
var playerY = 61;
var playerStep = 10;

this.players = [];

this.cvs = new canvas(maxX,maxY);
this.ctx = this.cvs.getContext('2d');

//this.map = new canvas(maxX,maxY);
//this.mapCtx = this.map.getContext('2d');

this.totalPlayers = 0;

function drawImageRot(ctx,img,x,y,width,height,deg){

//Convert degrees to radian 
var rad = deg * Math.PI / 180;

    //Set the origin to the center of the image
    ctx.translate(x + width / 2, y + height / 2);

    //Rotate the canvas around the origin
    ctx.rotate(rad);

    //draw the image    
    ctx.drawImage(img,width / 2 * (-1),height / 2 * (-1),width,height);

    //reset the canvas  
    ctx.rotate(rad * ( -1 ) );
    ctx.translate((x + width / 2) * (-1), (y + height / 2) * (-1));
}

this.managePlayer = function(msg) {
  switch(msg.direction) {
    case "UP":
      this.players[msg.player].y -= playerStep;
      this.players[msg.player].orientation = 270;
    break;
    case "DOWN":
      this.players[msg.player].y += playerStep;
      this.players[msg.player].orientation = 90;
    break;
    case "LEFT":
      this.players[msg.player].x -= playerStep;
      this.players[msg.player].orientation = 180;
    break;
    case "RIGHT":
      this.players[msg.player].x += playerStep;
      this.players[msg.player].orientation = 0;
    break;
  }
    if ((this.players[msg.player].y < 0) || (this.players[msg.player].y > maxY - playerY) ||
        (this.players[msg.player].x < 0) || (this.players[msg.player].x > maxX - playerX)) {
        io.sockets.socket(msg.player).emit("stopMovement");
	console.log("stop moving");
    }
    
};

this.generateToken=function() {
  return Math.random().toString(36).substr(2) +
    Math.random().toString(36).substr(2);
};

this.onImageRead=function(err,img) {
  if(err) throw err;
  this.playerImage = new canvas.Image();
  this.playerImage.src = img;
  fs.readFile(__dirname+'/pacman-pink.png',this.onImageRead2.bind(this));
};

this.onImageRead2=function(err,img) {
  if(err) throw err;
  this.playerImage2 = new canvas.Image();
  this.playerImage2.src = img;
  io = require("socket.io").listen(server);
  io.set('log level', 2); 
  io.sockets.on("connection",this.onConnectionSuccess.bind(this));
};

fs.readFile(__dirname+'/pacman.png',this.onImageRead.bind(this));

this.onConnectionSuccess=function(socket) {
  this.totalPlayers++;
  this.socket = socket;
  var token = socket.id
  var self = this;
  var imgPiece;
  if(this.totalPlayers== 1) {
    imgPiece = this.playerImage;
  } else {
    imgPiece = this.playerImage2;
  }
  this.players[token] = {
    img:imgPiece,
    x:0,
    y:0
  };
    console.log("id:" + socket.id);
  socket.emit("socketConnectSuccess", {
    message: {
      id:token
    }
  });
  socket.on('updateServer',this.onUpdateServer.bind(this));
};

this.onUpdateServer=function(msg) {
  this.managePlayer(msg);
  this.ctx.clearRect(0,0,maxX,maxY);
  for(var player in this.players) {
      var target = this.players[player];
     // this.ctx.drawImage(target.img,target.x,target.y,playerX,playerY);
      drawImageRot(this.ctx,target.img,target.x,target.y,playerX,playerY, target.orientation);
  }
  this.cvs.toDataURL(function(err,str){
    io.sockets.emit("updateBoard", {
      message: [
        {
          data:str
        }
      ]
    });
  });
};