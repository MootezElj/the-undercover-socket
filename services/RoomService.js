const request = require('request');
const config = require('../config/Config')
const backUrl = config.backUrl

exports.createRoom =async function createRoom(room) {
    console.log('getting player by username');
    return new Promise((resolve, reject) => {
      request.post(backUrl+'/api/rooms',{body:room,json:true}, (err, res,body) => {
        if (err) reject(err)
        resolve(body)
        return res
      });
    });
}


exports.getRoomByJoinId =async function getRoomByJoinId(roomJoinId) {
  return new Promise((resolve, reject) => {
      request(backUrl+'/api/rooms/joinId/'+roomJoinId, { json: true }, (err, res,body) => {
        resolve(body)
        return res.body;
      });
  }).catch(err => console.log(err));
}


exports.getRooms = function getRooms() {
  console.log('getting rooms');
  return new Promise((resolve, reject) => {
      request(backUrl+'/api/rooms', { json: true }, (err, res,body) => {
        if (err) reject(err)
        resolve(body)
        return res
      });
  }).catch(err => console.log(err));
}


exports.addPlayerToRoom = function addPlayerToRoom(playerId,roomId,username) {
  console.log('getting rooms');
  return new Promise((resolve, reject) => {
      request.put(backUrl+'/api/rooms/addPlayer/'+playerId+'/'+roomId+'/'+username, { json: true }, (err, res,body) => {
        if (err) reject(err)
        resolve(body)
        return res
      });
  });
}

exports.removePlayerFromRoom = function removePlayerFromRoom(roomId,username,playerId) {
  return new Promise((resolve, reject) => {
      request.put(backUrl+'/api/rooms/removePlayer/'+playerId+'/'+roomId+'/'+username, { json: true }, (err, res,body) => {
        if (err) reject(err)
        resolve(body)
        return res
      });
  });
}



exports.playerReadyUnready = function playerReadyUnready(playerId,roomId,playerUsername,isReady) {
  return new Promise((resolve, reject) => {
      request.put(backUrl+'/api/rooms/playerUnreadyReady/'+playerId+'/'+isReady+'/'+playerUsername+'/'+roomId, { json: true }, (err, res,body) => {
        if (err) reject(err)
        resolve(body)
        return res.body;
      });
  });
}




exports.allPlayersAreReady = function allPlayersAreReady(roomId) {
  return new Promise((resolve, reject) => {
      request.put(backUrl+'/api/rooms/switchAllPlayersAreReady/'+roomId, { json: true }, (err, res,body) => {
        if (err) reject(err)
        resolve(body)
        return res.body;
      });
  });
}


exports.allPlayersNotReady = function allPlayersNotReady(roomId) {
    return new Promise((resolve, reject) => {
        request.put(backUrl+'/api/rooms/switchAllPlayersNotReady/'+roomId, { json: true }, (err, res,body) => {
            if (err) reject(err)
            resolve(body)
            return res.body;
        });
    });
}


exports.updateRoomStatusAndChosenWord = function updateRoomStatusAndChosenWord(roomId,status,chosenWord) {
  return new Promise((resolve, reject) => {
      request.put(backUrl+'/api/rooms/updateStatusAndChosenWord/'+roomId+'/'+status+'/'+chosenWord, { json: true }, (err, res,body) => {
        if (err) reject(err)
        resolve(body)
        return res;
      });
  });
}


exports.updateRoomStatus = function updateRoomStatus(roomId,status,chosenWord) {
    return new Promise((resolve, reject) => {
        request.put(backUrl+'/api/rooms/updateStatus/'+roomId+'/'+status, { json: true }, (err, res,body) => {
            if (err) reject(err)
            resolve(body)
            return res;
        });
    });
}

