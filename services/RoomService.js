const request = require('request');
const config = require('../config/Config')
exports.createRoom =async function createRoom(room) {
    console.log('getting player by username');
    return new Promise((resolve, reject) => {
      request.post('http://'+config.backEndURL+'/api/rooms',{body:room,json:true}, (err, res,body) => {
        if (err) reject(err)
        resolve(body)
        return res
      });
    });
}


exports.getRoomByJoinId =async function getRoomByJoinId(roomJoinId) {
  return new Promise((resolve, reject) => {
    console.log('http://'+config.backEndURL+'/api/rooms/joinId/'+roomJoinId);
      request('http://'+config.backEndURL+'/api/rooms/joinId/'+roomJoinId, { json: true }, (err, res,body) => {
        if (res.statusCode == 404)
        {
          reject('Room does not exist')
        }
        resolve(body)
        return res.body;
      });
  });
}


exports.getRooms = function getRooms() {
  console.log('getting rooms');
  return new Promise((resolve, reject) => {
      request('http://'+config.backEndURL+'/api/rooms', { json: true }, (err, res,body) => {
        if (err) reject(err)
        resolve(body)
        return res
      });
  });
}


exports.addPlayerToRoom = function addPlayerToRoom(playerId,roomId,username) {
  console.log('getting rooms');
  return new Promise((resolve, reject) => {
      request.put('http://'+config.backEndURL+'/api/rooms/addPlayer/'+playerId+'/'+roomId+'/'+username, { json: true }, (err, res,body) => {
        if (err) reject(err)
        resolve(body)
        return res
      });
  });
}

exports.removePlayerFromRoom = function removePlayerFromRoom(roomId,username,playerId) {
  return new Promise((resolve, reject) => {
      request.put('http://'+config.backEndURL+'/api/rooms/removePlayer/'+playerId+'/'+roomId+'/'+username, { json: true }, (err, res,body) => {
        if (err) reject(err)
        resolve(body)
        return res
      });
  });
}



exports.playerReadyUnready = function playerReadyUnready(playerId,roomId,playerUsername,isReady) {
  return new Promise((resolve, reject) => {
      request.put('http://'+config.backEndURL+'/api/rooms/playerUnreadyReady/'+playerId+'/'+isReady+'/'+playerUsername+'/'+roomId, { json: true }, (err, res,body) => {
        if (err) reject(err)
        resolve(body)
        return res.body;
      });
  });
}




exports.allPlayersAreReady = function allPlayersAreReady(roomId) {
  return new Promise((resolve, reject) => {
      request.put('http://'+config.backEndURL+'/api/rooms/switchAllPlayersAreReady/'+roomId, { json: true }, (err, res,body) => {
        if (err) reject(err)
        resolve(body)
        return res.body;
      });
  });
}


exports.allPlayersNotReady = function allPlayersNotReady(roomId) {
    return new Promise((resolve, reject) => {
        request.put('http://'+config.backEndURL+'/api/rooms/switchAllPlayersNotReady/'+roomId, { json: true }, (err, res,body) => {
            if (err) reject(err)
            resolve(body)
            return res.body;
        });
    });
}


exports.updateRoomStatusAndChosenWord = function updateRoomStatusAndChosenWord(roomId,status,chosenWord) {
  return new Promise((resolve, reject) => {
      request.put('http://'+config.backEndURL+'/api/rooms/updateStatusAndChosenWord/'+roomId+'/'+status+'/'+chosenWord, { json: true }, (err, res,body) => {
        if (err) reject(err)
        resolve(body)
        return res;
      });
  });
}


exports.updateRoomStatus = function updateRoomStatus(roomId,status,chosenWord) {
    return new Promise((resolve, reject) => {
        request.put('http://'+config.backEndURL+'/api/rooms/updateStatus/'+roomId+'/'+status, { json: true }, (err, res,body) => {
            if (err) reject(err)
            resolve(body)
            return res;
        });
    });
}

