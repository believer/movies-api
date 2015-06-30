var db = require('../db').r;

function list (req, res, next) {
  db.table('movies')
    .limit(50)
    .run(db.conn)
    .then(function (cursor) { return cursor.toArray() })
    .then(function (movies) {
      res.send(movies);
      return next();
    })
    .catch(next);
}

function details (req, res, next) {
  db.table('movies')
    .get(req.params.id)
    .merge(function (movie) {
      return {
        cast: getNames('actors', movie),
        composers: getNames('composers', movie)
      };
    })
    .run(db.conn)
    .then(function (movies) {
      res.send(movies);
      return next();
    })
    .catch(next);
}

function add (req, res, next) {
  return next();
}

module.exports = {
  list: list,
  details: details,
  add: add
};
