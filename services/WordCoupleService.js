const request = require('request');

exports.createWordCouple =async function createWordCouple(wordCouple) {
    return new Promise((resolve, reject) => {
      request.post('https://back-express.adaptable.app/api/wordCouples',{body:room,json:true}, (err, res,body) => {
        if (err) reject(err)
        resolve(body)
        return res
      });
    });
}

exports.getWordCouples = function getWordCouples() {
  return new Promise((resolve, reject) => {
      request('https://back-express.adaptable.app/api/wordCouples', { json: true }, (err, res,body) => {
        if (err) reject(err)
        resolve(body)
        return res
      });
  });
}
