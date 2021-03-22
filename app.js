const Express = require('express')();
const Http = require('http').Server(Express);
const SocketIo = require('socket.io')(Http);
const playerService = require('./services/PlayerService')
const authService = require('./services/AuthService')
const roomService = require('./services/RoomService');
const wordCoupleService = require('./services/WordCoupleService');
const Utils = require('./utils/Utils');


var roomsPlayersTracker = [];

SocketIo.on('connection', socket => {
    console.log('connected to socket !');
    socket.on('loginUserRequest', ({ username, password }) => {
        playerService.loginPlayer({ username: username, password: password }).then(res => {

            authService.authPlayer(username, res.id).then(token => {
                if (token) {
                    socket.emit('userToken', token);
                }
                else
                    socket.emit('userToken', null);
            });
        }).catch(err => {
            console.log('error = ', err);
            socket.emit('wrongCredentials', true);
        });
    });

    socket.on('verifyUserToken', token => {
        //result is true or false
        socket.emit('canAccess', authService.checkPlayerToken(token));
    });

    socket.on('createRoom', obj => {
        const token = obj.token;
        var room = obj.room;
        var ownerUsername;
        //If the token is available
        //we get the username
        // and then create a room
        if (authService.checkPlayerToken(token)) {
            ownerUsername = authService.getPlayerByToken(token).username;
            ownerId = authService.getPlayerByToken(token).playerId;
            room.owner.username = ownerUsername;
            room.owner.id = ownerId;
            roomService.createRoom(room).then(result => {
                socket.join(room.name);
                SocketIo.sockets.emit('newRoomCreated');
                socket.emit('roomJoined', result.joinId);
            }).catch(err => {
                console.log(err)
            });
        }
    })


    //This happens after the player has subscriped to the room
    //If a player wants to join a room we have to
    //verify the player's token and
    //verify if the player resides in the players array in the room document (in the database)
    socket.on('joinRoom', ({ roomJoinId, token }) => {
        //verification of player's token
        if (authService.checkPlayerToken(token)) {
            usernamePlayer = authService.getPlayerByToken(token).username;
            playerService.getPlayerByUsername(usernamePlayer).then(current_player => {
                roomService.getRoomByJoinId(roomJoinId).then(room => {
                    var exists = false;
                    room.players.forEach(player => {
                        if (player.username == usernamePlayer) {
                            exists = true;
                            socket.join(roomJoinId);
                            SocketIo.to(roomJoinId).emit('playerJoined', { roomPlayers: room.players, newPlayerUsername: usernamePlayer });
                            current_player.isReady = player.isReady;
                            socket.emit('roomJoinApproved', { room: room, player: current_player });
                        }
                    });
                    if (exists == false)
                        socket.emit("no_privileges", "You have no priveleges");
                }).catch(err => {
                    console.log(err);
                })
            });
        }
        else {
            socket.emit("no_privileges", "You have no priveleges");
        }
    })

    socket.on('getRooms', token => {
        //verification of player's token
        if (authService.checkPlayerToken(token)) {
            roomService.getRooms().then(res => {
                socket.emit('ApprovedGetRooms', res)
            });
        }
    });

    //From room list after joining a room and providing a password
    socket.on('subscribeToRoom', ({ token, password, joinId }) => {
        if (authService.checkPlayerToken(token)) {
            player = authService.getPlayerByToken(token);
            //check if the user is currently in the room, if so redirect him
            //if not, alter the players in the room and add the current player
            roomService.getRoomByJoinId(joinId).then(room => {
                if (password == room.password && !room.players.find(p => p.username == player.username))
                    roomService.addPlayerToRoom(player.playerId, room.id, player.username).then(res => {
                        room.players.push({ id: player.playerId, username: player.username, isReady: false });
                        SocketIo.emit('playerJoinedRoom', { updatedRoom: room });
                        socket.emit('subscriptionApproved', room.joinId);
                    }).catch(err => {
                        console.log(err)
                    });
                else if (password != room.password)
                    socket.emit('wrong_room_password', 'wrong room password');
                else
                    socket.emit('subscriptionApproved', room.joinId);
            });

        }
    });

    socket.on('leaveRoom', ({ token, roomJoinId }) => {
        if (authService.checkPlayerToken(token)) {
            usernamePlayer = authService.getPlayerByToken(token).username;
            playerId = authService.getPlayerByToken(token).playerId;
            roomService.getRoomByJoinId(roomJoinId).then(room => {
                roomService.removePlayerFromRoom(room.id, usernamePlayer, playerId).then(res => {
                    var index = room.players.map(function (p) { return p.username; }).indexOf(usernamePlayer);
                    if (index > -1)
                        room.players.splice(index, 1);
                    SocketIo.to(roomJoinId).emit('playerRemoved', { room: room, player: usernamePlayer });
                }).catch(err => {
                    console.log(err)
                });

            });
        }
    });


    socket.on('kickPlayer', ({ token, roomJoinId, usernameKickedPlayer }) => {
        if (authService.checkPlayerToken(token)) {
            usernamePlayer = authService.getPlayerByToken(token).username;
            playerId = authService.getPlayerByToken(token).playerId;
            roomService.getRoomByJoinId(roomJoinId).then(room => {
                //checks if the banner is really the owner of the room
                if (room.owner.username == usernamePlayer) {
                    roomService.removePlayerFromRoom(playerId, room.id, usernameKickedPlayer).then(res => {
                        var index = room.players.map(function (p) { return p.username; }).indexOf(usernameKickedPlayer);
                        if (index > -1)
                            room.players.splice(index, 1);
                        SocketIo.to(roomJoinId).emit('playerKicked', { room: room, kickedPlayer: usernameKickedPlayer });
                    }).catch(err => {
                        console.log(err)
                    });
                }
            })

        }
    });

    socket.on('getPlayer', token => {
        if (authService.checkPlayerToken(token)) {
            usernamePlayer = authService.getPlayerByToken(token).username;
            playerService.getPlayerByUsername(usernamePlayer).then(player =>
                socket.emit('updatePlayer', player));
        }
    });

    socket.on('playerReadyUready', ({ token, isReady, room, playAgain }) => {

        if (authService.checkPlayerToken(token)) {
            var usernamePlayer = authService.getPlayerByToken(token).username;
            playerId = authService.getPlayerByToken(token).playerId;
            roomService.playerReadyUnready(playerId, room.id, usernamePlayer, isReady).then(player => {
                var index = room.players.map(function (p) { return p.username; }).indexOf(usernamePlayer);
                room.players[index] = player;
                if (playAgain) {
                    roomService.allPlayersNotReady(room.id).then(res => {
                        room.allPlayersAreReady = false;
                        room.status = 'Waiting';
                        for (let player of room.players) {
                            roomService.playerReadyUnready(player.id, room.id, player.username, false).then();
                        }
                        SocketIo.to(room.joinId).emit('playAgainNotReady', { username: usernamePlayer, room: room });
                    })
                }
                else {
                    var allPlayersAreReady = true;
                    room.players.forEach(p => {
                        if (!p.isReady) {
                            allPlayersAreReady = false;
                        };
                    });
                    if (allPlayersAreReady)
                        roomService.allPlayersAreReady(room.id).then(res => {
                            room.allPlayersAreReady = true;
                            room.status = 'Ready';
                            SocketIo.to(room.joinId).emit('AllPlayersAreReady', room);
                        });
                }
                SocketIo.to(room.joinId).emit('playerIsReadyUnready', room);
            }).catch(err => {
                console.log('err');
            })

        }
    });




    socket.on('startGame', ({ token, room }) => {

        if (authService.checkPlayerToken(token)) {
            player = authService.getPlayerByToken(token);
            //we must check wether the requester is the real owner of the room
            if (player.username == room.owner.username) {
                // we first get all the words from the database
                wordCoupleService.getWordCouples().then(words => {

                    //we need to generate a random number between 1 --> length of words
                    //and repeat the cycle until the words is not in the room's chosen words
                    var wordIndex;
                    do {
                        wordIndex = Utils.randomIntFromInterval(1, words.length) - 1;
                    } while (room.chosenWords.findIndex(word => word.id == words[wordIndex].id) > -1);
                    var chosenWord = words[wordIndex];

                    //generating the undercover player index
                    var undercoverIndex = Utils.randomIntFromInterval(1, room.players.length) - 1;

                    //generating MrWhite index
                    //it has to be different from the undercover index
                    do {
                        var mrWhiteIndex = Utils.randomIntFromInterval(1, room.players.length) - 1;
                    } while (mrWhiteIndex == undercoverIndex);


                    for (let player of room.players) {
                        roomService.playerReadyUnready(player.id, room.id, player.username, false).then(res => {
                        });
                    }


                    //Assingning a word for each player
                    var roomPlayers = room.players;
                    for (let player of roomPlayers) {
                        //if the player is undercover we update his data accordinly
                        if (player == roomPlayers[undercoverIndex]) {
                            playerService.updateWordRole(player.id, true
                                , false, chosenWord.undercoverWord, chosenWord.undercoverWordIcon).then();
                        }
                        else if (player == roomPlayers[mrWhiteIndex]) {
                            playerService.updateWordRole(player.id, false
                                , true, 'none', 'none').then();
                        }
                        // If the player is a standard player we assign him his word
                        else {
                            playerService.updateWordRole(player.id, false
                                , false, chosenWord.standardWord, chosenWord.standardWordIcon).then();
                        }
                    }
                    //End assingning a word for each player

                    //Updating the room status
                    // since the game has started
                    roomService.updateRoomStatusAndChosenWord(room.id, 'Game Started', chosenWord.id).then(res);


                    let roomTracker = {
                        roomId: room.id,
                        players: room.players,
                        toPlayPlayers: room.players,
                        //Emited players is to check if all players have emited the reequest
                        //Only then we will emit the response
                        mrWhite: '',
                        undercover: '',
                        currentlyVoting: false,
                        votes: []
                    }


                    let toPlayPlayers = roomTracker.toPlayPlayers;
                    // let votes = roomTracker.votes;
                    let roomTrackerIndex;
                    //Room initilization
                    roomTrackerIndex = roomsPlayersTracker.findIndex(r => r.roomId == room.id);
                    if (roomTrackerIndex == -1)
                        roomsPlayersTracker.push(roomTracker);
                    else
                        roomsPlayersTracker[roomTrackerIndex] = roomTracker;

                    let round = 0;
                    let timeLeft = 6;
                    let beforeFirstPlayerTimer = false;
                    let playerIndex = 0;
                    let voteResult = false;
                    var phase = 'beforeWords';
                    //We make 
                    let gameInterval = setInterval(() => {
                        timeLeft--;
                        if (timeLeft != 0)
                            SocketIo.to(room.joinId).emit('roundTime', { roomTime: timeLeft, index: playerIndex, toPlayPlayers: toPlayPlayers, votes: roomTracker.votes, phase: phase, mrWhite: roomTracker.mrWhite, undercover: roomTracker.undercover });

                        //If it's the first round
                        //First if to get in
                        if (round == 0 && !beforeFirstPlayerTimer) {
                            if (timeLeft == 0) {
                                SocketIo.to(room.joinId).emit('gameStarted', room);
                                timeLeft = 11;
                                //If the first's round timer ends we go to round 2
                                beforeFirstPlayerTimer = true;
                                phase = 'beforeFirstPlayer'
                            }

                        }
                        //If it's the first player we will keep decrimenting the time
                        // until it hits 0 we will start the round
                        else if (beforeFirstPlayerTimer) {
                            if (timeLeft == 0) {
                                round = 1;
                                //To change to 21
                                timeLeft = 21;
                                beforeFirstPlayerTimer = false;
                                // we will go back to playing
                                phase = 'playing';
                            }

                        }


                        else if (roomTracker.currentlyVoting) {
                            if ((timeLeft == 0) || (roomTracker.votes.length == roomTracker.toPlayPlayers.length)) {
                                roomTracker.currentlyVoting = false;
                                //To change to 21

                                var maxUsername = '';
                                var maxNb = 0;
                                var nb;
                                var username = '';

                                if (roomTracker.votes.length > 0) {
                                    for (let i = 0; i < roomTracker.votes.length; i++) {
                                        nb = 0;
                                        for (let j = 0; j < roomTracker.votes.length; j++) {
                                            if (j != i)
                                                // If there is a player who has the max nb of pick
                                                // We will be pass him
                                                // If not (If we have [zexy,supslayer]) we pick  random from roomTracker.votes
                                                // in other words we pick a random player from [zexy,supslayer]
                                                if (roomTracker.votes[i].elected == roomTracker.votes[j].elected) {
                                                    nb++;
                                                    username = roomTracker.votes[j].elected;
                                                }

                                        }
                                        if ((nb > maxNb) && (username != maxUsername) && (username != undefined && maxUsername != undefined)) {
                                            maxNb = nb;
                                            maxUsername = username;
                                        }
                                    }


                                    if (maxUsername == '' && roomTracker.votes.length > 0) {
                                        let randomPlayerIndex = Utils.randomIntFromInterval(1, roomTracker.votes.length) - 1;
                                        maxUsername = roomTracker.votes[randomPlayerIndex].elected;
                                    }
                                    playerService.getPlayerByUsername(maxUsername).then(p => {
                                        if (maxUsername != 'none') {
                                            roomTracker.toPlayPlayers
                                                .splice(roomTracker
                                                    .toPlayPlayers.findIndex(player => player.username == maxUsername), 1);

                                            var role = 'standard'
                                            if (p.isMrWhite) {
                                                roomTracker.mrWhite = maxUsername;
                                                role = 'mrWhite';
                                            }
                                            else if (p.isUndercover) {
                                                roomTracker.undercover = maxUsername;
                                                role = 'undercover';
                                            }


                                            let win;

                                            if ((roomTracker.mrWhite != '' && roomTracker.undercover != '') || (roomTracker.toPlayPlayers.length < 3)) {
                                                win = (roomTracker.mrWhite != '' && roomTracker.undercover != '' ? true : false);
                                                roomService.updateRoomStatus(roomTracker.roomId, 'Game Ended').then(res => {
                                                    clearInterval(gameInterval);
                                                    SocketIo.to(room.joinId).emit('gameEnded', { stdWin: win })
                                                });

                                            }

                                            else {
                                                voteResult = true;
                                                phase = 'voteResult';
                                                timeLeft = 11;
                                                playerIndex = 0;
                                                SocketIo.to(room.joinId).emit('voteResult', { role: role, username: maxUsername });
                                            }
                                        }
                                        else {
                                            voteResult = true;
                                            phase = 'voteResult';
                                            timeLeft = 11;
                                            playerIndex = 0;
                                            SocketIo.to(room.joinId).emit('voteResult', { role: 'none', username: 'none' });
                                        }
                                    })

                                    // we will go back to playing
                                    roomTrackerIndex = roomsPlayersTracker.findIndex(r => r.roomId == room.id);
                                    roomTracker.votes = [];
                                    roomsPlayersTracker[roomTrackerIndex].votes = [];
                                }

                                else if (roomTracker.votes.length == 0) {
                                    voteResult = true;
                                    phase = 'voteResult';
                                    timeLeft = 11;
                                    playerIndex = 0;
                                    SocketIo.to(room.joinId).emit('voteResult', { role: 'none', username: 'none' });
                                }



                            }

                        }
                        else if (voteResult) {
                            if (timeLeft == 0) {
                                voteResult = false;
                                maxNb = 0;
                                phase = 'playing';
                                //to change to 21
                                timeLeft = 21;
                            }
                        }

                        else if ((roomTracker.mrWhite == '' || roomTracker.undercover == '') && roomTracker.toPlayPlayers.length >= 3) {

                            if (timeLeft == 0) {
                                //21
                                timeLeft = 21;
                                playerIndex++;
                                if (playerIndex == toPlayPlayers.length - 1)
                                    phase = 'lastPlayerPlaying'
                            }
                            if (playerIndex == toPlayPlayers.length) {
                                roomTracker.currentlyVoting = true;
                                //to change to 61
                                timeLeft = 61;
                                phase = 'voting'
                            }
                        }

                    }, 1000);



                    //Last
                })
            }

        }
    });


    socket.on('vote', ({ room, voterToken, elected }) => {
        if (authService.checkPlayerToken(voterToken)) {
            var playerUsername = authService.getPlayerByToken(voterToken).username;
            let roomTrackerIndex = roomsPlayersTracker.findIndex(r => r.roomId == room.id);

            //If the player has the right to vote
            if (roomsPlayersTracker[roomTrackerIndex].toPlayPlayers.find(p => p.username == playerUsername)) {
                if (roomsPlayersTracker[roomTrackerIndex].votes.find(p => playerUsername == p.voter) == undefined)
                    roomsPlayersTracker[roomTrackerIndex].votes.push({
                        voter: playerUsername,
                        elected: elected
                    });
                SocketIo.to(room.joinId).emit('voteSubmited', roomsPlayersTracker[roomTrackerIndex].votes);
            }


        }
    });


    socket.on('getPlayerRoles', ({ playerToken, room }) => {
        if (authService.checkPlayerToken(playerToken)) {
            let playersAndRoles = [];
            playerService.getPlayers().then(players => {
                for (let player of players) {
                    if (room.players.findIndex(p => p.username == player.username) > -1) {
                        playersAndRoles.push({
                            username: player.username,
                            isUndercover: player.isUndercover,
                            isMrWhite: player.isMrWhite
                        });
                    }
                }
                SocketIo.to(room.joinId).emit('playersAndRole', playersAndRoles)
            });



        }

    });

    socket.on('checkAvailableUsername', username => {
        playerService.getPlayerByUsername(username).then(res => {
            var available = false;
            if (res == 'User not found')
                available = true;
            socket.emit('usernameAvailable', available);
        }
        ).catch(err => {
            socket.emit('usernameAvailable', true);
        })
    });

    socket.on('createAccount', ({ username, email, password }) => {
        playerService.createPlayer({ username, email, password }).then(res => {
            socket.emit('accountCreated');
        }).catch(err => {
            console.log(err);
        })
    });


});


const port = process.env.PORT || 3001;
Http.listen(port, () => {
    console.log('Listening on port ', port);
});



