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
            redScore: 0,
            blueScore: 0,
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
                red: matchInfo.redScore,
                blue: matchInfo.blueScore
            };
        }

        return {
            red: 0,
            blue: 0
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

    handleMatchComplete(matchName, complete) {

    }

    handleScoreUpdate(matchName, team, score) {

    }
};

module.exports = ScoreManager;