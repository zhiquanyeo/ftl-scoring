window.addEventListener('load', function () {

var scoreboardTable = document.getElementById('scoreboard').getElementsByTagName('tbody')[0];

var socket = io('/display');

socket.on('matchData', function (matchData) {
    // matchData: { activeMatch, matchList }
    console.log(matchData)
    // Clear out match table
    scoreboardTable.innerHTML = '';

    if (matchData.matchList.length === 0) {
        var newRow = scoreboardTable.insertRow(scoreboardTable.rows.length);
        var newCell = newRow.insertCell(0);
        newCell.colSpan = 7;
        newCell.innerHTML = 'No Match Data';
    }
    else {
        for (var i = 0; i < matchData.matchList.length; i++) {
            var matchInfo = matchData.matchList[i];
            var newRow = scoreboardTable.insertRow();

            if (matchInfo.matchName === matchData.activeMatch) {
                newRow.classList.add('active-match');
            }

            var matchCell = newRow.insertCell();
            matchCell.innerHTML = matchInfo.matchName;

            var redCell1 = newRow.insertCell();
            redCell1.classList.add('red-team');
            redCell1.innerHTML = matchInfo.redTeams[0] || 'EMPTY';

            var redCell2 = newRow.insertCell();
            redCell2.classList.add('red-team');
            redCell2.innerHTML = matchInfo.redTeams[1] || 'EMPTY';

            var blueCell1 = newRow.insertCell();
            blueCell1.classList.add('blue-team');
            blueCell1.innerHTML = matchInfo.blueTeams[0] || 'EMPTY';

            var blueCell2 = newRow.insertCell();
            blueCell2.classList.add('blue-team');
            blueCell2.innerHTML = matchInfo.blueTeams[1] || 'EMPTY';

            var redScore = newRow.insertCell();
            redScore.classList.add('red-team');
            var redScoreVal = matchInfo.redAutoScore + matchInfo.redTeleopScore + matchInfo.redOtherScore + matchInfo.blueFouls + matchInfo.blueTechFouls;
            redScore.innerHTML = redScoreVal;

            var blueScore = newRow.insertCell();
            blueScore.classList.add('blue-team');
            var blueScoreVal = matchInfo.blueAutoScore + matchInfo.blueTeleopScore + matchInfo.blueOtherScore + matchInfo.redFouls + matchInfo.redTechFouls;
            blueScore.innerHTML = blueScoreVal;
        }
    }
});


});