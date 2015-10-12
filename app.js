var server = require('http').createServer();
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ server: server });
var express = require('express');
var app = express();
var port = 8000;

app.use('/', express.static(__dirname + '/'));
//app.listen(8000);

var idCounter = 0;

var players = [ ];

wss.on('connection', function(ws) {
	console.log("NEW WS CONNECTION!");
	ws.playerID = idCounter++;
	ws.pos = {
		x: 0,
		y: 0,
		z: 0
	};
	players.push(ws);
	ws.on('message', function(message) {
		var msg = JSON.parse(message);
		if (msg.type === 'position') {
			ws.pos = msg.pos;
		}
	});
	ws.send(JSON.stringify({
		"type": "ready",
		"id": ws.playerID
	}));
});


var sendPositions = function() {
	var positions = JSON.stringify(getPlayerPositions());
	for (var i = 0; i < players.length; i++) {
		players[i].send(positions);
	}
};

var getPlayerPositions = function() {
	var playerPositions = [ ];
	for (var i = 0; i < players.length; i++) {
		playerPositions.push({
			id: players[i].playerID,
			pos: {
				x: players[i].pos.x,
				y: players[i].pos.y,
				z: players[i].pos.z
			}
		});
	}
	return playerPositions;
};

setInterval(function() {
	sendPositions();
}, 100);

server.on('request', app);
server.listen(port, function () { console.log('Listening on ' + server.address().port) });