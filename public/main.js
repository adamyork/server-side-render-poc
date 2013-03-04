var movementInterval = null;
var isMoving = false;
var direction = null;
var socket = null;
var cvs = null;
var id = "";
function init() {
	this.cvs = $('#renderArea')[0];
	this.socket = io.connect('http://localhost:8080');
	this.socket.on('updateBoard', _.bind(this.draw, this));
	this.socket.on('socketConnectSuccess',_.bind(this.onSocketConnectSuccess,this));
        this.socket.on('stopMovement',_.bind(this.onStopMovement,this));
	var self = this;
	$(document).bind('keydown',function(e){
		self.direction = self.getDirectionFromKeyCode(e.keyCode);
		console.log("change dir " + self.direction);
		self.startMovement(e);
	});
//	$(document).bind('keyup',function(e){
//		self.stopMovement();
//	});
}

function draw(msg) {
	this.cvs.src=msg.message[0].data;
}

function onSocketConnectSuccess(msg) {
	console.log("connection success.");
	this.id = msg.message.id;
}

function startMovement(e) {
	if(!this.isMoving) {
		this.isMoving = true;
		this.movementInterval = setInterval(_.bind(this.update,this),16);
	}
}

function update() {
	//console.log('update ' + this.direction);
	this.socket.emit('updateServer',{player:this.id,direction:this.direction});
}

function onStopMovement(msg) {
    	console.log("stop moving");
	if(this.isMoving) {
		this.isMoving = false;
		clearInterval(this.movementInterval);
		this.movementInterval = null;
	}
}

function getDirectionFromKeyCode(code) {
	switch(code) {
		case 38:
			code = "UP";
		break;
		case 40:
			code = "DOWN";
		break;
		case 37:
			code = "LEFT";
		break;
		case 39:
			code = "RIGHT";
		break;
	}
	return code;
}