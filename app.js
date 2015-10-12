var server = require('http').createServer();
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({
    server: server
});
var express = require('express');
var app = express();
var port = 8000;

app.use('/', express.static(__dirname + '/'));

var idCounter = 0;

var players = [];

wss.on('connection', function(ws) {
    ws.playerID = idCounter++;
    ws.pos = {
        x: 0,
        y: 100,
        z: 0
    };

    for (var i = 0; i < players.length; i++) {
        players[i].send(JSON.stringify({
            "type": "newPlayer",
            "playerID": ws.playerID
        }));
    }

    players.push(ws);

    ws.on('message', function(message) {
        var msg = JSON.parse(message);
        if (msg.type === 'pos') {
            ws.pos = msg.pos;
        }
    });

    ws.on('close', function(reason) {
        for (var i = 0; i < players.length; i++) {
            if (players[i] === ws) {
                players.splice(i, 1);
                break;
            }
        }
    });

    ws.send(JSON.stringify({
        "type": "ready",
        "playerID": ws.playerID
    }));
});


var sendPositions = function() {
    var positions = JSON.stringify(getPlayerPositions());
    for (var i = 0; i < players.length; i++) {
        players[i].send(JSON.stringify({
            "type": "pos",
            "pos": positions
        }));
    }
};

var getPlayerPositions = function() {
    var playerPositions = [];
    for (var i = 0; i < players.length; i++) {
        playerPositions.push({
            playerID: players[i].playerID,
            position: {
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
}, 10);

server.on('request', app);
server.listen(port, function() {
    console.log('Listening on ' + server.address().port);
});
