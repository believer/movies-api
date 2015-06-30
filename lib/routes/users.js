var db = require('../db').r;

function list(req, res, next) {
  db.table('users')
    .limit(50)
    .run(db.conn)
    .then(function (cursor) { return cursor.toArray() })
    .then(function (movies) {
      res.send(movies);
      return next();
    })
    .catch(next);
}

function details(req, res, next) {
  db.table('users')
    .get(req.params.id)
    .run(db.conn)
    .then(function (movies) {
      res.send(movies);
      return next();
    })
    .catch(next);
}

function movies(req, res, next) {
  var skip = req.query.skip || 0;
  var limit = req.query.limit || 50;

  db.table('seen')
    .getAll(req.params.id, { index:'user' })
    .map(function (user) {
      return {
        movies: user('movies').slice(skip,limit),
        user: user('user'),
        meta: {
          skip: skip,
          limit: limit,
          total: user('movies').count()
        }
      }
    })
    .merge(function (user) {
      return {
        movies: user('movies')
        .map(function (movie) {
          return db.table('movies')
            .get(movie)
        })
      }
    })
    .run(db.conn)
    .then(function (cursor) { return cursor.toArray() })
    .then(function (movies) {
      res.send(movies);
      return next();
    })
    .catch(next);
}

module.exports = {
  list: list,
  details: details,
  movies: movies
};
