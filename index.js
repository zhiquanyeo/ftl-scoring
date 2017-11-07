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
var adminClients = [];
var matchClients = [];

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
    res.sendFile(__dirname + '/public_html/matchstatus.html');
});

// Admin screen
app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/public_html/admin.html');
});

// Red Scoring
app.get('/red', (req, res) => {
    res.sendFile(__dirname + '/public_html/red.html');
});

// Blue Scoring
app.get('/blue', (req, res) => {
    res.sendFile(__dirname + '/public_html/blue.html');
});

// Hook up socket.io connections
adminSocket.on('connection', (socket) => {
    socket.on('disconnect', () => {
        for (var i = 0; i < adminClients.length; i++) {
            if (adminClients[i] === socket)  {
                adminClients.splice(i, 1);
                break;
            }
        }
    });

    adminClients.push(socket);

    var matchData = {
        activeMatch: scoreManager.getActiveMatchName(),
        matchList: scoreManager.getMatchList()
    };

    socket.emit('matchData', matchData);

    socket.on('matchActivated', (matchName) => {
        scoreManager.setActiveMatch(matchName);
        socket.broadcast.emit('matchActivated', matchName);
    });

    socket.on('autoModeStarted', function () {
        scoreManager.startAutoMode(scoreManager.getActiveMatchName());
        socket.broadcast.emit('autoModeStarted');
    });

    socket.on('teleopModeStarted', () => {
        scoreManager.startTeleopMode(scoreManager.getActiveMatchName());
        socket.broadcast.emit('teleopModeStarted');
    })
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

    displayClients.push(socket);

    var matchData = {
        activeMatch: scoreManager.getActiveMatchName(),
        matchList: scoreManager.getMatchList()
    };

    _sendMatchData(matchData, socket);
});

matchSocket.on('connection', (socket) => {
    socket.on('disconnect', () => {
        for (var i = 0; i < matchClients.length; i++) {
            if (matchClients[i] === socket)  {
                matchClients.splice(i, 1);
                break;
            }
        }
    });

    matchClients.push(socket);

    if (scoreManager.getActiveMatch()) {
        // We have an active match, send the active match change
        socket.emit('activeMatchChanged', scoreManager.getActiveMatch());
    }
})

function _broadcastMatchData(matchData) {
    for (var i = 0; i < displayClients.length; i++) {
        _sendMatchData(matchData, displayClients[i]);
    }
}

function _sendMatchData(matchData, socket) {
    socket.emit('matchData', matchData);
}

function _broadcastModeTime(mode, timeString, timeSeconds) {
    for (var i = 0; i < adminClients.length; i++) {
        adminClients[i].emit('timeRemaining', {
            mode: mode,
            timeRemaining: timeString
        });

        matchClients[i].emit('timeRemaining', {
            mode: mode,
            timeRemaining: timeString,
            timeRemainingSeconds: timeSeconds
        })
    }
}

function _broadcastModeComplete(mode) {
    for (var i = 0; i < adminClients.length; i++) {
        adminClients[i].emit(mode + 'ModeFinished');
    }

    for (var i = 0; i < matchClients.length; i++) {
        matchClients[i].emit(mode + 'ModeFinished');
    }
}

function _broadcastActiveMatchUpdated() {
    for (var i = 0; i < matchClients.length; i++) {
        matchClients[i].emit('activeMatchChanged', scoreManager.getActiveMatch());
    }
}

function _broadcastMatchScores(matchName, scores) {
    for (var i = 0; i < matchClients.length; i++) {
        matchClients[i].emit('matchScoreChanged', matchName, scores);
    }

    for (var i = 0; i < displayClients.length; i++) {
        displayClients[i].emit('matchScoreChanged', matchName, scores);
    }

    for (var i = 0; i < adminClients.length; i++) {
        adminClients[i].emit('matchScoreChanged', matchName, scores);
    }
}

scoreManager.on('matchDataChanged', () => {
    var matchData = {
        activeMatch: scoreManager.getActiveMatchName(),
        matchList: scoreManager.getMatchList()
    }

    _broadcastMatchData(matchData);
});

scoreManager.on('timeRemainingChanged', (mode, timeRemaining, timeSeconds) => {
    _broadcastModeTime(mode, timeRemaining, timeSeconds);
});

scoreManager.on('modeComplete', (mode) => {
    console.log('mode complete: ', mode);
    _broadcastModeComplete(mode);
});

scoreManager.on('activeMatchChanged', (matchName) => {
    console.log('active: ', matchName)
    _broadcastActiveMatchUpdated();
});

scoreManager.on('matchScoreChanged', (matchName, score) => {
    _broadcastMatchScores(matchName, score);

    // Also update dashboard
    var matchData = {
        activeMatch: scoreManager.getActiveMatchName(),
        matchList: scoreManager.getMatchList()
    }

    _broadcastMatchData(matchData);
})

// TEST
scoreManager.addMatch("Q1", ["red 1", "red 2"], ["blue 1", "blue 2"]);
scoreManager.addMatch("Q2", ["red 1", "red 2"], ["blue 1", "blue 2"]);
scoreManager.addMatch("Q3", ["red 1", "red 2"], ["blue 1", "blue 2"]);
scoreManager.addMatch("Q4", ["red 1", "red 2"], ["blue 1", "blue 2"]);
scoreManager.addMatch("Q5", ["red 1", "red 2"], ["blue 1", "blue 2"]);

http.listen(3000, () => {
    console.log('Listening');
})