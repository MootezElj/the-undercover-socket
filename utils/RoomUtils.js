const Utils = require('./utils/Utils');

exports.getRandomNotChosenBeforeWord = function getRandomNotChosenBeforeWord(words, room){
    var wordIndex;
    do {
        wordIndex = Utils.randomIntFromInterval(1, words.length) - 1;
    } while (room.chosenWords.findIndex(word => word.id == words[wordIndex].id) > -1);
}