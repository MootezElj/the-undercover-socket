const playerService = require('./services/PlayerService')
const authService = require('./services/AuthService')
const SocketIo = require('socket.io')(Http);



exports = module.exports = function (SocketIo) {
    SocketIo.sockets.on('connection', socket => {
        console.log('connected to socket !');
        socket.on('loginUserRequest', username => {
            playerService.getPlayerByUsername(username).then(result => {
                console.log('result  ', result)
                authService.authPlayer(username).then(token => {
                    if (token) {
                        console.log('login user request ', token)
                        socket.emit('userToken', token);
                    }
                    else
                        socket.emit('userToken', null);
                });
            }).catch(err => {
                console.log('error = ', err);
                socket.emit('falseUsername', true);
            });
        });


        socket.on('verifyUserToken', token => {
            //result is true or false
            socket.emit('canAccess', authService.checkPlayerToken(token));
        });
    });
}