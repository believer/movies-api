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

function makeHyperMedia (userid, skip, limit, total) {
  var hypermedia = {};
  var base = 'http://localhost:3000/users/' + userid + '/movies';

  if (skip < total) {
    hypermedia['next'] = {
      href: base + '?skip=' + (skip + 50)
    };
  }

  if (skip > 0) {
    hypermedia['prev'] = {
      href: base + '?skip=' + (skip - 50)
    };
  }

  return hypermedia;
}

function movies(req, res, next) {
  var skip  = parseInt(req.query.skip, 10) || 0;
  var limit = parseInt(req.query.limit, 10) || 50;
  var id    = req.params.id;

  db.table('seen')
    .getAll(id, { index:'user' })
    .map(function (user) {
      return {
        movies: user('movies').skip(skip).limit(limit),
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
      movies[0]._links = makeHyperMedia(id, skip, limit, movies[0].meta.total);
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
