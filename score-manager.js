const EventEmitter = require('events');

class ScoreManager extends EventEmitter {
    constructor() {
        super();
        this.d_redScorers = [];
        this.d_blueScorers = [];

        this.d_matchActive = false;

        this.d_currentMatch = 'NONE'; // It's a string...
        this.d_matches = []; // A struct of { matchName, redTeams, blueTeams, redScore, blueScore, complete, active, scoreLog}

        this.d_currentMatchRedScore = 0;
        this.d_currentMatchBlueScore = 0;
    }

    registerScorer(team, scorerId, socket) {
        var scorerList;
        if (team === 'red') {
            scorerList = this.d_redScorers;
        }
        else {
            scorerList = this.d_blueScorers;
        }

        scorerList.push({
            id: scorerId,
            socket: socket
        });

        // Send a registration message to the socket
        socket.emit('scorerRegistration', scorerId);

        // Hook up events
        socket.on('score', (scoreData) => {

        });
    }

    addMatch(matchName, redTeams, blueTeams) {
        this.d_matches.push({
            matchName: matchName,
            redTeams: redTeams,
            blueTeams: blueTeams,
            redAutoScore: 0,
            redTeleopScore: 0,
            redOtherScore: 0,
            blueAutoScore: 0,
            blueTeleopScore: 0,
            blueOtherScore: 0,
            autoComplete: false,
            teleopComplete: false,
            complete: false,
            active: false,
            scoreLog: []
        });

        this.emit('matchDataChanged');
    }

    removeMatch(matchName) {
        if (this.d_currentMatch === matchName) {
            this.setActiveMatch('NONE');
        }

        for (var i = 0; i < this.d_matches.length; i++) {
            if (this.d_matches[i].matchName === matchName) {
                this.d_matches.splice(i, 1);
                this.emit('matchDataChanged');
                break;
            }
        }
    }

    getMatchInfo(matchName) {
        for (var i = 0; i < this.d_matches.length; i++) {
            var matchInfo = this.d_matches[i];
            if (matchInfo.matchName === matchName) {
                return matchInfo;
            }
        }

        return null;
    }

    getMatchList() {
        return this.d_matches;
    }

    getMatchScore(matchName) {
        var matchInfo = this.getMatchInfo(matchName);
        if (matchInfo) {
            return {
                red: {
                    auto: matchInfo.redAutoScore,
                    teleop: matchInfo.redTeleopScore,
                    other: matchInfo.redOtherScore
                },
                blue: {
                    auto: matchInfo.blueAutoScore,
                    teleop: matchInfo.blueTeleopScore,
                    other: matchInfo.blueOtherScore
                },
            };
        }

        return {
            red: {
                auto: 0,
                teleop: 0,
                other: 0
            },
            blue: {
                auto: 0,
                teleop: 0,
                other: 0
            }
        };
    }

    getActiveMatchName() {
        return this.d_currentMatch;
    }
    
    getActiveMatch() {
        var matchInfo = this.getMatchInfo(this.d_currentMatch);
        if (matchInfo) {
            return JSON.parse(JSON.stringify(matchInfo));
        }

        return null;
    }

    setActiveMatch(matchName) {
        // Reset the previous active match
        if (this.d_currentMatch !== 'NONE') {
            var matchInfo = this.getMatchInfo(this.d_currentMatch);
            matchInfo.active = false;
        }

        if (matchName === 'NONE') {
            this.d_matchActive = false;
            this.d_currentMatch = 'NONE';
        }
        else {
            var matchInfo = this.getMatchInfo(matchName);
            if (matchInfo) {
                this.d_matchActive = true;
                this.d_currentMatch = matchName;
                matchInfo.active = true;

                this.emit('activeMatchChanged', matchName);
            }
        }
    }

    startMode(matchName, mode, time) {
        var startTime = Date.now();
        var modeTimer = setInterval(() => {
            var currTime = Date.now();
            if (currTime - startTime > time) {
                // done
                var matchInfo = this.getMatchInfo(matchName);
                if (mode === 'auto') {
                    matchInfo.autoComplete = true;
                }
                else {
                    matchInfo.teleopComplete = true;
                }
                this.emit('timeRemainingChanged', mode, '00:00');
                this.emit('modeComplete', mode);

                if (mode === 'auto') {
                    matchInfo.autoComplete = true;
                }
                else {
                    matchInfo.teleopComplete = true;
                }

                clearInterval(modeTimer);
            }
            else {
                var timeRemaining = time - (currTime - startTime);
                var timeRemainingSec = Math.floor(timeRemaining / 1000);
                var secondsPart = timeRemainingSec % 60;
                var minutesPart = parseInt(timeRemainingSec / 60, 10);
                
                var timeString = '';
                var minString = '';
                var secString = '';
                if (minutesPart < 10) {
                    minString = '0' + minutesPart;
                }
                else {
                    minString = minutesPart;
                }

                if (secondsPart < 10) {
                    secString = '0' + secondsPart;
                }
                else {
                    secString = secondsPart;
                }

                this.emit('timeRemainingChanged', mode, minString + ':' + secString, timeRemainingSec);
            }
        }, 500);
    }
    startAutoMode(matchName) {
         this.startMode(matchName, 'auto', 30000);
    }

    startTeleopMode(matchName) {
        this.startMode(matchName, 'teleop', 180000);
    }

    handleMatchComplete(matchName, complete) {

    }

    handleScoreUpdate(matchName, team, score) {

    }
};

module.exports = ScoreManager;