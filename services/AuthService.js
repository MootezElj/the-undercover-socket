var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var jwtConfig = require('../config/Config');
const storage = require('node-persist');


exports.authPlayer =async function authPlayer(username,playerId) {
    if(username){
        token = jwt.sign({ username: username,playerId:playerId }, jwtConfig.secret,
            {
                expiresIn: '1 year',
                issuer: 'Mootez'
            });
        console.log("Player's token saved !");
    }
    else{
        console.log('Player username is invalid');
    }
    return token;
}

exports.checkPlayerToken = function checkPlayerToken(token){

    if (token){
        var result = true;  
            jwt.verify(token, jwtConfig.secret, function(err, decoded) {
                if (err) 
                {
                   result =false;
                }
              });
            return result;
        }
        return false;
}

exports.getPlayerByToken = function getPlayerByToken(token){
    return jwt.decode(token);
}


