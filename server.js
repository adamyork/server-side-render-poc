var http = require("http");
var https = require("https");
var handler = function(req, res) {
  return fs.readFile(__dirname + "/index.html", function(err, data) {
    if (err) {
      res.writeHead(500);
      return res.end("Error loading index.html");
    }
    res.writeHead(200);
    return res.end(data);
  });
};

var app = http.createServer(handler);
var io = require("socket.io").listen(app);
var fs = require("fs");
var canvas = require("canvas");

app.listen(8080);
this.playerPositions = [{x:0,y:0}];
this.cvs = new canvas(1000,600);
this.ctx = this.cvs.getContext('2d');

this.managePlayer = function(msg) {
  switch(msg.direction) {
    case "UP":
      this.playerPositions[msg.player].y -= 20;
    break;
    case "DOWN":
      this.playerPositions[msg.player].y += 20;
    break;
    case "LEFT":
       this.playerPositions[msg.player].x -= 20;
    break;
    case "RIGHT":
        this.playerPositions[msg.player].x += 20;
    break;
  }
};

this.onImageRead=function(err,img) {
  if(err) throw err;
  this.playerImage = new canvas.Image();
  this.playerImage.src = img;
  console.log(this.playerImage);
};

this.onConnectionSuccess=function(socket) {
  console.log(this);
  this.socket = socket;
  fs.readFile(__dirname+'/piece.png',this.onImageRead.bind(this));
  socket.emit("socketConnectSuccess", {
    message: "connection.success"
  });
  socket.on('updateServer',this.onUpdateServer.bind(this));
};

this.onUpdateServer=function(msg) {
  this.managePlayer(msg);
  var posX = this.playerPositions[msg.player].x;
  var posY = this.playerPositions[msg.player].y;
  var self = this;
  this.ctx.clearRect(0,0,1000,600);
  this.ctx.drawImage(this.playerImage,posX,posY);
  this.cvs.toDataURL(function(err,str){
    self.socket.emit("updateBoard", {
      message: [
        {
          data:str
        }
      ]
    });
  });
};

io.sockets.on("connection",this.onConnectionSuccess.bind(this));