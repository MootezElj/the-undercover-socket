const request = require('request');
const config = require('../config/Config')
const backUrl = config.backUrl

exports.getPlayers = function getPlayers() {
  console.log('getting players');
  return new Promise((resolve, reject) => {
    request(backUrl+'/api/players', { json: true }, (err, res, body) => {
      if (err) reject(err)
      resolve(body)
      return res
    });
  });
}

exports.createPlayer =async function createPlayer(player) {
  console.log('getting player by username');
  return new Promise((resolve, reject) => {
    request.post(backUrl+'/api/players/add',{body:player,json:true}, (err, res,body) => {
      if (err) reject(err)
      resolve(body)
      return res
    });
  });
}



exports.loginPlayer = async function loginPlayer(player) {
  return new Promise((resolve, reject) => {
    request.post(backUrl+'/api/players/login',{body:player,json:true}, (err, res,body) => {
      if (err) reject(err)
      if (res.statusCode == 200)
        resolve(body)
      else
        reject('wrong credentials !')
      return res
    });
  });
}

// exports.getPlayerByUsername = async function getPlayerByUsername(username) {
//   return new Promise((resolve, reject) => {
//     request(backUrl+'/api/players/' + username, { json: true }, (err, res, body) => {
//       if (res.statusCode != 200) {
//         reject('User does not exist')
//       }
//       resolve(body)
//       return res.body;
//     });
//   });
// }

exports.getPlayerByUsername = async function getPlayerByUsername(username) {
  console.log('getting player by username');
  return new Promise((resolve, reject) => {
    request(backUrl+'/api/players/' + username, { json: true }, (err, res, body) => {
      console.log(res)
      if (res.statusCode != 200) {
        reject('User does not exist')
      }
      resolve(body)
      return res.body;
    });
  });
}

exports.updateWordRole = async function updateWordRole(playerId, isUndercover, isMrWhite, word, wordIcon) {
  console.log(playerId, isUndercover, isMrWhite, word, wordIcon);
  return new Promise((resolve, reject) => {
    request.put(backUrl+'/api/players/wordAndRole/'
    , { body:{
      playerId: playerId
      , isUndercover: isUndercover
      , isMrWhite: isMrWhite
      ,word: word
      , wordIcon: wordIcon
    }, json: true }, (err, res, body) => {
    if (err) reject(err)
    resolve(body)
    return res
  });
});
}