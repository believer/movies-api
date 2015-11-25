var db = require('../db').r;
var _ = require('lodash');
var compileStats = require('../services/stats');

function addRatings (stats) {
  return new Promise(function (resolve, reject) {
    var ratingsArray = {
      ratings: [0,0,0,0,0,0,0,0,0,0,0]
    };

    db.table('ratings')
      .run(db.conn)
      .then(function (cursor) { return cursor.toArray(); })
      .then(function (ratings) {
        ratings.forEach(function (rating, i) {
          // Rating distribution
          ratingsArray.ratings[rating.rating]++;

          if (i === ratings.length -1) {
            resolve(_.merge(ratingsArray, stats));
          }
        });
      });

  });
}

module.exports = function (req, res, next) {
  db.table('movies')
    .run(db.conn)
    .then(function (cursor) { return cursor.toArray(); })
    .then(function (movies) {
      return compileStats(movies);
    })
    .then(addRatings)
    .then(function (data) {
      res.send(data);
    })
    .catch(next);
};
