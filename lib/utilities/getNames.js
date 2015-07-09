module.exports = function (array) {
  return new Promise(function (resolve, reject) {
    var map = array.map(function (arr) {
      return arr.name;
    });

    resolve(map);
  });
}
