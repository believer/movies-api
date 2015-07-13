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
            skip: skip,
            limit: limit,
            movies: user('movies').count()
          },
          movies: user('movies')
            .skip(skip)
            .limit(limit)
            .map(function (movie) {
              return {
                id: movie
              };
            })
            .merge(function (movie) {
              return {
                dates: db.table('views')
                  .getAll(movie('id'), { index: 'movie' })
                  .filter(function (views) {
            			  return views('user').eq(id);
                  })
                  .pluck('date')
                  .coerceTo('array')
              };
            })
            .merge(function (movie) {
              return {
                rating: db.table('ratings')
                  .getAll(movie('id'), { index: 'movie' })
                  .filter(function (ratings) {
                    return ratings('user').eq(id);
                  })
                 	.pluck('rating')
                 	.coerceTo('array')('rating')
                  .reduce(function (left, right) {
                    return left.add(right);
                  })
              };
            })
            .merge(function (movie) {
              return db.table('movies')
                .get(movie('id'));
            })
        };
    })
    .run(db.conn)
    .then(function (cursor) { return cursor.toArray(); })
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
