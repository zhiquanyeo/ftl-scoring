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

        this.d_currentMatchRedScores = {
            auto: {},
            teleop: 0,
            penalties: 0
        };

        this.d_currentMatchBlueScores = {
            auto: {},
            teleop: 0,
            penalties: 0
        };
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
        socket.on('autoScore', (autoScoreData) => {
            var activeMatchInfo = this.getMatchInfo(this.getActiveMatchName());
            if (!activeMatchInfo) {
                return;
            }
            
            if (team === 'red') {
                this.d_currentMatchRedScores.auto = autoScoreData;
                var redScore = 0;
                if (autoScoreData.team1.baseline) {
                    redScore += 1;
                }
                if (autoScoreData.team1.penalty) {
                    redScore += 3;
                }
                if (autoScoreData.team1.goal) {
                    redScore += 5;
                }
                if (autoScoreData.team2.baseline) {
                    redScore += 1;
                }
                if (autoScoreData.team2.penalty) {
                    redScore += 3;
                }
                if (autoScoreData.team2.goal) {
                    redScore += 5;
                }

                activeMatchInfo.redAutoScore = redScore;
            }
            else {
                this.d_currentMatchBlueScores.auto = autoScoreData;
                var blueScore = 0;
                if (autoScoreData.team1.baseline) {
                    blueScore += 1;
                }
                if (autoScoreData.team1.penalty) {
                    blueScore += 3;
                }
                if (autoScoreData.team1.goal) {
                    blueScore += 5;
                }
                if (autoScoreData.team2.baseline) {
                    blueScore += 1;
                }
                if (autoScoreData.team2.penalty) {
                    blueScore += 3;
                }
                if (autoScoreData.team2.goal) {
                    blueScore += 5;
                }

                activeMatchInfo.blueAutoScore = blueScore;
            }

            this.emit('matchScoreChanged', activeMatchInfo.matchName, this.getMatchScore(activeMatchInfo.matchName));
            socket.broadcast.emit('autoScoreChanged', autoScoreData);
        });

        socket.on('teleopPoint', (pointVal) => {
            var activeMatchInfo = this.getMatchInfo(this.getActiveMatchName());
            if (!activeMatchInfo) {
                return;
            }

            if (team === 'red') {
                activeMatchInfo.redTeleopScore += pointVal;
            }
            else {
                activeMatchInfo.blueTeleopScore += pointVal;
            }

            this.emit('matchScoreChanged', activeMatchInfo.matchName, this.getMatchScore(activeMatchInfo.matchName));
        });

        socket.on('foulPoint', (pointVal) => {
            var activeMatchInfo = this.getMatchInfo(this.getActiveMatchName());
            if (!activeMatchInfo) {
                return;
            }

            if (team === 'red') {
                activeMatchInfo.redFouls += pointVal;
            }
            else {
                activeMatchInfo.blueFouls += pointVal;
            }

            this.emit('matchScoreChanged', activeMatchInfo.matchName, this.getMatchScore(activeMatchInfo.matchName));
        });

        socket.on('techFoulPoint', (pointVal) => {
            var activeMatchInfo = this.getMatchInfo(this.getActiveMatchName());
            if (!activeMatchInfo) {
                return;
            }

            if (team === 'red') {
                activeMatchInfo.redTechFouls += pointVal;
            }
            else {
                activeMatchInfo.blueTechFouls += pointVal;
            }

            this.emit('matchScoreChanged', activeMatchInfo.matchName, this.getMatchScore(activeMatchInfo.matchName));
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
            redFouls: 0, // points given to other team
            redTechFouls: 0, //points given to other team
            blueAutoScore: 0,
            blueTeleopScore: 0,
            blueOtherScore: 0,
            blueFouls: 0, //points given to other team
            blueTechFouls: 0, //points given to other team
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
                    other: matchInfo.redOtherScore,
                    fouls: matchInfo.redFouls,
                    techFouls: matchInfo.redTechFouls
                },
                blue: {
                    auto: matchInfo.blueAutoScore,
                    teleop: matchInfo.blueTeleopScore,
                    other: matchInfo.blueOtherScore,
                    fouls: matchInfo.blueFouls,
                    techFouls: matchInfo.blueTechFouls
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

    handleAutoScoreUpdate(matchName, team, score) {

    }

    handleTeleopScoreUpdate(matchName, team, score) {

    }
};

module.exports = ScoreManager;