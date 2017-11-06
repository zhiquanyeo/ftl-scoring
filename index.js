const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const Moniker = require('moniker');

const ScoreManager = require('./score-manager');

// Have multiple socket.io channels
const ADMIN_CHANNEL = '/admin';
const RED_CHANNEL = '/red';
const BLUE_CHANNEL = '/blue';
const DISPLAY_CHANNEL = '/display';
const MATCH_CHANNEL = '/match';

// Set up the sockets
var adminSocket = io.of(ADMIN_CHANNEL);
var redSocket = io.of(RED_CHANNEL);
var blueSocket = io.of(BLUE_CHANNEL);
var displaySocket = io.of(DISPLAY_CHANNEL);
var matchSocket = io.of(MATCH_CHANNEL);

var displayClients = [];

// TODO Read in configuration from DB?


// Initialize Score and Match managers
var scoreManager = new ScoreManager();

// Set up express
app.use(express.static('public_html'));

// File for Display
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public_html/scoreboard.html');
});

// File for active match display
app.get('/match', (req, res) => {

});

// Admin screen
app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/public_html/admin.html');
});

// Red Scoring
app.get('/red', (req, res) => {

});

// Blue Scoring
app.get('/blue', (req, res) => {
    
});

// Hook up socket.io connections
adminSocket.on('connection', (socket) => {

});

redSocket.on('connection', (socket) => {
    var id = 'red-score-' + Moniker.choose();
    scoreManager.registerScorer('red', id, socket);
});

blueSocket.on('connection', (socket) => {
    var id = 'blue-score-' + Moniker.choose();
    scoreManager.registerScorer('blue', id, socket);
});

displaySocket.on('connection', (socket) => {
    socket.on('disconnect', () => {
        for (var i = 0; i < displayClients.length; i++) {
            if (displayClients[i] === socket)  {
                displayClients.splice(i, 1);
                break;
            }
        }
    });

    var matchData = {
        activeMatch: scoreManager.getActiveMatchName(),
        matchList: scoreManager.getMatchList()
    };

    _sendMatchData(matchData, socket);
});

function _broadcastMatchData(matchData) {
    for (var i = 0; i < displayClients.length; i++) {
        _sendMatchData(matchData, displayClients[i]);
    }
}

function _sendMatchData(matchData, socket) {
    socket.emit('matchData', matchData);
}

scoreManager.on('matchDataChanged', () => {
    var matchData = {
        activeMatch: scoreManager.getActiveMatchName(),
        matchList: scoreManager.getMatchList()
    }

    _broadcastMatchData(matchData);
});

// TEST
scoreManager.addMatch("Q1", ["red 1", "red 2"], ["blue 1", "blue 2"]);
scoreManager.addMatch("Q2", ["red 1", "red 2"], ["blue 1", "blue 2"]);
scoreManager.addMatch("Q3", ["red 1", "red 2"], ["blue 1", "blue 2"]);
scoreManager.addMatch("Q4", ["red 1", "red 2"], ["blue 1", "blue 2"]);
scoreManager.addMatch("Q5", ["red 1", "red 2"], ["blue 1", "blue 2"]);

scoreManager.setActiveMatch('Q4');

http.listen(3000, () => {
    console.log('Listening');
})