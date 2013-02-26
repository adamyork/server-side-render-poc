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

this.players = [];
this.cvs = new canvas(1000,600);
this.ctx = this.cvs.getContext('2d');
this.totalPlayers = 0;

this.managePlayer = function(msg) {
  switch(msg.direction) {
    case "UP":
      this.players[msg.player].y -= 20;
    break;
    case "DOWN":
      this.players[msg.player].y += 20;
    break;
    case "LEFT":
       this.players[msg.player].x -= 20;
    break;
    case "RIGHT":
        this.players[msg.player].x += 20;
    break;
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
  fs.readFile(__dirname+'/piece-pink.png',this.onImageRead2.bind(this));
};

this.onImageRead2=function(err,img) {
  if(err) throw err;
  this.playerImage2 = new canvas.Image();
  this.playerImage2.src = img;
  io = require("socket.io").listen(server);
  io.sockets.on("connection",this.onConnectionSuccess.bind(this));
};

fs.readFile(__dirname+'/piece.png',this.onImageRead.bind(this));

this.onConnectionSuccess=function(socket) {
  this.totalPlayers++;
  this.socket = socket;
  var token = this.generateToken();
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
  socket.emit("socketConnectSuccess", {
    message: {
      id:token
    }
  });
  socket.on('updateServer',this.onUpdateServer.bind(this));
};

this.onUpdateServer=function(msg) {
  this.managePlayer(msg);
  this.ctx.clearRect(0,0,1000,600);
  for(var player in this.players) {
      var target = this.players[player];
      this.ctx.drawImage(target.img,target.x,target.y,64,64);
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