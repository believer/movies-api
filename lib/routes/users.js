var db = require('../db').r;

function list(req, res, next) {
  db.table('users')
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

function movies(req, res, next) {
  db.table('seen')
    .getAll(req.params.id, { index:'user' })
    .merge(function (user) {
      return {
        movies: user('movies').map(function (movie) {
          return r.db('api').table('movies')
            .get(movie)
        })
      }
    })
    .run(db.conn)
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
