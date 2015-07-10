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
               id: movie
             };
           })
           .merge(function (movie) {
             return {
               dates: db.table('views')
               .getAll(id, { index: 'user' })
               .filter(function (views) {
          				return views('movie').eq(movie('id'));
               })
               .pluck('date')
               .coerceTo('array')
             };
           })
           .merge(function (movie) {
            return {
              rating: db.table('ratings')
                .getAll(id, { index: 'user' })
                .filter(function (ratings) {
                  return ratings('movie').eq(movie('id'));
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
