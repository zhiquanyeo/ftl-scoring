window.addEventListener('load', function () {

var matchHeader = document.getElementById('match-header');
var redTeam1 = document.getElementById('red-team-1');
var redTeam2 = document.getElementById('red-team-2');
var blueTeam1 = document.getElementById('blue-team-1');
var blueTeam2 = document.getElementById('blue-team-2');

var matchProgress = document.getElementById('match-progress');
var matchProgressTime = document.getElementById('match-time-remaining');

var redScore = document.getElementById('red-score');
var blueScore = document.getElementById('blue-score');

var socket = io('/match');

var AUTO_TIME = 30;
var TELEOP_TIME = 180;
var TOTAL_TIME = 210;

function _resetMatchDisplay() {
    matchHeader.innerHTML = "No Current Match";
    redTeam1.innerHTML = '';
    redTeam2.innerHTML = '';
    blueTeam1.innerHTML = '';
    blueTeam2.innerHTML = '';

    matchProgress.style.width = "100%";
    _resetProgressBar();

    matchProgress.classList.add('progress-bar-danger');
    matchProgressTime.innerHTML = '0';

    redScore.innerHTML = '0';
    blueScore.innerHTML = '0';
}

function _resetProgressBar() {
    matchProgress.classList.remove('progress-bar-success');
    matchProgress.classList.remove('progress-bar-primary');
    matchProgress.classList.remove('progress-bar-danger');
    matchProgress.classList.remove('progress-bar-warning');
}

_resetMatchDisplay();

socket.on('activeMatchChanged', function(matchInfo) {
    _resetMatchDisplay();
    redTeam1.innerHTML = matchInfo.redTeams[0] || '[EMPTY]';
    redTeam2.innerHTML = matchInfo.redTeams[1] || '[EMPTY]';
    blueTeam1.innerHTML = matchInfo.blueTeams[0] || '[EMPTY]';
    blueTeam2.innerHTML = matchInfo.blueTeams[1] || '[EMPTY]';

    matchProgress.style.width = "0%";
    _resetProgressBar();
    matchProgress.classList.add('progress-bar-primary');
    matchProgressTime.innerHTML = '210';

    matchHeader.innerHTML = 'Match: ' + matchInfo.matchName;

    if (matchInfo.autoComplete) {
        matchProgressTime.innerHTML = '180';
        matchProgress.style.width = ((AUTO_TIME / TOTAL_TIME) * 100) + '%';
    }
    if (matchInfo.teleopComplete) {
        matchProgressTime.innerHTML = '0';
        matchProgress.style.width = '100%';
        _resetProgressBar();
        matchProgress.classList.add('progress-bar-danger');
    }
    console.log('matchInfo: ', matchInfo)
});

socket.on('timeRemaining', function (timeInfo) {
    var timeElapsed = 0;
    if (timeInfo.mode === 'auto') {
        _resetProgressBar();
        matchProgress.classList.add('progress-bar-primary');
        timeElapsed = AUTO_TIME - timeInfo.timeRemainingSeconds;
    }
    else {
        _resetProgressBar();
        timeElapsed = AUTO_TIME + (TELEOP_TIME - timeInfo.timeRemainingSeconds);
        if (TOTAL_TIME - timeElapsed <= 15) {
            matchProgress.classList.add('progress-bar-warning');
        }
        else if (timeElapsed <= 0) {
            matchProgress.classList.add('progress-bar-danger');
        }
        else {
            matchProgress.classList.add('progress-bar-success');
        }
    }

    if (!isNaN(timeElapsed)) {
        var timeRemaining = TOTAL_TIME - timeElapsed;
        matchProgressTime.innerHTML = timeRemaining;
        var pct = (timeElapsed / TOTAL_TIME) * 100;
        matchProgress.style.width = pct + "%";
    }
});

socket.on('teleopModeFinished', function () {
    _resetProgressBar();
    matchProgress.classList.add('progress-bar-danger');
});

socket.on('matchScoreChanged', function (matchName, scores) {
    var redScoreVal = scores.red.auto + scores.red.teleop + scores.red.other + scores.blue.fouls + scores.blue.techFouls;
    var blueScoreVal = scores.blue.auto + scores.blue.teleop + scores.blue.other + scores.red.fouls + scores.red.techFouls;
    
    redScore.innerHTML = redScoreVal;
    blueScore.innerHTML = blueScoreVal;
});

});