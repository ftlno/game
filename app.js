//Frontend server
var express = require('express');
var app = express();
var port = 8000;
app.use('/', express.static(__dirname + '/'));

//Websocket server
var idCounter = 0;
var players = [];

var server = require('http').createServer();
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({
    server: server
});

wss.on('connection', function(ws) {
    ws.playerID = idCounter++;
    ws.position = {
        x: 0,
        y: 0,
        z: 0
    };

    players.push(ws);

    ws.on('message', function(message) {
        if (message !== 'undefined') {
            var msg = JSON.parse(message);
            if (msg.type === 'position') {
                ws.position = msg.position;
            }
        }
    });

    ws.on('close', function(reason) {
        removeClient(reason);
    });

    ws.on('error', function(reason) {
        removeClient(reason);
    });

    function removeClient(reason) {
        for (var i = 0; i < players.length; i++) {
            if (players[i] === ws) {
                console.log('removing');
                players.splice(i, 1);
                for (var j = 0; j < players.length; j++) {
                    players[j].send(JSON.stringify({
                        "type": "remove",
                        "playerID": ws.playerID
                    }));
                }
                break;
            }
        }

    }

    ws.send(JSON.stringify({
        "type": "ready",
        "playerID": ws.playerID
    }));
});

var sendPositions = function() {
    var positions = JSON.stringify(getPlayerPositions());
    for (var i = 0; i < players.length; i++) {
        if (players[i].readyState === 1) {
            players[i].send(JSON.stringify({
                "type": "position",
                "position": positions
            }));
        }
    }
};

var getPlayerPositions = function() {
    var playerPositions = [];
    for (var i = 0; i < players.length; i++) {
        playerPositions.push({
            playerID: players[i].playerID,
            position: {
                x: players[i].position.x,
                y: players[i].position.y,
                z: players[i].position.z
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
