var db = require('../db').r;
var hypermedia = require('../services/hypermedia');

function list(req, res, next) {
  db.table('users')
    .limit(50)
    .run(db.conn)
    .then(function (cursor) { return cursor.toArray(); })
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
  var skip  = parseInt(req.query.skip, 10) || 0;
  var limit = parseInt(req.query.limit, 10) || 50;
  var id    = req.params.id;

  db.table('seen')
    .getAll(id, { index:'user' })
    .map(function (user) {
      return {
        user: user('user'),
        id: user('id'),
        meta: {
          movies: user('movies').count()
        },
        movies: user('movies')
          .map(function (movie) {
            return {
              dates: movie('dates').orderBy(db.asc('date')),
              rating: movie('rating'),
              id: movie('id')
            };
          })
        	.orderBy(db.desc('dates'))
        	.skip(skip)
        	.limit(limit)
          .merge(function (movie) {
            return db.table('movies')
              .get(movie('id'));
          })
      };
    })
    .run(db.conn)
    .then(function (cursor) { return cursor.toArray() })
    .then(function (user) {
      user = user[0];
      user._links = hypermedia.user(id, skip, limit, user.meta.movies);
      res.send(user);
      return next();
    })
    .catch(next);
}

module.exports = {
  list: list,
  details: details,
  movies: movies
};
