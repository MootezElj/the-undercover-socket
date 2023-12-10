const request = require('request');
const config = require('../config/Config')
const backUrl = config.backUrl
exports.createWordCouple =async function createWordCouple(wordCouple) {
    return new Promise((resolve, reject) => {
      request.post(backUrl+'/api/wordCouples',{body:room,json:true}, (err, res,body) => {
        if (err) reject(err)
        resolve(body)
        return res
      });
    });
}

exports.getWordCouples = function getWordCouples() {
  return new Promise((resolve, reject) => {
      request(backUrl+'/api/wordCouples', { json: true }, (err, res,body) => {
        if (err) reject(err)
        resolve(body)
        return res
      });
  });
}
