window.addEventListener('load', function () {

var socketChannel;
if (SCORER_SIDE === 'red') {
    socketChannel = '/red';
}
else {
    socketChannel = '/blue';
}

var matchHeader = document.getElementById('match-header');
var scorerId = document.getElementById('scorer-id');

var team1Name = document.getElementById('team-1');
var team1AutoNone = document.getElementById('team-1-auto-none');
var team1AutoBaseline = document.getElementById('team-1-auto-baseline');
var team1AutoPenalty = document.getElementById('team-1-auto-penalty');
var team1AutoGoal = document.getElementById('team-1-auto-goal');

var team2Name = document.getElementById('team-2');
var team2AutoNone = document.getElementById('team-2-auto-none');
var team2AutoBaseline = document.getElementById('team-2-auto-baseline');
var team2AutoPenalty = document.getElementById('team-2-auto-penalty');
var team2AutoGoal = document.getElementById('team-2-auto-goal');

var goalButton = document.getElementById('boal-button');
var foulButton = document.getElementById('foul-button');
var techFoulButton = document.getElementById('tech-foul-button');

var socket = io(socketChannel);

var team1AutoScore = {
    baseline: false,
    penalty: false,
    goal: false
};

var team2AutoScore = {
    baseline: false,
    penalty: false,
    goal: false
};

function _resetScreen() {
    team1AutoScore.baseline = false;
    team1AutoScore.penalty = false;
    team1AutoScore.goal = false;
    team2AutoScore.baseline = false;
    team2AutoScore.penalty = false;
    team2AutoScore.goal = false;

    _renderAutoScores();
}

function _renderAutoScores() {
    var team1NoAuto = !team1AutoScore.baseline && 
                      !team1AutoScore.penalty && 
                      !team1AutoScore.goal;
    
    var team2NoAuto = !team2AutoScore.baseline && 
                      !team2AutoScore.penalty && 
                      !team2AutoScore.goal;

    // Reset all the colors
    team1AutoNone.style.color = null;
    team1AutoBaseline.style.color = null;
    team1AutoPenalty.style.color = null;
    team1AutoGoal.style.color = null;

    team2AutoNone.style.color = null;
    team2AutoBaseline.style.color = null;
    team2AutoPenalty.style.color = null;
    team2AutoGoal.style.color = null;

    if (team1NoAuto) {
        team1AutoNone.style.color = 'red';
    }

    if (team2NoAuto) {
        team2AutoNone.style.color = 'red';
    }

    if (team1AutoScore.baseline) {
        team1AutoBaseline.style.color = 'green';
    }
    if (team1AutoScore.penalty) {
        team1AutoPenalty.style.color = 'green';
    }
    if (team1AutoScore.goal) {
        team1AutoGoal.style.color = 'green';
    }

    if (team2AutoScore.baseline) {
        team2AutoBaseline.style.color = 'green';
    }
    if (team2AutoScore.penalty) {
        team2AutoPenalty.style.color = 'green';
    }
    if (team2AutoScore.goal) {
        team2AutoGoal.style.color = 'green';
    }
}

// Hook up handlers
team1AutoNone.addEventListener('click', function () {
    // reset all the things
    team1AutoScore = {
        baseline: false,
        penalty: false,
        goal: false
    };

    _renderAutoScores();

    socket.emit('autoScore', {
        team1: team1AutoScore,
        team2: team2AutoScore
    });
});

team2AutoNone.addEventListener('click', function () {
    // reset all the things
    team2AutoScore = {
        baseline: false,
        penalty: false,
        goal: false
    };

    _renderAutoScores();

    socket.emit('autoScore', {
        team1: team1AutoScore,
        team2: team2AutoScore
    });
});

function _autoScoreHandler(e) {
    if (e.target === team1AutoBaseline) {
        team1AutoScore.baseline = !team1AutoScore.baseline;
    }
    else if (e.target === team1AutoPenalty) {
        team1AutoScore.penalty = !team1AutoScore.penalty;
    }
    else if (e.target === team1AutoGoal) {
        team1AutoScore.goal = !team1AutoScore.goal;
    }
    else if (e.target === team2AutoBaseline) {
        team2AutoScore.baseline = !team2AutoScore.baseline;
    }
    else if (e.target === team2AutoPenalty) {
        team2AutoScore.penalty = !team2AutoScore.penalty;
    }
    else if (e.target === team2AutoGoal) {
        team2AutoScore.goal = !team2AutoScore.goal;
    }

    _renderAutoScores();

    socket.emit('autoScore', {
        team1: team1AutoScore,
        team2: team2AutoScore
    });
}

team1AutoBaseline.addEventListener('click', _autoScoreHandler);
team1AutoPenalty.addEventListener('click', _autoScoreHandler);
team1AutoGoal.addEventListener('click', _autoScoreHandler);

team2AutoBaseline.addEventListener('click', _autoScoreHandler);
team2AutoPenalty.addEventListener('click', _autoScoreHandler);
team2AutoGoal.addEventListener('click', _autoScoreHandler);

goalButton.addEventListener('click', function() {
    socket.emit('teleopPoint', 1);
});

foulButton.addEventListener('click', function () {
    socket.emit('foulPoint', 1);
});

techFoulButton.addEventListener('click', function () {
    socket.emit('techFoulPoint', 5);
});

socket.on('autoScoreChanged', function(scores) {
    team1AutoScore = scores.team1;
    team2AutoScore = scores.team2;

    _renderAutoScores();
});

socket.on('scorerRegistration', function(id) {
    scorerId.innerHTML = 'Scorer ID: ' + id;
});

_resetScreen();

});