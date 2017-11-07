window.addEventListener('load', function () {

// widgets
var matchSelector = document.getElementById('match-selector');
var matchSelectorButton = document.getElementById('match-selector-button');
var noMatchSelectedView = document.getElementById('no-match-selected');

var matchInfoView = document.getElementById('match-selected');
var matchAutoModeButton = document.getElementById('match-auto-mode');
var matchTeleopModeButton = document.getElementById('match-teleop-mode');
var matchModeLabel = document.getElementById('match-mode-time-label');
var matchModeTimeRemaining = document.getElementById('match-mode-time-remaining');

var redAutoScore = document.getElementById('red-auto-score');
var redTeleopScore = document.getElementById('red-teleop-score');
var redTotalScore = document.getElementById('red-total-score');
var blueAutoScore = document.getElementById('blue-auto-score');
var blueTeleopScore = document.getElementById('blue-teleop-score');
var blueTotalScore = document.getElementById('blue-total-score');

var scoreLog = document.getElementById('score-log');

var redScoreAdjustValue = document.getElementById('red-score-adjust-value');
var redScoreAdjustDescription = document.getElementById('red-score-adjust-description');
var redScoreAdjustButton = document.getElementById('red-score-adjust-button');

var blueScoreAdjustValue = document.getElementById('blue-score-adjust-value');
var blueScoreAdjustDescription = document.getElementById('blue-score-adjust-description');
var blueScoreAdjustButton = document.getElementById('blue-score-adjust-button');

var completeMatchButton = document.getElementById('complete-match-button');

var matchList = document.getElementById('match-list').getElementsByTagName('tbody')[0];

var addMatchNumber = document.getElementById('add-match-number');
var addMatchRedTeams = document.getElementById('add-match-red-teams');
var addMatchBlueTeams = document.getElementById('add-match-blue-teams');
var addMatchButton = document.getElementById('add-match-button');

var bulkUploadTextarea = document.getElementById('bulk-upload-match');
var bulkUploadButton = document.getElementById('bulk-upload-button');

// DATA
var matches = [];
var selectedMatch = null;


var socket = io('/admin');

function _getMatchInfo(matchName) {
    for (var i = 0; i < matches.length; i++) {
        if (matches[i].matchName === matchName) {
            return matches[i];
        }
    }
    return null;
}

function _clearMatchSelector() {
    matchSelector.innerHTML = '';
    noMatchSelectedView.style.display = 'block';
    matchInfoView.style.display = 'none';
}

function _clearMatchInfo() {
    redAutoScore.innerHTML = '0';
    redTeleopScore.innerHTML = '0';
    redTotalScore.innerHTML = '0';
    blueAutoScore.innerHTML = '0';
    blueTeleopScore.innerHTML = '0';
    blueTotalScore.innerHTML = '0';
    scoreLog.innerHTML = '';
}

function _clearRedScoreAdjustment() {
    redScoreAdjustValue.value = '';
    redScoreAdjustDescription.value = '';
}

function _clearBlueScoreAdjustment() {
    blueScoreAdjustValue.value = '';
    blueScoreAdjustDescription.value = '';
}

function _clearMatchList() {
    matchList.innerHTML = '';
}

function _clearAddMatch() {
    addMatchNumber.value = '';
    addMatchRedTeams.value = '';
    addMatchBlueTeams.value = '';
}

function _clearBulkUpload() {
    bulkUploadTextarea.value = '';
}

function _resetScreen() {
    _clearMatchSelector();
    _clearMatchInfo();
    _clearRedScoreAdjustment();
    _clearBlueScoreAdjustment();
    _clearMatchList();
    _clearAddMatch();
    _clearBulkUpload();
}

function _activateMatch(matchName) {
    var matchInfo = _getMatchInfo(matchName);
    if (!matchInfo) return;

    matchSelector.disabled = true;
    matchSelectorButton.disabled = true;
    completeMatchButton.disabled = false;

    noMatchSelectedView.style.display = 'none';
    matchInfoView.style.display = 'block';

    selectedMatch = matchName;
}

function _completeMatch(matchName) {
    matchSelector.disabled = false;
    matchSelectorButton.disabled = false;
    completeMatchButton.disabled = true;
    
    for (var i = 0; i < matches.length; i++) {
        if (matches[i].matchName === matchName) {
            matchSelector.children[i].disabled = true;
            break;
        }
    }
}

function _makeMatchSelectorOption(matchInfo) {
    var ret = document.createElement('option');
    ret.value = matchInfo.matchName;
    ret.text = matchInfo.matchName;

    if (matchInfo.complete) {
        ret.disabled = true;
    }

    return ret;
}

function _appendToMatchList(matchInfo) {
    var newRow = matchList.insertRow();
    var matchNameCell = newRow.insertCell();
    matchNameCell.innerHTML = matchInfo.matchName;

    var redTeamsCell = newRow.insertCell();
    redTeamsCell.innerHTML = matchInfo.redTeams.join(', ');
    redTeamsCell.classList.add('red-team');

    var blueTeamsCell = newRow.insertCell();
    blueTeamsCell.innerHTML = matchInfo.blueTeams.join(', ');
    blueTeamsCell.classList.add('blue-team');

    var redScoreCell = newRow.insertCell();
    redScoreCell.innerHTML = matchInfo.redScore || '0';
    redScoreCell.classList.add('red-team');

    var blueScoreCell = newRow.insertCell();
    blueScoreCell.innerHTML = matchInfo.blueScore || '0';
    blueScoreCell.classList.add('blue-team');

    var completeCell = newRow.insertCell();
    completeCell.innerHTML = matchInfo.complete;
    var deleteCell = newRow.insertCell();
    var deleteButton = document.createElement('button');
    deleteButton.classList.add('btn');
    deleteButton.classList.add('btn-danger');
    deleteButton.classList.add('btn-xs');
    deleteButton.innerHTML = 'Delete';
    deleteButton.value = matchInfo.matchName;
    deleteButton.addEventListener('click', _handleDeleteMatch);
    deleteCell.appendChild(deleteButton);
}

function _handleDeleteMatch(e) {
    var matchToDelete = e.target.value;
    if (confirm("Delete Match '" + matchToDelete + "'?")) {
        console.log('Deleting');
    }
}

function _loadMatches(matchData) {
    //activeMatch, matchList
    var matchList = matchData.matchList;

    _clearMatchSelector();
    _clearMatchList();

    var indexToSelect = -1;

    for (var i = 0; i < matchList.length; i++) {
        var matchInfo = matchList[i];
        var redTeamList = matchInfo.redTeams.join(', ');
        var blueTeamList = matchInfo.blueTeams.join(', ');

        if (matchInfo.matchName === matchData.activeMatch) {
            indexToSelect = i;
        }

        // Add to match selector
        matchSelector.appendChild(_makeMatchSelectorOption(matchInfo));

        // Add to match list
        _appendToMatchList(matchInfo);
    }

    matches = matchList;

    if (matchData.activeMatch !== 'NONE') {
        matchSelector.selectedIndex = indexToSelect;
        _activateMatch(matchData.activeMatch);
    }
}

matchSelectorButton.addEventListener('click', function () {
    var matchName = matchSelector.options[matchSelector.selectedIndex].value;
    if (confirm("Activate Match '" + matchName + "'?")) {
        _activateMatch(matchName);

        socket.emit('matchActivated', matchName);
    }
});

completeMatchButton.addEventListener('click', function () {
    if (confirm("Complete Match '" + selectedMatch + "'?")) {
        _completeMatch(selectedMatch);

        socket.emit('matchCompleted', selectedMatch);
    }
});

matchAutoModeButton.addEventListener('click', function () {
    matchAutoModeButton.classList.add('btn-success');
    matchAutoModeButton.disabled = true;

    matchModeLabel.innerHTML = 'Autonomous Mode Time Remaining: ';
    matchModeTimeRemaining.innerHTML = '00:30';

    socket.emit('autoModeStarted');
});

matchTeleopModeButton.addEventListener('click', function () {
    matchTeleopModeButton.classList.add('btn-success');
    matchTeleopModeButton.disabled = true;

    matchModeLabel.innerHTML = 'Teleop Mode Time Remianing: ';
    matchModeTimeRemaining.innerHTML = '03:00';

    socket.emit('teleopModeStarted');
})

socket.on('matchData', function(matchData) {
    _loadMatches(matchData);
});

socket.on('autoModeStarted', function () {
    matchAutoModeButton.classList.add('btn-success');
    matchAutoModeButton.disabled = true;

    matchModeLabel.innerHTML = 'Autonomous Mode Time Remaining: ';
    matchModeTimeRemaining.innerHTML = '00:30';
});

socket.on('teleopModeStarted', function () {
    matchTeleopModeButton.classList.add('btn-success');
    matchTeleopModeButton.disabled = true;

    matchModeLabel.innerHTML = 'Teleop Mode Time Remianing: ';
    matchModeTimeRemaining.innerHTML = '03:00';
});

socket.on('matchActivated', function(matchName) {
    for (var i = 0; i < matches.length; i++) {
        if (matches[i].matchName === matchName) {
            matchSelector.selectedIndex = i;
            _activateMatch(matchName);

            break;
        }
    }
});

socket.on('timeRemaining', function(timeRemainData) {
    matchModeTimeRemaining.innerHTML = timeRemainData.timeRemaining;
});

socket.on('autoModeFinished', function () {
    console.log('hi');
    matchAutoModeButton.classList.remove('btn-success');
    matchAutoModeButton.classList.add('btn-danger');
    matchModeLabel.innerHTML = '';
    matchModeTimeRemaining.innerHTML = '';
});

socket.on('teleopModeFinished', function () {
    matchTeleopModeButton.classList.remove('btn-success');
    matchTeleopModeButton.classList.add('btn-danger');
    matchModeLabel.innerHTML = '';
    matchModeTimeRemaining.innerHTML = '';
});

});